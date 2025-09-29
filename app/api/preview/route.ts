import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
} as const;

async function fetchText(u: string, ms = 2500) {
  const url = `https://r.jina.ai/http/${encodeURIComponent(u)}`;
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(url, { headers: UA, cache: "no-store", signal: ac.signal });
    const text = await res.text();
    return { ok: res.ok, text };
  } catch {
    return { ok: false, text: "" };
  } finally {
    clearTimeout(to);
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "missing url" }, { status: 400 });

  const { ok, text } = await fetchText(url);
  if (!ok || !text) return NextResponse.json({ title: url });

  // JSON-LD Product
  const blocks = Array.from(text.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  let title = "";
  let image = "";
  let price: string | number | undefined;
  let siteName = "";
  let brand = "";
  let model = "";
  let category = "";

  for (const m of blocks) {
    try {
      const json = JSON.parse(m[1].trim());
      const arr = Array.isArray(json) ? json : [json];
      for (const c of arr) {
        const types = Array.isArray(c["@type"]) ? c["@type"] : [c["@type"]];
        if (types?.includes?.("Product")) {
          title = c.name || c.title || title;
          if (Array.isArray(c.image)) image = c.image[0] || image;
          else if (typeof c.image === "string") image = c.image || image;
          const offers = Array.isArray(c.offers) ? c.offers[0] : c.offers;
          price = offers?.price ?? offers?.priceSpecification?.price ?? price;
          brand = c.brand?.name || c.brand || brand;
          model = c.model || model;
          category = c.category || category;
        }
        if (!siteName && c?.publisher?.name) siteName = c.publisher.name;
        if (!siteName && c?.isPartOf?.name) siteName = c.isPartOf.name;
      }
      if (title) break;
    } catch {}
  }

  // fallback siteName
  if (!siteName) {
    try {
      const h = new URL(url).host.replace(/^www\./, "");
      siteName = h;
    } catch {}
  }

  return NextResponse.json({
    title: title || url,
    image,
    price,
    siteName,
    brand,
    model,
    category,
  });
}
