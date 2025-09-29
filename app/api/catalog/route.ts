import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { CatalogItem } from "@/models/CatalogItem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await dbConnect();

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const genderRaw = (req.nextUrl.searchParams.get("gender") || "").toLowerCase();
  const gender = ["boy", "girl", "neutral"].includes(genderRaw) ? (genderRaw as any) : undefined;

  const age = Number(req.nextUrl.searchParams.get("age") || "");
  const minPrice = Number(req.nextUrl.searchParams.get("minPrice") || "");
  const maxPrice = Number(req.nextUrl.searchParams.get("maxPrice") || "");
  const cursor = Number(req.nextUrl.searchParams.get("cursor") || "0"); // offset
  const limit = Math.max(6, Math.min(48, Number(req.nextUrl.searchParams.get("limit") || "24")));

  const $and: any[] = [];
  if (gender) $and.push({ gender });
  if (!Number.isNaN(age)) {
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
  if (!Number.isNaN(minPrice)) $and.push({ $or: [{ price: { $gte: minPrice } }, { price: { $exists: false } }] });
  if (!Number.isNaN(maxPrice) && maxPrice > 0) $and.push({ price: { $lte: maxPrice } });

  const filter = $and.length ? { $and } : {};

  let query = CatalogItem.find(filter).select("title gender price retailer productUrl imageUrl brand model category");

  if (q) {
    // lightweight text search; boosts title matches
    query = CatalogItem.find({
      $and: [
        filter,
        {
          $or: [
            { $text: { $search: q } },
            { title: { $regex: q, $options: "i" } },
            { tags: { $in: [new RegExp(q, "i")] } },
          ],
        },
      ],
    }).select("title gender price retailer productUrl imageUrl brand model category score")
      .sort({ score: { $meta: "textScore" }, updatedAt: -1 } as any);
  } else {
    query = query.sort({ updatedAt: -1 });
  }

  const total = await CatalogItem.countDocuments(filter);
  const page = await query.skip(cursor).limit(limit).lean();

  const hasMore = cursor + page.length < total;

  return NextResponse.json({
    results: page,
    cursor: hasMore ? cursor + page.length : null,
    hasMore,
    total,
  });
}
