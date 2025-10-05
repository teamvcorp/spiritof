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
    
    // Include both ready families AND already finalized families (for reset capability)
    const readyFamilies = await Parent.find({
      $and: [
        { "christmasSettings.setupCompleted": true },
        { "christmasSettings.hasPaymentMethod": true },
        {
          $or: [
            { walletBalanceCents: { $gt: 0 } }, // Has funds
            { "christmasSettings.listsFinalized": true } // Already finalized (for reset)
          ]
        }
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

    // Continue with processing if we have families...
    // For now, let's just return a simple response
    return NextResponse.json({
      readyForShipment: [],
      stats: {
        totalFamilies: allParents.length,
        fullyFundedFamilies: readyFamilies.length,
        totalValue: 0
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

    const { action, parentId, childId } = await req.json();

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
      const { trackingNumber, carrier } = await req.json();
      
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