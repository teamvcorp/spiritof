import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { MasterCatalog } from "@/models/MasterCatalog";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const gender = searchParams.get("gender");
  const ageMin = searchParams.get("ageMin");
  const ageMax = searchParams.get("ageMax");
  const limit = parseInt(searchParams.get("limit") || "20");
  
  if (!query.trim()) {
    return NextResponse.json({ items: [] });
  }

  try {
    await dbConnect();
    
    const searchQuery: any = {
      isActive: true, // Only show active items to children
      $or: [
        { title: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
      ]
    };

    // Filter by gender if specified
    if (gender && gender !== 'neutral') {
      searchQuery.$and = [
        { $or: [{ gender: gender }, { gender: 'neutral' }] }
      ];
    }

    // Filter by age range if specified
    if (ageMin || ageMax) {
      const ageFilter: any = {};
      if (ageMin) {
        ageFilter.$gte = parseInt(ageMin);
      }
      if (ageMax) {
        ageFilter.$lte = parseInt(ageMax);
      }
      
      searchQuery.$and = searchQuery.$and || [];
      searchQuery.$and.push({
        $or: [
          { ageMin: { $exists: false } },
          { ageMin: ageFilter },
          { ageMax: ageFilter }
        ]
      });
    }
    
    const items = await MasterCatalog.find(searchQuery)
      .select('title brand category gender ageMin ageMax price retailer productUrl imageUrl blobUrl tags')
      .limit(limit)
      .sort({ popularity: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      items: items.map(item => ({
        ...item,
        // Use blob URL if available, fall back to imageUrl
        imageUrl: item.blobUrl || item.imageUrl
      }))
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}