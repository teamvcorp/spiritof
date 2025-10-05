import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { MasterCatalog } from "@/models/MasterCatalog";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const gender = searchParams.get("gender") || "neutral";
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");

    console.log(`Gender-based search: gender=${gender}, page=${page}, limit=${limit}`);

    // Build query based on gender
    let query: any = {};
    
    if (gender === "boy" || gender === "girl") {
      query.gender = gender;
    } else if (gender === "neutral") {
      // Include both neutral and items with no gender specified
      query.$or = [
        { gender: "neutral" },
        { gender: { $exists: false } },
        { gender: null },
        { gender: "" }
      ];
    }

    // Get total count for pagination
    const totalCount = await MasterCatalog.countDocuments(query);
    
    // Get paginated items
    const items = await MasterCatalog.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .skip(page * limit)
      .limit(limit)
      .lean();

    // Transform to expected format
    const transformedItems = items.map((item: any) => ({
      _id: item._id.toString(),
      title: item.title,
      brand: item.brand,
      category: item.category,
      gender: item.gender,
      price: item.price,
      retailer: item.retailer,
      productUrl: item.productUrl,
      imageUrl: item.imageUrl, // This contains blob URLs
      blobUrl: item.blobUrl, // Legacy field
      tags: item.tags || [],
      popularity: item.popularity,
      sourceType: "master_catalog",
      isInCatalog: true
    }));

    const hasMore = (page + 1) * limit < totalCount;

    console.log(`Found ${transformedItems.length} items for gender=${gender}, hasMore=${hasMore}`);

    return NextResponse.json({
      success: true,
      items: transformedItems,
      hasMore,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error("Gender-based catalog search error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to search catalog by gender",
        items: [],
        hasMore: false 
      },
      { status: 500 }
    );
  }
}