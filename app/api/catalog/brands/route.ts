import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { MasterCatalog } from "@/models/MasterCatalog";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get unique brands with their logos (case-insensitive)
    const brands = await MasterCatalog.aggregate([
      { 
        $match: { 
          isActive: true, 
          brand: { $exists: true, $ne: "" } 
        } 
      },
      {
        // Add a lowercase version for grouping
        $addFields: {
          brandLower: { $toLower: "$brand" }
        }
      },
      {
        // Group by lowercase brand to handle duplicates
        $group: {
          _id: "$brandLower",
          brand: { $first: "$brand" }, // Use the first capitalization found
          // Prioritize items that have a logo - take first non-null logo
          logoUrl: { 
            $first: {
              $cond: [
                { $ne: ["$brandLogoUrl", null] },
                "$brandLogoUrl",
                null
              ]
            }
          },
          // Also collect all logos to find the best one
          allLogos: { 
            $push: {
              $cond: [
                { $ne: ["$brandLogoUrl", null] },
                "$brandLogoUrl",
                "$$REMOVE"
              ]
            }
          }
        },
      },
      {
        // Use the first available logo from all logos collected
        $addFields: {
          logoUrl: { $arrayElemAt: ["$allLogos", 0] }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          brand: 1,
          logoUrl: 1,
        },
      },
    ]);

    return NextResponse.json({ success: true, brands });
  } catch (error: any) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}