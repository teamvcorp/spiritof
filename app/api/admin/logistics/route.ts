import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { MasterCatalog } from "@/models/MasterCatalog";
import { Types } from "mongoose";

export async function GET() {
  try {
    console.log("🔍 Admin logistics: Starting request");
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await dbConnect();
    console.log("📊 Admin logistics: Connected to database");

    // Check if user is admin
    const user = await User.findById(session.user.id).lean();
    if (!user?.admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.log("🔐 Admin logistics: Admin access verified");

    // Get all families with Christmas setup completed and payment methods configured
    // Include finalized families so admins can reset them for testing
    console.log("🎄 Admin logistics: Querying ready families");
    
    // First, let's just get all parents to see what we have
    const allParents = await Parent.find({}).lean();
    console.log(`📊 Total parents: ${allParents.length}`);
    
    const parentsWithSettings = await Parent.find({
      christmasSettings: { $exists: true }
    }).lean();
    console.log(`📊 Parents with Christmas settings: ${parentsWithSettings.length}`);
    
    // Only show families that have finalized their lists
    const readyFamilies = await Parent.find({
      $and: [
        { "christmasSettings.setupCompleted": true },
        { "christmasSettings.hasPaymentMethod": true },
        { "christmasSettings.listsFinalized": true } // MUST be finalized to appear in admin logistics
      ]
    }).lean();

    console.log(`📋 Admin logistics: Found ${readyFamilies.length} ready families`);

    // If no ready families, return empty but successful response
    if (readyFamilies.length === 0) {
      console.log("⚠️ No ready families found");
      return NextResponse.json({
        readyForShipment: [],
        stats: {
          totalFamilies: 0,
          fullyFundedFamilies: 0,
          totalValue: 0
        }
      });
    }

    // Process each family to get complete data
    const familiesWithDetails = [];
    let totalValue = 0;
    let fullyFundedCount = 0;

    for (const parent of readyFamilies) {
      // Get all children for this parent
      const children = await Child.find({ parentId: parent._id }).lean();
      
      if (children.length === 0) continue;

      // Get gifts for each child
      const childrenWithGifts = [];
      let totalFamilyGiftCostCents = 0;

      for (const child of children) {
        if (child.giftList && child.giftList.length > 0) {
          const gifts = await MasterCatalog.find({
            _id: { $in: child.giftList }
          }).lean();

          // Convert dollars to cents for internal calculations
          const childGiftCost = gifts.reduce((sum, gift) => sum + Math.round((gift.price || 0) * 100), 0);
          totalFamilyGiftCostCents += childGiftCost;

          childrenWithGifts.push({
            _id: child._id.toString(),
            displayName: child.displayName,
            score365: child.score365 || 0,
            gifts: gifts.map(g => {
              // Price in MasterCatalog is in dollars, convert to cents
              const priceInCents = Math.round((g.price || 0) * 100);
              return {
                _id: g._id.toString(),
                name: g.title || 'Unknown Gift',
                price: priceInCents, // Convert to cents
                imageUrl: g.imageUrl || '/images/christmasMagic.png',
                description: g.description || ''
              };
            }),
            totalGiftCostCents: childGiftCost,
            canAffordGifts: false // Will calculate below
          });
        }
      }

      // Skip families with no gifts
      if (childrenWithGifts.length === 0) continue;

      // Calculate funding (wallet + neighbor donations)
      const successfulEntries = (parent.walletLedger || []).filter(entry => entry.status === "SUCCEEDED");
      const parentWalletBalanceCents = successfulEntries.reduce((sum, entry) => sum + entry.amountCents, 0);
      
      const totalNeighborDonationsCents = children.reduce((sum, child) => {
        return sum + (child.neighborBalanceCents || 0);
      }, 0);
      
      const totalAvailableFundsCents = parentWalletBalanceCents + totalNeighborDonationsCents;
      const canAffordAllGifts = totalAvailableFundsCents >= totalFamilyGiftCostCents;
      const paymentCoverage = totalFamilyGiftCostCents > 0 
        ? (totalAvailableFundsCents / totalFamilyGiftCostCents) * 100 
        : 0;

      // Update canAffordGifts for each child
      childrenWithGifts.forEach(child => {
        child.canAffordGifts = canAffordAllGifts;
      });

      if (canAffordAllGifts) {
        fullyFundedCount++;
      }

      totalValue += totalFamilyGiftCostCents;

      // Count successful payments
      const successfulPayments = successfulEntries.length;
      const totalSuccessfulPayments = successfulEntries.reduce((sum, entry) => sum + entry.amountCents, 0);

      familiesWithDetails.push({
        _id: parent._id.toString(),
        name: parent.name,
        email: parent.email,
        walletBalanceCents: parentWalletBalanceCents,
        totalNeighborDonationsCents,
        totalAvailableFundsCents,
        christmasSettings: {
          shippingAddress: parent.christmasSettings?.shippingAddress || null,
          shipmentApproved: parent.christmasSettings?.shipmentApproved || false,
          shipmentApprovedAt: parent.christmasSettings?.shipmentApprovedAt?.toISOString(),
          shipped: parent.christmasSettings?.shipped || false,
          shippedAt: parent.christmasSettings?.shippedAt?.toISOString(),
          trackingNumber: parent.christmasSettings?.trackingNumber,
          carrier: parent.christmasSettings?.carrier,
          listsFinalized: parent.christmasSettings?.listsFinalized || false,
          listsFinalizedAt: parent.christmasSettings?.listsFinalizedAt?.toISOString(),
        },
        childrenWithGifts,
        totalFamilyGiftCostCents,
        canAffordAllGifts,
        paymentCoverage,
        successfulPayments,
        totalSuccessfulPayments
      });
    }

    console.log(`✅ Processed ${familiesWithDetails.length} families with details`);

    return NextResponse.json({
      readyForShipment: familiesWithDetails,
      stats: {
        totalFamilies: allParents.length,
        fullyFundedFamilies: fullyFundedCount,
        totalValue
      }
    });

  } catch (error) {
    console.error("❌ Admin logistics error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch logistics data",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await dbConnect();

    // Check if user is admin
    const user = await User.findById(session.user.id).lean();
    if (!user?.admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { action, parentId, childId, trackingNumber, carrier } = await req.json();

    if (action === "approve_for_shipment") {
      // Mark family as approved for shipment
      const parent = await Parent.findById(parentId);
      if (!parent) {
        return NextResponse.json({ error: "Parent not found" }, { status: 404 });
      }

      // Add shipment approval to parent's Christmas settings
      if (!parent.christmasSettings) {
        return NextResponse.json({ error: "Parent has no Christmas settings configured" }, { status: 400 });
      }
      
      parent.christmasSettings.shipmentApproved = true;
      parent.christmasSettings.shipmentApprovedAt = new Date();
      parent.christmasSettings.shipmentApprovedBy = session.user.id;
      
      await parent.save();

      return NextResponse.json({ 
        success: true, 
        message: "Family approved for shipment" 
      });
    }

    if (action === "mark_shipped") {
      
      const parent = await Parent.findById(parentId);
      if (!parent) {
        return NextResponse.json({ error: "Parent not found" }, { status: 404 });
      }

      // Update Christmas settings with shipping info
      if (!parent.christmasSettings) {
        return NextResponse.json({ error: "Parent has no Christmas settings configured" }, { status: 400 });
      }
      
      parent.christmasSettings.shipped = true;
      parent.christmasSettings.shippedAt = new Date();
      parent.christmasSettings.trackingNumber = trackingNumber;
      parent.christmasSettings.carrier = carrier;
      parent.christmasSettings.shippedBy = session.user.id;
      
      await parent.save();

      return NextResponse.json({ 
        success: true, 
        message: "Order marked as shipped" 
      });
    }

    if (action === "reset_finalization") {
      const parent = await Parent.findById(parentId);
      if (!parent) {
        return NextResponse.json({ error: "Parent not found" }, { status: 404 });
      }

      // Reset finalization status
      if (!parent.christmasSettings) {
        return NextResponse.json({ error: "Parent has no Christmas settings configured" }, { status: 400 });
      }
      
      // Reset all finalization fields
      parent.christmasSettings.listsFinalized = false;
      parent.christmasSettings.listsFinalizedAt = undefined;
      parent.christmasSettings.totalGiftCostCents = 0;
      parent.christmasSettings.finalizedChildrenData = [];
      parent.christmasSettings.shipmentApproved = false;
      parent.christmasSettings.shipmentApprovedAt = undefined;
      parent.christmasSettings.shipped = false;
      parent.christmasSettings.shippedAt = undefined;
      parent.christmasSettings.trackingNumber = undefined;
      parent.christmasSettings.carrier = undefined;
      
      await parent.save();

      // Unlock all children's gift lists
      await Child.updateMany(
        { parentId: parent._id },
        { 
          $unset: { 
            giftListLocked: 1,
            giftListLockedAt: 1
          }
        }
      );

      return NextResponse.json({ 
        success: true, 
        message: "Christmas list finalization has been reset. Gift lists are now unlocked." 
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error processing logistics action:", error);
    return NextResponse.json({ 
      error: "Failed to process action" 
    }, { status: 500 });
  }
}