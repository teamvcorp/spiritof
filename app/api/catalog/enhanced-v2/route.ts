import { NextRequest, NextResponse } from "next/server";
import { enhancedProductSearch } from "@/lib/enhanced-search";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const gender = searchParams.get("gender") as "boy" | "girl" | "neutral" | null;
    const category = searchParams.get("category") || undefined;
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const limit = Math.min(parseInt(searchParams.get("limit") || "24"), 100);

    // Parse price range
    const priceRange = (minPrice || maxPrice) ? {
      min: minPrice ? parseInt(minPrice) : 0,
      max: maxPrice ? parseInt(maxPrice) : 10000,
    } : undefined;

    console.log(`🔍 Enhanced search for: "${query}" | Gender: ${gender} | Category: ${category}`);

    // Use the enhanced search that combines master catalog + curated + trending
    const searchResults = await enhancedProductSearch(
      query,
      gender || "neutral",
      category,
      priceRange,
      limit
    );

    return NextResponse.json({
      items: searchResults.items,
      total: searchResults.total,
      hasMore: false,
      source: "enhanced",
      breakdown: searchResults.breakdown,
      message: `Found ${searchResults.total} items from multiple sources`,
    });

  } catch (error) {
    console.error("Enhanced search API error:", error);
    return NextResponse.json(
      { 
        error: "Search failed",
        items: [],
        total: 0,
        hasMore: false,
      },
      { status: 500 }
    );
  }
}