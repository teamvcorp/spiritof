import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { MasterCatalog } from "@/models/MasterCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await dbConnect();

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const brand = req.nextUrl.searchParams.get("brand");
  const category = req.nextUrl.searchParams.get("category");

  const ageParam = req.nextUrl.searchParams.get("age");
  const age = ageParam ? Number(ageParam) : null;
  const minPriceParam = req.nextUrl.searchParams.get("minPrice");
  const minPrice = minPriceParam ? Number(minPriceParam) : null;
  const maxPriceParam = req.nextUrl.searchParams.get("maxPrice");
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : null;
  const page = Number(req.nextUrl.searchParams.get("page") || "0");
  const limit = Math.max(6, Math.min(48, Number(req.nextUrl.searchParams.get("limit") || "30")));

  const $and: Record<string, unknown>[] = [
    { isActive: true } // Only show active items from MasterCatalog
  ];
  
  // Filter by brand if selected
  if (brand && brand.trim()) {
    $and.push({ brand: { $regex: new RegExp(`^${brand.trim()}$`, "i") } });
  }
  
  // Filter by category if selected
  if (category && category.trim()) {
    $and.push({ category: { $regex: new RegExp(`^${category.trim()}$`, "i") } });
  }
  
  if (age !== null && !Number.isNaN(age)) {
    $and.push({
      $or: [
        { ageMin: { $exists: false } },
        { ageMin: { $lte: age } },
      ],
    });
    $and.push({
      $or: [
        { ageMax: { $exists: false } },
        { ageMax: { $gte: age } },
      ],
    });
  }
  if (minPrice !== null && !Number.isNaN(minPrice)) {
    $and.push({ $or: [{ price: { $gte: minPrice } }, { price: { $exists: false } }] });
  }
  if (maxPrice !== null && !Number.isNaN(maxPrice) && maxPrice > 0) {
    $and.push({ price: { $lte: maxPrice } });
  }

  const filter = { $and };

  // Debug logging
  console.log("Catalog API filter:", JSON.stringify(filter, null, 2));

  let query = MasterCatalog.find(filter).select("title gender price retailer productUrl imageUrl brand model category sourceType tags popularity brandLogoUrl");

  if (q) {
    // lightweight text search; boosts title matches
    query = MasterCatalog.find({
      $and: [
        ...filter.$and,
        {
          $or: [
            { title: { $regex: q, $options: "i" } },
            { brand: { $regex: q, $options: "i" } },
            { tags: { $in: [new RegExp(q, "i")] } },
          ],
        },
      ],
    }).select("title gender price retailer productUrl imageUrl brand model category sourceType tags popularity brandLogoUrl")
      .sort({ popularity: -1, updatedAt: -1 });
  } else {
    query = query.sort({ popularity: -1, updatedAt: -1 });
  }

  const total = await MasterCatalog.countDocuments(filter);
  const items = await query.skip(page * limit).limit(limit).lean();

  const hasMore = (page + 1) * limit < total;
  
  // Debug logging
  console.log(`Catalog API: Found ${total} total items, returning ${items.length} items (page ${page}, limit ${limit})`);

  return NextResponse.json({
    items, // Changed from "results" to "items" to match SimpleGiftBuilder
    hasMore,
    total,
  });
}
