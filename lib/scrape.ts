const UA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
} as const;

export type RawResult = { title: string; url: string; snippet?: string };

async function fetchText(url: string, timeoutMs = 5000): Promise<string> {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: UA, cache: "no-store", signal: ac.signal });
    return await res.text();
  } finally {
    clearTimeout(to);
  }
}

/** Google SERP via Jina readable; returns lines title/url/snippet repeating. */
export async function googleReadable(query: string, max = 120): Promise<RawResult[]> {
  const g1 = `https://r.jina.ai/http/${encodeURIComponent(
    `www.google.com/search?q=${encodeURIComponent(query)}&hl=en&safe=active&num=100&udm=14`
  )}`;
  const text = await fetchText(g1, 6000);
  const lines = text.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 3000);
  const out: RawResult[] = [];
  for (let i = 0; i < lines.length - 2; i++) {
    const t = lines[i], u = lines[i + 1], s = lines[i + 2];
    if (!t || /^https?:\/\//i.test(t)) continue;
    if (!/^https?:\/\//i.test(u)) continue;
    out.push({ title: t, url: u, snippet: !/^https?:\/\//i.test(s) ? s : undefined });
    if (out.length >= max) break;
  }
  return out;
}

export function dedupeByPath(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    try {
      const x = new URL(u);
      const key = x.origin + x.pathname;
      if (!seen.has(key)) { seen.add(key); out.push(u); }
    } catch { /* ignore */ }
  }
  return out;
}

export function keepRetailers(urls: string[]) {
  return urls.filter(u => {
    try {
      const h = new URL(u).host.replace(/^www\./, "").toLowerCase();
      return (
        h.endsWith("walmart.com") ||
        h.endsWith("target.com") ||
        h.endsWith("amazon.com")
      );
    } catch { return false; }
  });
}

export async function previewFromServer(origin: string, url: string) {
  const res = await fetch(`${origin}/api/preview?url=${encodeURIComponent(url)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}
