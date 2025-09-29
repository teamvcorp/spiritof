import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { url, childId, title } = await req.json();
    if (!url || !childId) return NextResponse.json({ error: "missing url or childId" }, { status: 400 });

    const prev = await fetch(`${req.nextUrl.origin}/api/preview?url=${encodeURIComponent(url)}`, {
      cache: "no-store",
    }).then((r) => r.json());

    return NextResponse.json({
      ok: true,
      item: {
        title: prev.title || title || url,
        url,
        imageUrl: prev.image,
        price: prev.price,
        retailer: prev.siteName,
        brand: prev.brand,
        model: prev.model,
        category: prev.category,
      },
    });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
