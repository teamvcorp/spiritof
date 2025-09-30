import { NextRequest, NextResponse } from "next/server";
import { searchCatalog, getTrendingByCategory } from "@/app/(routes)/admin/catalog/fast-actions";
import { searchPopularToys } from "@/lib/toy-data-source";
import { googleReadable, bingRss, retailerSearch, scrapeProductMeta, type SourceDebug } from "@/lib/catalog-sourcing";
import type { ToyCategory } from "@/lib/toy-data-source";

/**
 * Live product search that finds real products with validated images on-demand
 */
async function searchLiveProducts(query: string, gender: "boy" | "girl" | "neutral", limit: number, category?: string) {
  console.log(`🔍 Starting live search for: "${query}"`);
  
  const debug: SourceDebug = {
    googleCount: 0,
    bingCount: 0,
    retailerCount: 0,
    notes: []
  };

  try {
    // Step 1: Search for real product URLs using multiple sources
    const [googleResults, bingResults, retailerResults] = await Promise.allSettled([
      googleReadable(query, debug),
      bingRss(query, debug), 
      retailerSearch(query, debug)
    ]);

    // Collect candidate URLs
    const candidateUrls: string[] = [];
    
    if (googleResults.status === 'fulfilled') {
      candidateUrls.push(...googleResults.value.map(r => r.url));
    }
    if (bingResults.status === 'fulfilled') {
      candidateUrls.push(...bingResults.value.map(r => r.url));
    }
    if (retailerResults.status === 'fulfilled') {
      candidateUrls.push(...retailerResults.value);
    }

    console.log(`📊 Found ${candidateUrls.length} candidate URLs`);

    if (candidateUrls.length === 0) {
      return [];
    }

    // Step 2: Scrape top URLs to get product metadata
    const topUrls = candidateUrls.slice(0, Math.min(20, limit * 3)); // Get more than needed
    const metadataResults = await Promise.allSettled(
      topUrls.map(url => scrapeProductMeta(url))
    );

    // Step 3: Process and validate results
    const validProducts = [];
    for (const result of metadataResults) {
      if (result.status === 'fulfilled' && result.value) {
        const meta = result.value;
        
        if (meta.productUrl && meta.title) {
          // Validate image if present
          let finalImageUrl = "/images/christmasMagic.png"; // Default fallback
          
          if (meta.imageUrl) {
            const imageIsValid = await validateImageUrl(meta.imageUrl);
            if (imageIsValid) {
              finalImageUrl = meta.imageUrl;
              console.log(`✅ Validated image for: ${meta.title}`);
            } else {
              console.log(`❌ Invalid image for: ${meta.title}, using fallback`);
            }
          }

          validProducts.push({
            _id: `live_${validProducts.length}`,
            title: meta.title,
            brand: meta.brand || "Unknown Brand",
            category: category || "toys",
            gender,
            price: typeof meta.price === 'number' ? meta.price : 
                   typeof meta.price === 'string' ? parseFloat(meta.price.replace(/[^\d.]/g, '')) || 25 :
                   25,
            tags: [query],
            retailer: meta.retailer || "unknown",
            productUrl: meta.productUrl,
            imageUrl: finalImageUrl,
          });

          if (validProducts.length >= limit) {
            break;
          }
        }
      }
    }

    console.log(`✅ Successfully found ${validProducts.length} valid products`);
    return validProducts;

  } catch (error) {
    console.error("Live search error:", error);
    return [];
  }
}

/**
 * Validate that an image URL actually returns a valid image
 */
async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      return contentType?.startsWith('image/') || false;
    }
    
    return false;
    
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const gender = searchParams.get("gender") as "boy" | "girl" | "neutral" | null;
    const category = searchParams.get("category") as ToyCategory | null;
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const limit = Math.min(parseInt(searchParams.get("limit") || "24"), 100);
    const source = searchParams.get("source") || "live"; // Default to "live" for real-time search

    // NEW: Live real-time product search with validated images
    if (source === "live" && query.trim()) {
      console.log(`🔍 Live product search for: "${query}"`);
      
      try {
        const liveResults = await searchLiveProducts(query, gender || "neutral", limit, category || undefined);
        
        return NextResponse.json({
          items: liveResults,
          total: liveResults.length,
          hasMore: false,
          source: "live",
          message: `Found ${liveResults.length} real products with verified images`,
        });
      } catch (error) {
        console.error("Live search failed:", error);
        // Fallback to curated if live search fails
      }
    }

    // Fast curated search for instant results
    if (source === "curated" && query) {
      const curated = searchPopularToys(query, limit);
      const curatedResults = curated.map((toy, index) => ({
        _id: `curated_${index}`,
        title: toy.title,
        brand: toy.brand,
        category: toy.category,
        gender: toy.gender,
        price: toy.priceRange.min,
        tags: toy.keywords,
        popularity: toy.popularity,
        retailer: "multiple",
        imageUrl: "/images/elfGift.png", // Placeholder for curated items
        productUrl: undefined,
      }));

      return NextResponse.json({
        items: curatedResults,
        total: curated.length,
        hasMore: false,
        source: "curated",
        message: "Instant results from curated popular toys",
      });
    }

    // Trending toys by category
    if (source === "trending") {
      const trending = await getTrendingByCategory(
        gender || "neutral",
        category || undefined
      );

      const trendingWithImages = trending.map(item => ({
        ...item,
        imageUrl: "/images/santa.png", // Placeholder for trending items
      }));

      return NextResponse.json({
        items: trendingWithImages,
        total: trending.length,
        hasMore: false,
        source: "trending",
        message: "Trending toys in this category",
      });
    }

    // Database search with enhanced filters
    const priceRange = minPrice || maxPrice ? {
      min: minPrice ? parseInt(minPrice) : 0,
      max: maxPrice ? parseInt(maxPrice) : 10000,
    } : undefined;

    const results = await searchCatalog(
      query,
      gender || undefined,
      category || undefined,
      priceRange,
      limit
    );

    // If database search yields few results, supplement with curated toys
    let supplemented = results;
    if (query && results.length < 12) {
      const curatedSupplement = searchPopularToys(query, 12 - results.length)
        .map((toy, index) => ({
          _id: `curated_supplement_${index}`,
          title: toy.title,
          brand: toy.brand,
          category: toy.category,
          gender: toy.gender,
          price: toy.priceRange.min,
          tags: toy.keywords,
          popularity: toy.popularity,
          retailer: "multiple",
          imageUrl: "/images/elfGift.png", // Placeholder for curated supplement
          productUrl: undefined,
        }));

      supplemented = [...results, ...curatedSupplement];
    }

    return NextResponse.json({
      items: supplemented,
      total: supplemented.length,
      hasMore: false,
      source: supplemented.length > results.length ? "database+curated" : "database",
      databaseCount: results.length,
      curatedCount: supplemented.length - results.length,
    });

  } catch (error) {
    console.error("Enhanced catalog API error:", error);
    return NextResponse.json(
      { 
        error: "Search failed",
        items: [],
        total: 0,
        hasMore: false,
      },
      { status: 500 }
    );
  }
}