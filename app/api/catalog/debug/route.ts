import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { MasterCatalog } from "@/models/MasterCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await dbConnect();

  const total = await MasterCatalog.countDocuments({});
  const active = await MasterCatalog.countDocuments({ isActive: true });
  const inactive = await MasterCatalog.countDocuments({ isActive: false });
  const noIsActive = await MasterCatalog.countDocuments({ isActive: { $exists: false } });
  
  const byGender = {
    girl: await MasterCatalog.countDocuments({ isActive: true, gender: "girl" }),
    boy: await MasterCatalog.countDocuments({ isActive: true, gender: "boy" }),
    neutral: await MasterCatalog.countDocuments({ isActive: true, gender: "neutral" }),
  };

  // Check what the API filter would return
  const apiFilter = { $and: [{ isActive: true }] };
  const apiCount = await MasterCatalog.countDocuments(apiFilter);
  
  // Get ALL items to see what's different
  const allActiveItems = await MasterCatalog.find({ isActive: true })
    .select("_id title gender productUrl brand category")
    .lean();

  // Get what the API query returns
  const apiQuery = MasterCatalog.find(apiFilter)
    .select("title gender price retailer productUrl imageUrl brand model category sourceType tags popularity brandLogoUrl");
  const apiItems = await apiQuery.lean();

  // Find missing items
  const apiItemIds = new Set(apiItems.map(item => item._id.toString()));
  const missingItems = allActiveItems.filter(item => !apiItemIds.has(item._id.toString()));

  return NextResponse.json({
    total,
    active,
    inactive,
    noIsActive,
    byGender,
    apiCount,
    apiItemsReturned: apiItems.length,
    missingCount: missingItems.length,
    missingItems: missingItems.map(item => ({
      id: item._id,
      title: item.title,
      gender: item.gender,
      brand: item.brand,
      category: item.category,
      hasProductUrl: !!item.productUrl
    })),
    message: "All active items should show up in catalog"
  });
}
