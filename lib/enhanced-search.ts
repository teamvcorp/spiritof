import { searchMasterCatalog } from "@/lib/catalog-service";
import { searchPopularToys } from "@/lib/toy-data-source";
import { googleReadable, bingRss, retailerSearch, scrapeProductMeta, dedupeByPath, toCatalogDraft, type SourceDebug } from "@/lib/catalog-sourcing";
import { dbConnect } from "@/lib/db";
import { MasterCatalog } from "@/models/MasterCatalog";
import { getBestProvider, getRateLimit, isQuotaExceeded } from "@/lib/search-config";

// Enhanced search that combines multiple sources including live internet search
export async function enhancedProductSearch(
  query: string,
  gender: "boy" | "girl" | "neutral" = "neutral",
  category?: string,
  priceRange?: { min: number; max: number },
  limit: number = 24
) {
  const results = [];
  const debug: SourceDebug = { googleCount: 0, bingCount: 0, retailerCount: 0, notes: [] };

  console.log(`🔍 Enhanced search: "${query}" for ${gender} ${category || 'any category'}`);

  // Step 1: Try exact and high-quality matches first
  let goodCatalogResults: any[] = [];
  
  if (query.trim().length > 2) {
    await dbConnect();
    
    // First try exact title matches
    const exactMatches = await MasterCatalog.find({
      isActive: true,
      title: { $regex: new RegExp(`^${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ...(gender !== "neutral" && { gender: { $in: [gender, "neutral"] } }),
      ...(category && { category: new RegExp(category, 'i') }),
      ...(priceRange && { 
        price: { $gte: priceRange.min, $lte: priceRange.max } 
      })
    }).limit(10).lean();

    // Then try partial but high-quality matches
    const partialMatches = await MasterCatalog.find({
      isActive: true,
      $or: [
        { title: { $regex: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
        { brand: { $regex: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
        { tags: { $in: [new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')] } }
      ],
      ...(gender !== "neutral" && { gender: { $in: [gender, "neutral"] } }),
      ...(category && { category: new RegExp(category, 'i') }),
      ...(priceRange && { 
        price: { $gte: priceRange.min, $lte: priceRange.max } 
      })
    }).limit(15).lean();

    // Combine and dedupe by _id
    const seenIds = new Set();
    goodCatalogResults = [...exactMatches, ...partialMatches].filter(item => {
      if (seenIds.has(item._id.toString())) return false;
      seenIds.add(item._id.toString());
      
      // Quality filter - make sure the match is actually relevant
      const queryLower = query.toLowerCase();
      const titleLower = item.title.toLowerCase();
      const brandLower = (item.brand || '').toLowerCase();
      
      return (
        titleLower.includes(queryLower) ||
        brandLower.includes(queryLower) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(queryLower)))
      );
    });
  }

  // Add high-quality catalog results
  results.push(...goodCatalogResults.map(item => ({
    _id: item._id?.toString() || '',
    title: item.title,
    brand: item.brand,
    category: item.category,
    gender: item.gender,
    price: item.price,
    retailer: item.retailer,
    productUrl: item.productUrl,
    imageUrl: item.imageUrl, // Keep original imageUrl (may be null)
    blobUrl: item.blobUrl,   // Keep original blobUrl (this is what we want to use)
    tags: item.tags,
    popularity: item.popularity,
    sourceType: "master_catalog",
    isInCatalog: true
  })));

  console.log(`📚 Found ${results.length} high-quality catalog matches`);

  // DISABLED: Live search - we only want masterCatalog items
  // Only return items from the masterCatalog database
  console.log(`✅ Returning ${results.length} masterCatalog items only (live search disabled)`);

  return {
    items: results.slice(0, limit),
    total: results.length,
    breakdown: {
      catalog: results.length,
      curated: 0,
      trending: 0,
      live: 0,
    },
    debug: [`Returned ${results.length} masterCatalog items only`]
  };
}