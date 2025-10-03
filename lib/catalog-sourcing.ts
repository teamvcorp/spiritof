// /lib/catalog-sourcing.ts
import { googleCustomSearch, searchRetailer, extractProductData, type GoogleSearchResult } from './google-custom-search';
import { isQuotaExceeded } from './search-config';

const UA = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  "DNT": "1",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1"
} as const;

const ALLOWED_HOSTS = ["walmart.com", "target.com", "amazon.com", "toysrus.com"];
const SERP_TIMEOUT_MS = 10000; // Increased timeout for API calls
const ITEM_TIMEOUT_MS = 8000;   // Increased timeout for scraping
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

/* ---------------- Google Custom Search API (Improved) ---------------- */
export async function googleReadable(query: string, dbg: SourceDebug): Promise<RawCandidate[]> {
  const results: RawCandidate[] = [];
  
  try {
    console.log(`🔍 Using Google Custom Search API for: "${query}"`);
    
    // Use the new Google Custom Search API
    const searchResponse = await googleCustomSearch(`${query} toys kids children`, {
      num: 10,
      excludeTerms: ['review', 'reviews', 'blog', 'news', 'article', 'wiki']
    });

    if (searchResponse.error) {
      const errorMsg = searchResponse.error.message;
      dbg.notes.push(`Google API error: ${errorMsg}`);
      console.error('Google Custom Search error:', searchResponse.error);
      
      // Check if it's a quota error
      if (isQuotaExceeded(errorMsg)) {
        console.log('🚨 Google quota exceeded! Trying Bing as immediate fallback...');
        dbg.notes.push('Google quota exceeded, trying Bing fallback');
        
        // Try Bing immediately as fallback
        const bingResults = await bingRss(query, dbg);
        if (bingResults.length > 0) {
          console.log(`✅ Bing fallback found ${bingResults.length} results`);
          return bingResults;
        }
      }
      
      // If not quota error or Bing failed, try original fallback
      return await googleReadableFallback(query, dbg);
    }

    if (searchResponse.items) {
      for (const item of searchResponse.items) {
        if (isAllowedHost(item.link)) {
          results.push({
            url: item.link,
            title: item.title,
            snippet: item.snippet
          });
        }
      }
    }

    dbg.googleCount = results.length;
    dbg.notes.push(`Google API: ${results.length} results`);
    console.log(`✅ Google Custom Search found ${results.length} valid results`);
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    dbg.notes.push(`Google API failed: ${errorMsg}`);
    console.error('Google Custom Search failed:', error);
    
    // Check if it's a quota error
    if (isQuotaExceeded(errorMsg)) {
      console.log('🚨 Google quota exceeded! Trying Bing as immediate fallback...');
      dbg.notes.push('Google quota exceeded, trying Bing fallback');
      
      // Try Bing immediately as fallback
      const bingResults = await bingRss(query, dbg);
      if (bingResults.length > 0) {
        console.log(`✅ Bing fallback found ${bingResults.length} results`);
        return bingResults;
      }
      
      // If Bing also failed, try DuckDuckGo
      console.log(`🦆 Bing failed, trying DuckDuckGo as final fallback...`);
      const duckResults = await duckDuckGoSearch(query, dbg);
      if (duckResults.length > 0) {
        console.log(`✅ DuckDuckGo fallback found ${duckResults.length} results`);
        return duckResults;
      }
      
      // If all search engines failed, try the original Google fallback
      console.log(`🎯 All search engines failed, falling back to Google proxy...`);
      const fallbackResults = await googleReadableFallback(query, dbg);
      if (fallbackResults.length > 0) {
        console.log(`✅ Google fallback found ${fallbackResults.length} results`);
        return fallbackResults;
      }
    }
    
    // Fallback to the old method
    return await googleReadableFallback(query, dbg);
  }

  return results;
}

