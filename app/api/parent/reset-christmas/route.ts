import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { Types } from "mongoose";

/**
 * POST /api/parent/reset-christmas
 * Resets Christmas data for the next year after Christmas Day has passed
 * Only available after December 25th of the current year
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await dbConnect();

    const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Check if Christmas has passed (after December 25th)
    const now = new Date();
    const currentYear = now.getFullYear();
    const christmasDay = new Date(currentYear, 11, 25, 23, 59, 59); // Dec 25, 11:59:59 PM
    
    if (now <= christmasDay) {
      return NextResponse.json({ 
        error: "Christmas reset is only available after December 25th",
        currentDate: now.toISOString(),
        christmasDate: christmasDay.toISOString()
      }, { status: 400 });
    }

    // Check if there's anything to reset
    if (!parent.christmasSettings?.listsFinalized) {
      return NextResponse.json({ 
        error: "No finalized Christmas lists to reset" 
      }, { status: 400 });
    }

    // Get all children for this parent
    const children = await Child.find({ parentId: parent._id });
    
    console.log(`🎄 Starting Christmas reset for parent ${parent._id} (${parent.email})`);
    console.log(`   - Found ${children.length} children`);
    console.log(`   - Last finalized: ${parent.christmasSettings.listsFinalizedAt}`);

    // Reset Parent Christmas Settings (keep payment method and shipping address for convenience)
    const resetChristmasSettings = {
      // Preserve these for next year
      monthlyBudgetGoal: parent.christmasSettings.monthlyBudgetGoal || 200,
      autoContributeAmount: parent.christmasSettings.autoContributeAmount || 50,
      enableAutoContribute: parent.christmasSettings.enableAutoContribute || false,
      shippingAddress: parent.christmasSettings.shippingAddress,
      hasPaymentMethod: parent.christmasSettings.hasPaymentMethod,
      paymentMethodLast4: parent.christmasSettings.paymentMethodLast4,
      reminderEmails: parent.christmasSettings.reminderEmails ?? true,
      weeklyBudgetUpdates: parent.christmasSettings.weeklyBudgetUpdates ?? true,
      listLockReminders: parent.christmasSettings.listLockReminders ?? true,
      allowFriendGifts: parent.christmasSettings.allowFriendGifts ?? true,
      maxFriendGiftValue: parent.christmasSettings.maxFriendGiftValue || 25,
      allowEarlyGifts: parent.christmasSettings.allowEarlyGifts || false,
      
      // Reset these for new year
      listLockDate: undefined,
      finalPaymentDate: undefined,
      setupCompleted: true, // Keep setup completed since they've done it before
      setupCompletedAt: parent.christmasSettings.setupCompletedAt,
      
      // Clear finalization data
      listsFinalized: false,
      listsFinalizedAt: undefined,
      totalGiftCostCents: 0,
      finalizedChildrenData: [],
      
      // Clear logistics data
      shipmentApproved: false,
      shipmentApprovedAt: undefined,
      shipmentApprovedBy: undefined,
      shipped: false,
      shippedAt: undefined,
      shippedBy: undefined,
      trackingNumber: undefined,
      carrier: undefined,
    };

    parent.christmasSettings = resetChristmasSettings as any;

    // Note: We do NOT reset wallet balance or vote ledger
    // - Wallet funds carry over to next year
    // - Vote ledger will naturally reset with new dates

    await parent.save();
    console.log(`✅ Parent Christmas settings reset`);

    // Reset all children
    let resetChildCount = 0;
    for (const child of children) {
      // Clear gift list
      child.giftList = [];
      child.giftListLocked = false;
      child.giftListLockedAt = undefined;
      
      // Reset magic score for new year (start fresh)
      child.score365 = 0;
      
      // Clear early gift and friend gift requests
      child.earlyGiftRequests = [];
      child.friendGiftRequests = [];
      
      // Note: We preserve neighbor donations and balance
      // Parents can decide what to do with those funds
      
      await child.save();
      resetChildCount++;
    }
    
    console.log(`✅ Reset ${resetChildCount} children for new year`);

    return NextResponse.json({
      success: true,
      message: "Christmas data has been reset for the new year! 🎄",
      resetDetails: {
        parentReset: true,
        childrenReset: resetChildCount,
        preservedData: [
          "Payment method",
          "Shipping address",
          "Parent wallet balance",
          "Neighbor donations",
          "Budget settings",
          "Notification preferences"
        ],
        clearedData: [
          "Finalization status",
          "Gift lists",
          "Shipment tracking",
          "Magic scores (reset to 0)",
          "Gift requests"
        ],
        resetDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error resetting Christmas data:", error);
    return NextResponse.json({ 
      error: "Failed to reset Christmas data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

/**
 * GET /api/parent/reset-christmas
 * Check if reset is available (after Christmas Day)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await dbConnect();

    const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const christmasDay = new Date(currentYear, 11, 25, 23, 59, 59);
    
    const canReset = now > christmasDay && parent.christmasSettings?.listsFinalized;

    return NextResponse.json({
      canReset,
      isAfterChristmas: now > christmasDay,
      isFinalized: parent.christmasSettings?.listsFinalized || false,
      finalizedAt: parent.christmasSettings?.listsFinalizedAt || null,
      christmasDate: christmasDay.toISOString(),
      currentDate: now.toISOString(),
      daysUntilChristmas: Math.max(0, Math.ceil((christmasDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    });

  } catch (error) {
    console.error("Error checking reset availability:", error);
    return NextResponse.json({ 
      error: "Failed to check reset availability",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
