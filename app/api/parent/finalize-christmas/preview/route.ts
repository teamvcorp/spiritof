import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { MasterCatalog } from "@/models/MasterCatalog";
import { Types } from "mongoose";

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

    // Check if Christmas setup is completed
    if (!parent.christmasSettings?.setupCompleted) {
      return NextResponse.json({ 
        error: "Please complete Christmas setup before finalizing lists" 
      }, { status: 400 });
    }

    // Check if payment method is configured
    if (!parent.christmasSettings.hasPaymentMethod || !parent.stripeDefaultPaymentMethodId) {
      return NextResponse.json({ 
        error: "Please configure a payment method before finalizing lists" 
      }, { status: 400 });
    }

    // Get all children for this parent
    const children = await Child.find({ parentId: parent._id }).lean();
    if (children.length === 0) {
      return NextResponse.json({ 
        error: "No children found. Please add children before finalizing lists." 
      }, { status: 400 });
    }

    // Calculate total cost for all children's gifts (MasterCatalog prices are in dollars)
    let totalGiftCostCents = 0;
    const childrenWithGifts = [];

    for (const child of children) {
      if (child.giftList && child.giftList.length > 0) {
        const gifts = await MasterCatalog.find({
          _id: { $in: child.giftList }
        }).lean();
        
        // Convert dollars to cents for internal calculations
        const childGiftCost = gifts.reduce((sum, gift) => sum + Math.round((gift.price || 0) * 100), 0);
        totalGiftCostCents += childGiftCost;
        
        childrenWithGifts.push({
          childId: child._id,
          childName: child.displayName,
          giftCount: gifts.length,
          giftCostCents: childGiftCost,
          gifts: gifts.map(g => ({ 
            id: g._id, 
            name: g.title || 'Unknown Gift', 
            price: Math.round((g.price || 0) * 100) // Store in cents
          }))
        });
      }
    }

    if (totalGiftCostCents === 0) {
      return NextResponse.json({ 
        error: "No gifts found in any child's list. Please add gifts before finalizing." 
      }, { status: 400 });
    }

    // Calculate current successful wallet balance (parent's wallet)
    const successfulEntries = parent.walletLedger.filter(entry => entry.status === "SUCCEEDED");
    const parentWalletBalanceCents = successfulEntries.reduce((sum, entry) => sum + entry.amountCents, 0);
    
    // Calculate total neighbor donations across all children
    const totalNeighborDonationsCents = children.reduce((sum, child) => {
      return sum + (child.neighborBalanceCents || 0);
    }, 0);
    
    // Calculate total available funds (parent wallet + all neighbor donations)
    const totalAvailableFundsCents = parentWalletBalanceCents + totalNeighborDonationsCents;
    
    // Check if additional payment is needed
    const shortfallCents = Math.max(0, totalGiftCostCents - totalAvailableFundsCents);

    return NextResponse.json({
      success: true,
      summary: {
        totalChildren: children.length,
        childrenWithGifts: childrenWithGifts.length,
        totalGiftCostCents,
        parentWalletBalanceCents,
        totalNeighborDonationsCents,
        totalAvailableFundsCents,
        shortfallCents,
        finalBalanceCents: 0, // Not relevant for preview
        paymentCharged: shortfallCents,
        childrenDetails: childrenWithGifts
      }
    });

  } catch (error) {
    console.error("Error previewing Christmas finalization:", error);
    return NextResponse.json({ 
      error: "Failed to preview finalization",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
