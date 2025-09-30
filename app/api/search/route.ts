import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { CatalogItem } from "@/models/CatalogItem";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "20");
  
  if (!query.trim()) {
    return NextResponse.json({ items: [] });
  }

  try {
    await dbConnect();
    
    const items = await CatalogItem.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
      ]
    })
    .limit(limit)
    .lean();

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}