/* ---------------- Google Fallback (Original Method) ---------------- */
async function googleReadableFallback(query: string, dbg: SourceDebug): Promise<RawCandidate[]> {
  console.log(`🔄 Falling back to Jina.ai proxy for: "${query}"`);
  
  // Try multiple search approaches for better reliability
  const searchUrls = [
    `https://r.jina.ai/http://www.google.com/search?q=${encodeURIComponent(query + ' toys kids')}&hl=en&safe=active&num=30`,
    `https://r.jina.ai/http://${encodeURIComponent(`www.google.com/search?q=${encodeURIComponent(query)}&hl=en&safe=active&num=30`)}`
  ];
  
  for (let attempt = 0; attempt < searchUrls.length; attempt++) {
    try {
      await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // Stagger requests
      const { ok, text, status } = await fetchText(searchUrls[attempt], SERP_TIMEOUT_MS);
      
      if (!ok || !text) { 
        dbg.notes.push(`google ${status} (attempt ${attempt + 1})`);
        continue;
      }
      
      // Skip if we got a block/captcha page
      if (text.includes('unusual traffic') || text.includes('captcha') || text.includes('blocked')) {
        dbg.notes.push(`google blocked (attempt ${attempt + 1})`);
        continue;
      }
      
      const lines = text.split("\n").slice(0, MAX_SERP_LINES).map(s => s.trim()).filter(Boolean);
      const out: RawCandidate[] = [];
      
      for (let i = 0; i < lines.length - 2; i++) {
        const title = lines[i], url = lines[i+1], maybeSnippet = lines[i+2];
        if (!title || /^https?:\/\//i.test(title)) continue;
        if (!/^https?:\/\//i.test(url)) continue;
        if (!isAllowedHost(url)) continue;
        out.push({ url, title, snippet: !/^https?:\/\//i.test(maybeSnippet) ? maybeSnippet : undefined });
        if (out.length >= 50) break;
      }
      
      dbg.googleCount = out.length;
      if (out.length) return out;
      
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      dbg.notes.push(`google err: ${errorMsg} (attempt ${attempt + 1})`);
      
      // If it's an abort error, try with longer timeout on next attempt
      if (errorMsg.includes('abort') && attempt < searchUrls.length - 1) {
        continue;
      }
    }
  }
  
  dbg.googleCount = 0;
  return [];
}

/* ---------------- Bing RSS (Improved) ---------------- */
export async function bingRss(query: string, dbg: SourceDebug): Promise<RawCandidate[]> {
  console.log(`🔍 Using Bing search for: "${query}"`);
  
  // More targeted search patterns that work better with Bing
  const searchQueries = [
    `${query} toys site:walmart.com OR site:target.com OR site:amazon.com`,
    `"${query}" kids toys buy`,
    `${query} children toy store`
  ];
  
  for (let i = 0; i < searchQueries.length; i++) {
    try {
      const searchQuery = searchQueries[i];
      console.log(`🔍 Bing attempt ${i + 1}: "${searchQuery}"`);
      
      // Use proper Bing search URL with better parameters
      const url = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}&first=1&count=20&setlang=en-US&safesearch=moderate`;
      
      // Add longer delay between requests to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      const { ok, text, status } = await fetchText(url, SERP_TIMEOUT_MS);
      
      if (!ok || !text) { 
        dbg.notes.push(`bing ${status} (attempt ${i + 1})`);
        console.log(`❌ Bing attempt ${i + 1} failed with status ${status}`);
        continue;
      }
      
      // Check for various types of blocks and errors
      if (text.includes('blocked') || text.includes('captcha') || text.includes('unusual') || 
          text.includes('verify') || text.includes('robot') || text.includes('automated') ||
          text.length < 100) {
        dbg.notes.push(`bing blocked/error (attempt ${i + 1})`);
        console.log(`❌ Bing attempt ${i + 1} blocked or error page detected`);
        continue;
      }
      
      // Extract URLs using multiple patterns for better coverage
      const urlPatterns = [
        /href=["']([^"']*(?:walmart|target|amazon)\.com[^"']*)["']/gi,
        /https?:\/\/(?:www\.)?(walmart|target|amazon)\.com\/[^\s"'<>)]*[^\s"'<>.,)]/gi
      ];
      
      let urlMatches: string[] = [];
      for (const pattern of urlPatterns) {
        const matches = Array.from(text.matchAll(pattern), m => m[1] || m[0]);
        urlMatches.push(...matches);
      }
      const out: RawCandidate[] = [];
      
      for (const link of urlMatches) {
        if (!isAllowedHost(link)) continue;
        
        // Filter out non-product pages
        if (link.includes('/search') || link.includes('/browse') || link.includes('/category')) {
          continue;
        }
        
        // Try to extract title from surrounding HTML
        const linkIndex = text.indexOf(link);
        const beforeLink = text.substring(Math.max(0, linkIndex - 200), linkIndex);
        const afterLink = text.substring(linkIndex, linkIndex + 200);
        
        const titleMatch = (beforeLink + afterLink).match(/<h3[^>]*>([^<]+)<\/h3>|<a[^>]*>([^<]+)<\/a>/);
        const title = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : 'Product';
        
        out.push({ 
          url: link, 
          title: title.substring(0, 100),
          snippet: `Product from ${link.includes('walmart') ? 'Walmart' : link.includes('target') ? 'Target' : 'Amazon'}`
        });
        
        if (out.length >= 15) break;
      }
      
      if (out.length > 0) {
        dbg.bingCount = out.length;
        dbg.notes.push(`bing success: ${out.length} results (attempt ${i + 1})`);
        console.log(`✅ Bing found ${out.length} results on attempt ${i + 1}`);
        return out;
      } else {
        console.log(`⚠️ Bing attempt ${i + 1} found 0 valid results`);
      }
      
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      dbg.notes.push(`bing error: ${errorMsg} (attempt ${i + 1})`);
      console.log(`❌ Bing attempt ${i + 1} error:`, errorMsg);
    }
  }
  
  dbg.bingCount = 0;
  dbg.notes.push('bing: all attempts failed');
  console.log(`❌ All Bing search attempts failed for "${query}"`);
  return [];
}

/* ---------------- DuckDuckGo Search (Additional Backup) ---------------- */
export async function duckDuckGoSearch(query: string, dbg: SourceDebug): Promise<RawCandidate[]> {
  console.log(`🦆 Using DuckDuckGo search for: "${query}"`);
  
  try {
    // DuckDuckGo has a simple search that's less likely to be blocked
    const searchQuery = `${query} toys site:walmart.com OR site:target.com OR site:amazon.com`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    
    console.log(`🦆 DuckDuckGo searching: "${searchQuery}"`);
    
    const { ok, text, status } = await fetchText(url, SERP_TIMEOUT_MS);
    
    if (!ok || !text) {
      dbg.notes.push(`duckduckgo ${status}`);
      console.log(`❌ DuckDuckGo failed with status ${status}`);
      return [];
    }
    
    // Extract URLs from DuckDuckGo HTML
    const urlMatches = text.match(/https?:\/\/(?:www\.)?(walmart|target|amazon)\.com[^\s"'<>]*/gi) || [];
    const out: RawCandidate[] = [];
    
    for (const link of urlMatches) {
      if (!isAllowedHost(link)) continue;
      
      // Filter out non-product pages
      if (link.includes('/search') || link.includes('/browse') || link.includes('/category')) {
        continue;
      }
      
      const retailer = link.includes('walmart') ? 'Walmart' : link.includes('target') ? 'Target' : 'Amazon';
      
      out.push({
        url: link,
        title: `${query} - ${retailer} Product`,
        snippet: `Product from ${retailer}`
      });
      
      if (out.length >= 10) break;
    }
    
    if (out.length > 0) {
      dbg.notes.push(`duckduckgo: ${out.length} results`);
      console.log(`✅ DuckDuckGo found ${out.length} results`);
      return out;
    } else {
      dbg.notes.push('duckduckgo: no results');
      console.log(`⚠️ DuckDuckGo found no valid results`);
    }
    
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    dbg.notes.push(`duckduckgo error: ${errorMsg}`);
    console.log(`❌ DuckDuckGo error:`, errorMsg);
  }
  
  return [];
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
/* ---------------- Retailer Search (Improved with Google Custom Search) ---------------- */
export async function retailerSearch(query: string, dbg: SourceDebug): Promise<string[]> {
  const all: string[] = [];
  
  try {
    console.log(`🏪 Using Google Custom Search for retailers...`);
    
    // Search each retailer using Google Custom Search API
    const retailers: Array<'walmart' | 'target' | 'amazon'> = ['walmart', 'target', 'amazon'];
    
    for (const retailer of retailers) {
      try {
        const results = await searchRetailer(query, retailer, 8);
        const urls = results.map(r => r.link).filter(url => isAllowedHost(url));
        all.push(...urls);
        
        console.log(`✅ ${retailer}: ${urls.length} products found`);
        dbg.notes.push(`${retailer}: ${urls.length} products`);
        
        // Small delay between retailer searches
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ ${retailer} search failed:`, errorMsg);
        dbg.notes.push(`${retailer} failed: ${errorMsg}`);
      }
    }
    
    dbg.retailerCount = all.length;
    
    // If Google Custom Search didn't work well, fall back to the old method
    if (all.length < 5) {
      console.log(`🔄 Low results (${all.length}), trying fallback method...`);
      const fallbackResults = await retailerSearchFallback(query, dbg);
      all.push(...fallbackResults);
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Retailer search failed:', errorMsg);
    dbg.notes.push(`Retailer search error: ${errorMsg}`);
    
    // Fallback to old method
    const fallbackResults = await retailerSearchFallback(query, dbg);
    all.push(...fallbackResults);
  }

  return Array.from(new Set(all)); // Remove duplicates
}

/* ---------------- Retailer Search Fallback (Original Method) ---------------- */
async function retailerSearchFallback(query: string, dbg: SourceDebug): Promise<string[]> {
  const all: string[] = [];
  const kidSafeQuery = `${query} kids toys children`;
  
  // Try retailers sequentially for better reliability
  const retailers = [
    {
      name: 'walmart',
      url: `https://www.walmart.com/search?q=${encodeURIComponent(kidSafeQuery)}`,
      extractor: (text: string) => extractWalmart(text, "https://www.walmart.com")
    },
    {
      name: 'target', 
      url: `https://www.target.com/s?searchTerm=${encodeURIComponent(kidSafeQuery)}`,
      extractor: (text: string) => extractTarget(text, "https://www.target.com")
    }
  ];
  
  for (const retailer of retailers) {
    try {
      console.log(`🏪 Searching ${retailer.name} (fallback)...`);
      const readerUrl = `https://r.jina.ai/http://${encodeURIComponent(retailer.url)}`;
      
      const { ok, text } = await fetchText(readerUrl, SERP_TIMEOUT_MS);
      if (!ok || !text) {
        dbg.notes.push(`${retailer.name} failed`);
        continue;
      }
      
      if (text.includes('Robot or human') || text.includes('CAPTCHA') || text.includes('blocked')) {
        dbg.notes.push(`${retailer.name} blocked`);
        continue;
      }
      
      const found = retailer.extractor(text);
      if (found.length > 0) {
        console.log(`✅ ${retailer.name} found ${found.length} products`);
        all.push(...found.slice(0, 20)); // Limit per retailer
      } else {
        dbg.notes.push(`${retailer.name} no results`);
      }
      
    } catch (e) {
      dbg.notes.push(`${retailer.name} err: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  
  const deduped = dedupeByPath(all);
  dbg.retailerCount = deduped.length;
  console.log(`🔗 Total retailer results: ${deduped.length}`);
  return deduped;
}

/* ---------------- JSON-LD product scrape ---------------- */
export async function scrapeProductMeta(url: string): Promise<ProductMeta | null> {
  const reader = `https://r.jina.ai/http/${encodeURIComponent(url)}`;
  try {
    const { ok, text } = await fetchText(reader, ITEM_TIMEOUT_MS);
    if (!ok || !text) return extractFromUrl(url);
    
    // Check if we got a CAPTCHA or robot detection page
    if (text.includes('Robot or human?') || text.includes('CAPTCHA') || text.includes('Access Denied')) {
      console.log(`Bot detection encountered for ${url}, using URL fallback`);
      return extractFromUrl(url);
    }
    
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
    
    // If we didn't get a title from JSON-LD, try URL fallback
    if (!pm.title) {
      return extractFromUrl(url);
    }
    
    return pm;
  } catch { 
    return extractFromUrl(url); 
  }
}

// Fallback function to extract product info from URL when scraping fails
function extractFromUrl(url: string): ProductMeta | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, "");
    
    // Extract title from URL path for different retailers
    let title = "";
    
    if (hostname.includes('walmart.com')) {
      // Walmart URLs: /ip/Product-Name-Here/123456
      const pathMatch = urlObj.pathname.match(/\/ip\/([^\/]+)/);
      if (pathMatch) {
        title = pathMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    } else if (hostname.includes('target.com')) {
      // Target URLs: /p/product-name/-/A-123456
      const pathMatch = urlObj.pathname.match(/\/p\/([^\/]+)/);
      if (pathMatch) {
        title = pathMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    } else if (hostname.includes('amazon.com')) {
      // Amazon URLs: /dp/B123456789 or /gp/product/B123456789
      // Amazon URLs don't typically have product names, so we'll use a generic title
      title = "Product from Amazon";
    }
    
    if (!title) return null;
    
    return {
      title: title.trim(),
      productUrl: url,
      retailer: hostname,
      // We can't extract price/brand from URL, but that's okay
    };
  } catch {
    return null;
  }
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
