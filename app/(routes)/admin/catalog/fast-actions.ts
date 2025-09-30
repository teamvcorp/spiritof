"use server";

import { dbConnect } from "@/lib/db";
import { CatalogItem } from "@/models/CatalogItem";
import { POPULAR_TOYS_2025, type PopularToy, type ToyCategory } from "@/lib/toy-data-source";
import { googleReadable, bingRss, retailerSearch, scrapeProductMeta, type SourceDebug } from "@/lib/catalog-sourcing";

type Gender = "boy" | "girl" | "neutral";

export type FastCatalogRow = {
  _tmpId: string;
  title: string;
  brand: string;
  category: string;
  gender: Gender;
  price?: number;
  retailer?: string;
  productUrl?: string;
  imageUrl?: string;
  popularity: number;
  keywords: string[];
  isFromCuratedList: boolean;
};

/**
 * Fast catalog generation using curated toy data + targeted AI search
 */
export async function generateFastCatalog(
  gender: Gender,
  category?: ToyCategory,
  priceMax?: number
): Promise<{
  rows: FastCatalogRow[];
  stats: {
    curatedCount: number;
    aiEnhancedCount: number;
    totalUnique: number;
  };
}> {
  console.log(`🚀 Fast catalog generation for ${gender}, category: ${category}, maxPrice: ${priceMax}`);
  
  // Step 1: Get curated popular toys instantly
  const curatedToys = POPULAR_TOYS_2025
    .filter(toy => {
      if (gender !== "neutral" && toy.gender !== gender && toy.gender !== "neutral") return false;
      if (category && toy.category !== category) return false;
      if (priceMax && toy.priceRange.min > priceMax) return false;
      return true;
    })
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 50); // Top 50 most relevant

  // Convert curated toys to catalog rows
  const curatedRows: FastCatalogRow[] = curatedToys.map((toy, index) => ({
    _tmpId: `curated_${index}`,
    title: toy.title,
    brand: toy.brand,
    category: toy.category,
    gender: toy.gender,
    price: toy.priceRange.min,
    retailer: undefined, // Will be filled by AI search
    productUrl: undefined, // Will be filled by AI search
    imageUrl: undefined, // Will be filled by AI search
    popularity: toy.popularity,
    keywords: toy.keywords,
    isFromCuratedList: true,
  }));

  // Step 2: Enhanced AI search for actual product URLs (parallel for speed)
  const enhancedRows = await Promise.allSettled(
    curatedRows.slice(0, 20).map(async (row, index) => {
      try {
        const toy = curatedToys[index];
        const productData = await findProductWithRealScraping(toy);
        return {
          ...row,
          ...productData,
          _tmpId: `enhanced_${index}`,
        };
      } catch (error) {
        console.error(`Failed to enhance ${row.title}:`, error);
        return row;
      }
    })
  );

  const aiEnhancedRows = enhancedRows
    .filter((result): result is PromiseFulfilledResult<FastCatalogRow> => result.status === 'fulfilled')
    .map(result => result.value);

  // Step 3: Combine and deduplicate
  const allRows = [...aiEnhancedRows, ...curatedRows.slice(20)];
  const uniqueRows = deduplicateByTitle(allRows);

  return {
    rows: uniqueRows,
    stats: {
      curatedCount: curatedRows.length,
      aiEnhancedCount: aiEnhancedRows.length,
      totalUnique: uniqueRows.length,
    },
  };
}

/**
 * Find actual product URLs and images using real web scraping
 */
async function findProductWithRealScraping(toy: PopularToy): Promise<Partial<FastCatalogRow>> {
  const query = `${toy.title} ${toy.brand}`.trim();
  
  console.log(`🔍 Searching for real product: ${query}`);
  
  try {
    const debug: SourceDebug = {
      googleCount: 0,
      bingCount: 0,
      retailerCount: 0,
      notes: []
    };

    // Step 1: Search for product URLs using multiple sources
    const [googleResults, bingResults, retailerResults] = await Promise.allSettled([
      googleReadable(query, debug),
      bingRss(query, debug), 
      retailerSearch(query, debug)
    ]);

    // Collect all candidate URLs
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

    if (candidateUrls.length === 0) {
      console.log(`❌ No product URLs found for: ${query}`);
      return {};
    }

    console.log(`📋 Found ${candidateUrls.length} candidate URLs for: ${query}`);

    // Step 2: Scrape the most promising URLs to get product metadata
    const topUrls = candidateUrls.slice(0, 5); // Try top 5 URLs
    const metadataResults = await Promise.allSettled(
      topUrls.map(url => scrapeProductMeta(url))
    );

    // Step 3: Find the best match with valid image
    for (const result of metadataResults) {
      if (result.status === 'fulfilled' && result.value) {
        const meta = result.value;
        
        // Validate that we have essential data
        if (meta.productUrl && meta.imageUrl && meta.title) {
          // Step 4: Validate the image URL actually works
          const imageIsValid = await validateImageUrl(meta.imageUrl);
          
          if (imageIsValid) {
            console.log(`✅ Found valid product with image: ${meta.title}`);
            return {
              retailer: meta.retailer || 'unknown',
              productUrl: meta.productUrl,
              imageUrl: meta.imageUrl,
              price: typeof meta.price === 'number' ? meta.price : 
                     typeof meta.price === 'string' ? parseFloat(meta.price.replace(/[^\d.]/g, '')) || toy.priceRange.min :
                     toy.priceRange.min,
            };
          } else {
            console.log(`❌ Image URL invalid for: ${meta.title}`);
          }
        }
      }
    }

    console.log(`❌ No valid products with working images found for: ${query}`);
    return {};
    
  } catch (error) {
    console.error(`Real product search failed for ${query}:`, error);
    return {};
  }
}

