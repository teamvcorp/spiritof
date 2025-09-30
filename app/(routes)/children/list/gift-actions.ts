"use server";

import { dbConnect } from "@/lib/db";
import { GiftOrder, GiftApprovalSettings } from "@/models/GiftOrder";
import { Child } from "@/models/Child";
import { Parent } from "@/models/Parent";
import { CatalogItem } from "@/models/CatalogItem";
import { auth } from "@/auth";
import { Types } from "mongoose";
import type { OrderType } from "@/types/giftFulfillment";

/**
 * Check if we're in the Christmas approval window (Dec 11-25)
 */
export async function isChristmasWindow(): Promise<boolean> {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Christmas window: December 11-25 each year
  const christmasStart = new Date(currentYear, 11, 11); // Dec 11
  const christmasEnd = new Date(currentYear, 11, 25, 23, 59, 59); // Dec 25
  
  return now >= christmasStart && now <= christmasEnd;
}

/**
 * Get Christmas window dates for current year
 */
export async function getChristmasWindow(year?: number) {
  const targetYear = year || new Date().getFullYear();
  
  return {
    year: targetYear,
    startDate: new Date(targetYear, 11, 11), // Dec 11
    endDate: new Date(targetYear, 11, 25, 23, 59, 59), // Dec 25
    isActive: await isChristmasWindow(),
    daysUntilStart: Math.max(0, Math.ceil((new Date(targetYear, 11, 11).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
  };
}

/**
 * Request a gift for a child
 */
export async function requestGift(
  childId: string,
  catalogItemId: string,
  orderType: OrderType,
  behaviorReason?: string,
  shippingAddress?: {
    recipientName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  await dbConnect();

  // Validate child belongs to parent
  const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
  if (!parent) {
    throw new Error("Parent not found");
  }

  const child = await Child.findOne({ 
    _id: new Types.ObjectId(childId), 
    parentId: parent._id 
  });
  if (!child) {
    throw new Error("Child not found or not authorized");
  }

  // Get catalog item
  const catalogItem = await CatalogItem.findById(catalogItemId);
  if (!catalogItem) {
    throw new Error("Gift not found in catalog");
  }

  // Calculate magic points cost (1:1 with USD)
  const magicPointsCost = Math.ceil(catalogItem.price || 0);

  // Check if child has enough magic points
  if (child.score365 < magicPointsCost) {
    throw new Error(`Not enough magic points. Need ${magicPointsCost}, have ${child.score365}`);
  }

  // Get or create gift approval settings
  let approvalSettings = await GiftApprovalSettings.findOne({ parentId: parent._id });
  if (!approvalSettings) {
    approvalSettings = await GiftApprovalSettings.create({
      parentId: parent._id,
      maxRewardGiftsPerYear: 2,
      maxRewardGiftPrice: 50,
      requireApprovalOver: 25,
      autoApproveRewards: false,
      autoApproveChristmas: true,
      emailOnGiftRequest: true,
      emailOnGiftShipped: true,
      emailOnGiftDelivered: true,
    });
  }

  // Validate reward gift limits for non-Christmas gifts
  if (orderType === "REWARD") {
    const currentYear = new Date().getFullYear();
    // Count used reward gifts for current year
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
    
    const usedRewardGifts = await GiftOrder.countDocuments({
      childId,
      orderType: "REWARD",
      status: { $in: ["APPROVED", "ORDERED", "SHIPPED", "DELIVERED"] },
      createdAt: { $gte: startOfYear, $lte: endOfYear }
    });
    
    if (usedRewardGifts >= approvalSettings.maxRewardGiftsPerYear) {
      throw new Error(`Maximum reward gifts (${approvalSettings.maxRewardGiftsPerYear}) already used this year`);
    }

    if (catalogItem.price && catalogItem.price > approvalSettings.maxRewardGiftPrice) {
      throw new Error(`Gift price ($${catalogItem.price}) exceeds maximum reward gift price ($${approvalSettings.maxRewardGiftPrice})`);
    }
  }

  // Validate Christmas gifts can only be requested in Christmas window
  if (orderType === "CHRISTMAS" && !(await isChristmasWindow())) {
    const window = await getChristmasWindow();
    throw new Error(`Christmas gifts can only be requested during Christmas window (December 11-25). Window opens in ${window.daysUntilStart} days.`);
  }

  // Use parent's address if no shipping address provided
  const finalShippingAddress = shippingAddress || {
    recipientName: child.displayName,
    street: "123 North Pole Way", // Default for demo
    city: "Christmas Town",
    state: "North Pole",
    zipCode: "00001",
    country: "US",
  };

  // Create gift order
  const giftOrder = await GiftOrder.create({
    childId: child._id,
    parentId: parent._id,
    catalogItemId: catalogItem._id,
    orderType,
    magicPointsCost,
    giftTitle: catalogItem.title,
    giftBrand: catalogItem.brand,
    giftPrice: catalogItem.price || 0,
    giftImageUrl: catalogItem.imageUrl,
    retailerProductUrl: catalogItem.productUrl,
    retailer: catalogItem.retailer,
    recipientName: finalShippingAddress.recipientName,
    shippingAddress: finalShippingAddress,
    isChristmasEligible: orderType === "CHRISTMAS",
    christmasYear: orderType === "CHRISTMAS" ? new Date().getFullYear() : undefined,
    behaviorReason,
  });

  // Determine initial approval status
  let shouldAutoApprove = false;
  let approvedBy: "SYSTEM" | "PARENT" | undefined;

  if (orderType === "CHRISTMAS" && approvalSettings.autoApproveChristmas && (await isChristmasWindow())) {
    shouldAutoApprove = true;
    approvedBy = "SYSTEM";
  } else if (orderType === "REWARD" && approvalSettings.autoApproveRewards && 
             catalogItem.price && catalogItem.price <= approvalSettings.requireApprovalOver) {
    shouldAutoApprove = true;
    approvedBy = "SYSTEM";
  }

  if (shouldAutoApprove) {
    // Update gift order status
    giftOrder.status = "APPROVED";
    giftOrder.approvedAt = new Date();
    giftOrder.approvedBy = approvedBy;
    giftOrder.approvedAt = new Date();
    await giftOrder.save();

    // Deduct magic points immediately upon approval
    child.score365 = Math.max(0, child.score365 - magicPointsCost);
    await child.save();
  }

  return {
    success: true,
    giftOrderId: giftOrder._id.toString(),
    status: giftOrder.status,
    magicPointsDeducted: shouldAutoApprove ? magicPointsCost : 0,
    remainingMagicPoints: shouldAutoApprove ? child.score365 : child.score365,
    requiresApproval: !shouldAutoApprove,
    message: shouldAutoApprove 
      ? `Gift approved! ${magicPointsCost} magic points deducted.`
      : `Gift request submitted for parent approval.`,
  };
}

/**
 * Approve or reject a gift request (parent action)
 */
export async function approveGiftRequest(
  giftOrderId: string,
  approved: boolean,
  note?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  await dbConnect();

  const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
  if (!parent) {
    throw new Error("Parent not found");
  }

  const giftOrder = await GiftOrder.findOne({
    _id: new Types.ObjectId(giftOrderId),
    parentId: parent._id,
  });

  if (!giftOrder) {
    throw new Error("Gift order not found or not authorized");
  }

  if (giftOrder.status !== "PENDING_APPROVAL") {
    throw new Error("Gift order is not pending approval");
  }

  if (approved) {
    // Deduct magic points from child
    const child = await Child.findById(giftOrder.childId);
    if (!child) {
      throw new Error("Child not found");
    }

    if (child.score365 < giftOrder.magicPointsCost) {
      throw new Error("Child no longer has enough magic points");
    }

    child.score365 = Math.max(0, child.score365 - giftOrder.magicPointsCost);
    await child.save();

    // Update gift order status
    giftOrder.status = "APPROVED";
    giftOrder.approvedAt = new Date();
    giftOrder.parentApprovalNote = note;
    giftOrder.approvedBy = "PARENT";
    await giftOrder.save();

    return {
      success: true,
      message: `Gift approved! ${giftOrder.magicPointsCost} magic points deducted from ${child.displayName}.`,
      remainingMagicPoints: child.score365,
    };
  } else {
    // Update gift order status
    giftOrder.status = "CANCELLED";
    giftOrder.parentApprovalNote = note;
    return {
      success: true,
      message: "Gift request cancelled.",
    };
  }
}

/**
 * Get pending gift approvals for parent
 */
export async function getPendingApprovals() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  await dbConnect();

  const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
  if (!parent) {
    throw new Error("Parent not found");
  }

  const pendingOrders = await GiftOrder.find({
    parentId: parent._id,
    status: "PENDING_APPROVAL",
  })
  .populate("childId", "displayName avatarUrl score365")
  .populate("catalogItemId", "title brand imageUrl")
  .sort({ requestedAt: -1 })
  .lean();

  return pendingOrders.map(order => ({
    ...order,
    _id: order._id.toString(),
    childId: order.childId.toString(),
    parentId: order.parentId.toString(),
    catalogItemId: order.catalogItemId.toString(),
  }));
}

/**
 * Get gift order history for a child
 */
export async function getGiftHistory(childId: string, limit = 20) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  await dbConnect();

  const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
  if (!parent) {
    throw new Error("Parent not found");
  }

  // Verify child belongs to parent
  const child = await Child.findOne({ 
    _id: new Types.ObjectId(childId), 
    parentId: parent._id 
  });
  if (!child) {
    throw new Error("Child not found or not authorized");
  }

  const orders = await GiftOrder.find({
    childId: child._id,
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .lean();

  return orders.map(order => ({
    ...order,
    _id: order._id.toString(),
    childId: order.childId.toString(),
    parentId: order.parentId.toString(),
    catalogItemId: order.catalogItemId.toString(),
  }));
}

/**
 * Get reward gift usage stats for current year
 */
export async function getRewardGiftStats(childId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  await dbConnect();

  const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
  if (!parent) {
    throw new Error("Parent not found");
  }

  const approvalSettings = await GiftApprovalSettings.findOne({ parentId: parent._id });
  if (!approvalSettings) {
    return {
      usedRewardGifts: 0,
      maxRewardGifts: 2,
      remainingRewardGifts: 2,
      maxRewardGiftPrice: 50,
    };
  }

  const currentYear = new Date().getFullYear();
  // Count used reward gifts for current year
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
  
  const usedGifts = await GiftOrder.countDocuments({
    childId,
    orderType: "REWARD",
    status: { $in: ["APPROVED", "ORDERED", "SHIPPED", "DELIVERED"] },
    createdAt: { $gte: startOfYear, $lte: endOfYear }
  });

  return {
    usedRewardGifts: usedGifts,
    maxRewardGifts: approvalSettings.maxRewardGiftsPerYear,
    remainingRewardGifts: Math.max(0, approvalSettings.maxRewardGiftsPerYear - usedGifts),
    maxRewardGiftPrice: approvalSettings.maxRewardGiftPrice,
  };
}

/**
 * Update gift approval settings
 */
export async function updateGiftSettings(settings: {
  maxRewardGiftsPerYear?: number;
  maxRewardGiftPrice?: number;
  requireApprovalOver?: number;
  autoApproveRewards?: boolean;
  autoApproveChristmas?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  await dbConnect();

  const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
  if (!parent) {
    throw new Error("Parent not found");
  }

  const approvalSettings = await GiftApprovalSettings.findOneAndUpdate(
    { parentId: parent._id },
    { $set: settings },
    { new: true, upsert: true }
  );

  return {
    success: true,
    settings: approvalSettings,
  };
}