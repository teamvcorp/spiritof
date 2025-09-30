// /lib/catalog-sourcing.ts
const UA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
} as const;

const ALLOWED_HOSTS = ["walmart.com", "target.com", "amazon.com"];
const SERP_TIMEOUT_MS = 4500;
const ITEM_TIMEOUT_MS = 3000;
const MAX_SERP_LINES = 1600;

export type RawCandidate = { url: string; title?: string; snippet?: string };
export type ProductMeta = {
  title?: string; imageUrl?: string; price?: string | number;
  retailer?: string; brand?: string; model?: string; category?: string;
  productUrl?: string;
};
export type SourceDebug = {
  googleCount: number;
  bingCount: number;
  retailerCount: number;
  notes: string[];
};

function isAllowedHost(u: string) {
  try {
    const h = new URL(u).host.replace(/^www\./, "").toLowerCase();
    return ALLOWED_HOSTS.some((d) => h === d || h.endsWith("." + d));
  } catch { return false; }
}

async function fetchText(url: string, ms: number) {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(url, { headers: UA, cache: "no-store", signal: ac.signal });
    const text = await res.text();
    return { ok: res.ok, text, status: res.status };
  } finally { clearTimeout(to); }
}

/* ---------------- Google Readable ---------------- */
export async function googleReadable(query: string, dbg: SourceDebug): Promise<RawCandidate[]> {
  const g1 = `https://r.jina.ai/http/${encodeURIComponent(
    `www.google.com/search?q=${encodeURIComponent(query)}&hl=en&safe=active&num=50&udm=14`
  )}`;
  const g2 = `https://r.jina.ai/http://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&safe=active&num=50&udm=14`;
  for (const gurl of [g1, g2]) {
    try {
      const { ok, text, status } = await fetchText(gurl, SERP_TIMEOUT_MS);
      if (!ok || !text) { dbg.notes.push(`google ${status}`); continue; }
      const lines = text.split("\n").slice(0, MAX_SERP_LINES).map(s => s.trim()).filter(Boolean);
      const out: RawCandidate[] = [];
      for (let i = 0; i < lines.length - 2; i++) {
        const title = lines[i], url = lines[i+1], maybeSnippet = lines[i+2];
        if (!title || /^https?:\/\//i.test(title)) continue;
        if (!/^https?:\/\//i.test(url)) continue;
        if (!isAllowedHost(url)) continue;
        out.push({ url, title, snippet: !/^https?:\/\//i.test(maybeSnippet) ? maybeSnippet : undefined });
        if (out.length >= 80) break;
      }
      dbg.googleCount = out.length;
      if (out.length) return out;
    } catch (e: unknown) {
      dbg.notes.push(`google err: ${String(e)}`);
    }
  }
  dbg.googleCount = 0;
  return [];
}

/* ---------------- Bing RSS ---------------- */
export async function bingRss(query: string, dbg: SourceDebug): Promise<RawCandidate[]> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en-US&cc=US&adlt=strict&format=rss`;
  try {
    const { ok, text, status } = await fetchText(url, SERP_TIMEOUT_MS);
    if (!ok || !text) { dbg.notes.push(`bing ${status}`); return []; }
    const items = text.split("<item>").slice(1).map(c => "<item>"+c).slice(0, 100);
    const out: RawCandidate[] = [];
    for (const it of items) {
      const t = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i.exec(it);
      const l = /<link>(.*?)<\/link>/i.exec(it);
      const d = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/i.exec(it);
      const title = (t?.[1] || t?.[2] || "").trim();
      const link = (l?.[1] || "").trim();
      const desc = (d?.[1] || d?.[2] || "").trim();
      if (!/^https?:\/\//i.test(link)) continue;
      if (!isAllowedHost(link)) continue;
      out.push({ url: link, title, snippet: desc.replace(/<[^>]+>/g, "") });
      if (out.length >= 80) break;
    }
    dbg.bingCount = out.length;
    return out;
  } catch (e: unknown) {
    dbg.notes.push(`bing err: ${String(e)}`);
    dbg.bingCount = 0;
    return [];
  }
}

/* ---------------- Retailer search-page scrape via Jina ---------------- */
function readerUrls(u: string) {
  const raw = u.replace(/^https?:\/\//, "");
  return [
    `https://r.jina.ai/http/${encodeURIComponent(u)}`,
    `https://r.jina.ai/http://${raw}`,
  ];
}
function extractWalmart(t: string, base: string) {
  const abs = Array.from(t.match(/https?:\/\/(?:www\.)?walmart\.com\/ip\/[^\s"'<>]+/gi) ?? []);
  const rel = Array.from(t.match(/\/ip\/[a-z0-9\-]+\/\d+/gi) ?? []);
  return [...abs, ...rel.map(p => new URL(p, base).toString())];
}
function extractTarget(t: string, base: string) {
  const abs = Array.from(t.match(/https?:\/\/(?:www\.)?target\.com\/p\/[^\s"'<>]+\/-\/A-\d+/gi) ?? []);
  const rel = Array.from(t.match(/\/p\/[a-z0-9\-]+\/-\/A-\d+/gi) ?? []);
  return [...abs, ...rel.map(p => new URL(p, base).toString())];
}
function extractAmazon(t: string, base: string) {
  const dpAbs = Array.from(t.match(/https?:\/\/(?:www\.)?amazon\.com\/dp\/[A-Z0-9]{10}/g) ?? []);
  const gpAbs = Array.from(t.match(/https?:\/\/(?:www\.)?amazon\.com\/gp\/product\/[A-Z0-9]{10}/g) ?? []);
  const rel = Array.from(t.match(/\/dp\/[A-Z0-9]{10}/g) ?? []);
  return [...dpAbs, ...gpAbs, ...rel.map(p => new URL(p, base).toString())];
}
export async function retailerSearch(query: string, dbg: SourceDebug): Promise<string[]> {
  const all: string[] = [];
  // run 3 retailers in parallel; break per retailer when something is found
  await Promise.allSettled([
    (async () => {
      for (const u of readerUrls(`https://www.walmart.com/search?q=${encodeURIComponent(query)}`)) {
        const { text } = await fetchText(u, SERP_TIMEOUT_MS);
        const found = extractWalmart(text, "https://www.walmart.com");
        if (found.length) { all.push(...found); break; }
      }
    })(),
    (async () => {
      for (const u of readerUrls(`https://www.target.com/s?searchTerm=${encodeURIComponent(query)}`)) {
        const { text } = await fetchText(u, SERP_TIMEOUT_MS);
        const found = extractTarget(text, "https://www.target.com");
        if (found.length) { all.push(...found); break; }
      }
    })(),
    (async () => {
      for (const u of readerUrls(`https://www.amazon.com/s?k=${encodeURIComponent(query)}`)) {
        const { text } = await fetchText(u, SERP_TIMEOUT_MS);
        const found = extractAmazon(text, "https://www.amazon.com");
        if (found.length) { all.push(...found); break; }
      }
    })(),
  ]);
  const deduped = dedupeByPath(all);
  dbg.retailerCount = deduped.length;
  return deduped;
}

/* ---------------- JSON-LD product scrape ---------------- */
export async function scrapeProductMeta(url: string): Promise<ProductMeta | null> {
  const reader = `https://r.jina.ai/http/${encodeURIComponent(url)}`;
  try {
    const { ok, text } = await fetchText(reader, ITEM_TIMEOUT_MS);
    if (!ok || !text) return { productUrl: url };
    const blocks = Array.from(text.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
    const pm: ProductMeta = { productUrl: url };
    for (const m of blocks) {
      try {
        const json = JSON.parse(m[1].trim());
        const arr = Array.isArray(json) ? json : [json];
        for (const c of arr) {
          const types = Array.isArray(c["@type"]) ? c["@type"] : [c["@type"]];
          if (types?.includes?.("Product")) {
            pm.title = c.name || c.title || pm.title;
            const offers = Array.isArray(c.offers) ? c.offers[0] : c.offers;
            pm.price = offers?.price ?? offers?.priceSpecification?.price ?? pm.price;
            pm.brand = c.brand?.name || c.brand || pm.brand;
            pm.model = c.model || pm.model;
            pm.category = c.category || pm.category;
            const img = Array.isArray(c.image) ? c.image[0] : c.image;
            pm.imageUrl = typeof img === "string" ? img : pm.imageUrl;
          }
          if (!pm.retailer && (c?.publisher?.name || c?.isPartOf?.name)) {
            pm.retailer = c.publisher?.name || c.isPartOf?.name;
          }
        }
      } catch {}
    }
    if (!pm.retailer) {
      try { pm.retailer = new URL(url).host.replace(/^www\./, ""); } catch {}
    }
    return pm;
  } catch { return { productUrl: url }; }
}

/* ---------------- Utilities ---------------- */
export function dedupeByPath(urls: string[]) {
  const seen = new Set<string>(), out: string[] = [];
  for (const u of urls) {
    try {
      const x = new URL(u); const key = x.origin + x.pathname;
      if (!seen.has(key)) { seen.add(key); out.push(u); }
    } catch {}
  }
  return out;
}

export function toCatalogDraft(meta: ProductMeta, gender: "boy" | "girl" | "neutral") {
  return {
    title: meta.title || meta.productUrl || "",
    gender,
    price: typeof meta.price === "string" ? Number(meta.price.replace(/[^\d.]/g, "")) || undefined : meta.price,
    retailer: (meta.retailer || "").toString().toLowerCase(),
    productUrl: meta.productUrl,
    imageUrl: meta.imageUrl,
    brand: meta.brand,
    model: meta.model,
    category: meta.category,
    tags: [] as string[],
  };
}