/**
 * Validate that an image URL actually returns a valid image
 */
async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(imageUrl, {
      method: 'HEAD', // Only check headers, don't download the image
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    // Check if response is successful and content type is an image
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const isImage = contentType?.startsWith('image/') || false;
      console.log(`🖼️  Image validation: ${imageUrl} -> ${response.status} ${contentType} ${isImage ? '✅' : '❌'}`);
      return isImage;
    }
    
    console.log(`❌ Image validation failed: ${imageUrl} -> ${response.status}`);
    return false;
    
  } catch (error) {
    console.log(`❌ Image validation error: ${imageUrl} -> ${error}`);
    return false;
  }
}

/**
 * Remove duplicates based on title similarity
 */
function deduplicateByTitle(rows: FastCatalogRow[]): FastCatalogRow[] {
  const seen = new Set<string>();
  const unique: FastCatalogRow[] = [];

  for (const row of rows) {
    const normalizedTitle = row.title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!seen.has(normalizedTitle)) {
      seen.add(normalizedTitle);
      unique.push(row);
    }
  }

  return unique;
}

/**
 * Save fast catalog to database
 */
export async function saveFastCatalog(gender: Gender, rows: FastCatalogRow[], replaceGender = true) {
  await dbConnect();
  
  if (replaceGender) {
    await CatalogItem.deleteMany({ gender });
  }

  const docs = rows.map(row => ({
    title: row.title,
    gender,
    price: row.price,
    retailer: row.retailer,
    productUrl: row.productUrl,
    imageUrl: row.imageUrl,
    brand: row.brand,
    category: row.category,
    tags: row.keywords,
  }));

  try {
    const inserted = await CatalogItem.insertMany(docs, { ordered: false });
    return { ok: true, count: inserted.length };
  } catch (error) {
    console.error("Save error:", error);
    return { ok: false, count: 0, error: String(error) };
  }
}

/**
 * Quick search existing catalog for instant results
 */
export async function searchCatalog(
  query: string,
  gender?: Gender,
  category?: string,
  priceRange?: { min: number; max: number },
  limit = 20
) {
  await dbConnect();

  const searchFilter: Record<string, unknown> = {};
  
  if (gender) {
    searchFilter.gender = { $in: [gender, "neutral"] };
  }
  
  if (category) {
    searchFilter.category = category;
  }
  
  if (priceRange) {
    searchFilter.price = {
      $gte: priceRange.min,
      $lte: priceRange.max,
    };
  }

  // Text search
  const textSearchFilter = query ? {
    $text: { $search: query }
  } : {};

  const results = await CatalogItem.find({
    ...searchFilter,
    ...textSearchFilter,
  })
  .sort(query ? { score: { $meta: "textScore" } } : { updatedAt: -1 })
  .limit(limit)
  .select("title brand category gender price retailer productUrl imageUrl tags")
  .lean();

  return results.map((item: Record<string, unknown>) => ({
    ...item,
    _id: String(item._id),
    // Use placeholder only for items without valid imageUrl
    imageUrl: item.imageUrl || "/images/christmasMagic.png",
  }));
}

/**
 * Get trending toys by category for quick population
 */
export async function getTrendingByCategory(gender: Gender, category?: ToyCategory) {
  const trending = POPULAR_TOYS_2025
    .filter(toy => {
      if (gender !== "neutral" && toy.gender !== gender && toy.gender !== "neutral") return false;
      if (category && toy.category !== category) return false;
      return true;
    })
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 12);

  return trending.map((toy, index) => ({
    _id: `trending_${index}`,
    title: toy.title,
    brand: toy.brand,
    category: toy.category,
    gender: toy.gender,
    price: toy.priceRange.min,
    tags: toy.keywords,
    popularity: toy.popularity,
  }));
}