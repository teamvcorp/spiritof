import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { MasterCatalog } from "@/models/MasterCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await dbConnect();

  try {
    // Aggregate categories from active items
    const categoriesAgg = await MasterCatalog.aggregate([
      { 
        $match: { 
          isActive: true,
          category: { $exists: true, $nin: [null, ""] }
        } 
      },
      { 
        $group: { 
          _id: "$category", 
          count: { $sum: 1 } 
        } 
      },
      { 
        $sort: { count: -1 } 
      }
    ]);

    const categories = categoriesAgg.map(item => ({
      category: item._id,
      count: item.count
    }));

    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
