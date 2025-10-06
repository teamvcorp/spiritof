"use server";

import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Child } from "@/models/Child";
import { Parent } from "@/models/Parent";
import { MasterCatalog } from "@/models/MasterCatalog"; // eslint-disable-line @typescript-eslint/no-unused-vars -- Required for Mongoose model registration
import { findOrCreateCatalogItem } from "@/lib/catalog-service";
import { auth } from "@/auth";

// Type for populated catalog items
interface PopulatedCatalogItem {
  _id: Types.ObjectId;
  title: string;
  brand?: string;
  category?: string;
  price?: number;
  retailer?: string;
  productUrl: string;
  imageUrl?: string;
  blobUrl?: string;
  tags?: string[];
  popularity?: number;
  sourceType: string;
  createdAt: Date;
}

/**
 * Add a catalog item to a child's gift list using the new master catalog system
 */
export async function addItemToChildGiftList(
  childId: string,
  itemData: {
    title: string;
    productUrl: string;
    brand?: string;
    category?: string;
    gender?: "boy" | "girl" | "neutral";
    price?: number;
    retailer?: string;
    imageUrl?: string;
    sku?: string;
    asin?: string;
    upc?: string;
    ean?: string;
    model?: string;
    tags?: string[];
    popularity?: number;
    searchQuery?: string; // The search term that found this item
    sourceType?: "live_search" | "manual" | "curated" | "trending";
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

  // Find or create the catalog item
  const catalogResult = await findOrCreateCatalogItem({
    ...itemData,
    searchTerms: itemData.searchQuery ? [itemData.searchQuery] : undefined,
  });

  if (!catalogResult.success || !catalogResult.catalogItem?._id) {
    return {
      success: false,
      message: catalogResult.error || "Failed to create catalog item"
    };
  }

  const catalogItemId = catalogResult.catalogItem._id;

  // Check if item is already in child's gift list
  const isAlreadyInList = child.giftList?.some(id => id.toString() === catalogItemId.toString());
  if (isAlreadyInList) {
    return {
      success: false,
      message: "This gift is already in the child's list"
    };
  }

  // Add to child's gift list using Mongoose updateOne
  await Child.updateOne(
    { _id: child._id },
    { $push: { giftList: catalogItemId } }
  );

  return {
    success: true,
    message: catalogResult.isNew 
      ? "New gift added to catalog and child's list!" 
      : "Gift added to child's list!",
    catalogItemId: catalogItemId.toString(),
    isNewCatalogItem: catalogResult.isNew
  };
}

/**
 * Remove a gift from a child's list
 */
export async function removeItemFromChildGiftList(
  childId: string,
  catalogItemId: string
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

  // Remove from child's gift list using Mongoose updateOne
  await Child.updateOne(
    { _id: child._id },
    { $pull: { giftList: catalogItemId } }
  );

  return {
    success: true,
    message: "Gift removed from list successfully"
  };
}

/**
 * Get a child's current gift list with populated catalog items
 */
export async function getChildGiftListNew(childId: string) {
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
  }).populate({
    path: 'giftList',
    model: 'MasterCatalog'
  }).lean();

  if (!child) {
    throw new Error("Child not found or not authorized");
  }

  // Format the gifts with best image URLs
  const populatedGifts = child.giftList as unknown as PopulatedCatalogItem[];
  const gifts = populatedGifts?.map(item => ({
    _id: item._id.toString(),
    title: item.title,
    brand: item.brand,
    category: item.category,
    price: item.price,
    retailer: item.retailer,
    productUrl: item.productUrl,
    imageUrl: item.blobUrl || item.imageUrl || "/images/christmasMagic.png",
    blobUrl: item.blobUrl,
    originalImageUrl: item.imageUrl,
    tags: item.tags,
    popularity: item.popularity,
    sourceType: item.sourceType,
    createdAt: item.createdAt
  })) || [];

  return {
    success: true,
    gifts: gifts
  };
}

/**
 * Get existing gift titles for a child (for duplicate checking)
 */
export async function getChildExistingGifts(childId: string) {
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
  }).populate({
    path: 'giftList',
    model: 'MasterCatalog',
    select: 'title productUrl'
  }).lean();

  if (!child) {
    throw new Error("Child not found or not authorized");
  }

  // Return set of identifiers for duplicate checking
  const existingItems = new Set<string>();
  const populatedItems = child.giftList as unknown as PopulatedCatalogItem[];
  populatedItems?.forEach(item => {
    existingItems.add(item.title.toLowerCase().trim());
    if (item.productUrl) {
      existingItems.add(item.productUrl);
    }
  });

  return {
    success: true,
    existingItems: Array.from(existingItems),
    magicPoints: child.score365 || 0
  };
}