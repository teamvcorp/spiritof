import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { MasterCatalog } from "@/models/MasterCatalog";
import { stripe } from "@/lib/stripe";
import { Types } from "mongoose";

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

    // Check if Christmas setup is completed
    if (!parent.christmasSettings?.setupCompleted) {
      return NextResponse.json({ 
        error: "Please complete Christmas setup before finalizing lists" 
      }, { status: 400 });
    }

    // Auto-migrate missing finalization fields for backward compatibility
    if (!parent.christmasSettings.hasOwnProperty('listsFinalized')) {
      console.log("🔧 Auto-migrating parent Christmas settings for finalization fields");
      parent.christmasSettings.listsFinalized = false;
      parent.christmasSettings.totalGiftCostCents = 0;
      parent.christmasSettings.finalizedChildrenData = [];
      parent.christmasSettings.shipmentApproved = false;
      parent.christmasSettings.shipped = false;
      // Save the migration
      await parent.save();
      console.log("✅ Auto-migration complete");
    }

    // Check if payment method is configured
    if (!parent.christmasSettings.hasPaymentMethod || !parent.stripeDefaultPaymentMethodId) {
      return NextResponse.json({ 
        error: "Please configure a payment method before finalizing lists" 
      }, { status: 400 });
    }

    // Check if already finalized
    if (parent.christmasSettings.listsFinalized) {
      return NextResponse.json({ 
        error: "Christmas lists have already been finalized",
        finalizedAt: parent.christmasSettings.listsFinalizedAt
      }, { status: 400 });
    }

    // Get all children for this parent
    const children = await Child.find({ parentId: parent._id }).lean();
    if (children.length === 0) {
      return NextResponse.json({ 
        error: "No children found. Please add children before finalizing lists." 
      }, { status: 400 });
    }

    // Calculate total cost for all children's gifts
    let totalGiftCostCents = 0;
    const childrenWithGifts = [];

    for (const child of children) {
      if (child.giftList && child.giftList.length > 0) {
        const gifts = await MasterCatalog.find({
          _id: { $in: child.giftList }
        }).lean();
        
        const childGiftCost = gifts.reduce((sum, gift) => sum + (gift.price || 0), 0);
        totalGiftCostCents += childGiftCost;
        
        childrenWithGifts.push({
          childId: child._id,
          childName: child.displayName,
          giftCount: gifts.length,
          giftCostCents: childGiftCost,
          gifts: gifts.map(g => ({ 
            id: g._id, 
            name: g.title || 'Unknown Gift', 
            price: g.price || 0 
          }))
        });
      }
    }

    if (totalGiftCostCents === 0) {
      return NextResponse.json({ 
        error: "No gifts found in any child's list. Please add gifts before finalizing." 
      }, { status: 400 });
    }

    // Calculate current successful wallet balance
    const successfulEntries = parent.walletLedger.filter(entry => entry.status === "SUCCEEDED");
    const currentBalanceCents = successfulEntries.reduce((sum, entry) => sum + entry.amountCents, 0);
    
    // Check if additional payment is needed
    const shortfallCents = Math.max(0, totalGiftCostCents - currentBalanceCents);
    
    let paymentResult = null;
    
    if (shortfallCents > 0) {
      // Create payment intent for the shortfall
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: shortfallCents,
          currency: 'usd',
          customer: parent.stripeCustomerId,
          payment_method: parent.stripeDefaultPaymentMethodId,
          confirmation_method: 'automatic',
          confirm: true,
          return_url: `${process.env.NEXTAUTH_URL}/parent/dashboard?finalization=complete`,
          metadata: {
            type: 'christmas_finalization',
            parentId: parent._id.toString(),
            totalGiftCostCents: totalGiftCostCents.toString(),
            shortfallCents: shortfallCents.toString(),
          }
        });

        // Add pending ledger entry for the finalization payment
        parent.addLedgerEntry({
          type: "TOP_UP",
          amountCents: shortfallCents,
          stripePaymentIntentId: paymentIntent.id,
          status: "PENDING"
        });

        paymentResult = {
          paymentIntentId: paymentIntent.id,
          amountCharged: shortfallCents,
          status: paymentIntent.status
        };

        // If payment succeeded immediately, update ledger
        if (paymentIntent.status === 'succeeded') {
          const pendingEntry = parent.walletLedger.find(entry => 
            entry.stripePaymentIntentId === paymentIntent.id && entry.status === 'PENDING'
          );
          if (pendingEntry) {
            pendingEntry.status = 'SUCCEEDED';
          }
        }

      } catch (stripeError) {
        console.error("Payment failed during finalization:", stripeError);
        return NextResponse.json({ 
          error: "Payment failed. Please check your payment method and try again.",
          details: stripeError instanceof Error ? stripeError.message : "Unknown payment error"
        }, { status: 400 });
      }
    }

    // Mark lists as finalized
    parent.christmasSettings.listsFinalized = true;
    parent.christmasSettings.listsFinalizedAt = new Date();
    parent.christmasSettings.totalGiftCostCents = totalGiftCostCents;
    parent.christmasSettings.finalizedChildrenData = childrenWithGifts as any; // Type workaround for complex ObjectId types

    // Recompute wallet balance to reflect any new payments
    parent.recomputeWalletBalance();
    
    await parent.save();

    // Lock all children's gift lists (prevent further modifications)
    await Child.updateMany(
      { parentId: parent._id },
      { 
        $set: { 
          giftListLocked: true,
          giftListLockedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: "Christmas lists finalized successfully!",
      summary: {
        totalChildren: children.length,
        childrenWithGifts: childrenWithGifts.length,
        totalGiftCostCents,
        previousBalanceCents: currentBalanceCents,
        shortfallCents,
        finalBalanceCents: parent.walletBalanceCents,
        paymentCharged: paymentResult?.amountCharged || 0,
        childrenDetails: childrenWithGifts
      },
      paymentResult,
      finalizedAt: parent.christmasSettings.listsFinalizedAt
    });

  } catch (error) {
    console.error("Error finalizing Christmas lists:", error);
    return NextResponse.json({ 
      error: "Failed to finalize Christmas lists",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}