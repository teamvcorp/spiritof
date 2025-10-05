import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Parent } from "@/models/Parent";

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

    console.log("🔧 Starting Christmas settings migration...");

    // Find all parents with Christmas settings but missing new fields
    const parentsToMigrate = await Parent.find({
      "christmasSettings.setupCompleted": true,
      $or: [
        { "christmasSettings.listsFinalized": { $exists: false } },
        { "christmasSettings.totalGiftCostCents": { $exists: false } },
        { "christmasSettings.finalizedChildrenData": { $exists: false } }
      ]
    });

    console.log(`📊 Found ${parentsToMigrate.length} parents to migrate`);

    let migratedCount = 0;

    for (const parent of parentsToMigrate) {
      try {
        // Add missing finalization fields with proper defaults
        if (!parent.christmasSettings.hasOwnProperty('listsFinalized')) {
          parent.christmasSettings.listsFinalized = false;
        }
        if (!parent.christmasSettings.hasOwnProperty('totalGiftCostCents')) {
          parent.christmasSettings.totalGiftCostCents = 0;
        }
        if (!parent.christmasSettings.hasOwnProperty('finalizedChildrenData')) {
          parent.christmasSettings.finalizedChildrenData = [];
        }
        if (!parent.christmasSettings.hasOwnProperty('shipmentApproved')) {
          parent.christmasSettings.shipmentApproved = false;
        }
        if (!parent.christmasSettings.hasOwnProperty('shipped')) {
          parent.christmasSettings.shipped = false;
        }

        await parent.save();
        migratedCount++;
        console.log(`✅ Migrated parent ${parent._id}`);
      } catch (error) {
        console.error(`❌ Failed to migrate parent ${parent._id}:`, error);
      }
    }

    console.log(`🎉 Migration complete! Migrated ${migratedCount} parents`);

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedCount} parent records`,
      details: {
        totalFound: parentsToMigrate.length,
        migrated: migratedCount,
        failed: parentsToMigrate.length - migratedCount
      }
    });

  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ 
      error: "Failed to run migration",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}