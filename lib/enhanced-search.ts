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
    imageUrl: item.blobUrl || item.imageUrl || "/images/christmasMagic.png",
    blobUrl: item.blobUrl,
    tags: item.tags,
    popularity: item.popularity,
    sourceType: "master_catalog",
    isInCatalog: true
  })));

  console.log(`📚 Found ${results.length} high-quality catalog matches`);

  // Step 2: Only do enhanced search if we don't have enough good results
  const MIN_GOOD_RESULTS = 12; // Threshold for triggering live search
  
  if (results.length < MIN_GOOD_RESULTS && query.trim().length > 2) {
    const currentProvider = getBestProvider();
    console.log(`🌐 Need more results (${results.length}/${MIN_GOOD_RESULTS}), performing live search using provider: ${currentProvider}`);
    
    try {
      // Create a kid-safe search query
      const kidSafeQuery = `${query} kids toys children safe`;
      
      // Log which search provider we're using
      debug.notes.push(`Using search provider: ${currentProvider}`);
      
      // Get URLs from multiple sources with improved error handling
      const [googleUrls, bingUrls, retailerUrls] = await Promise.all([
        googleReadable(kidSafeQuery, debug).catch(e => { 
          console.log('🚨 Google search failed:', e?.message);
          const errorMsg = e?.message || 'Unknown error';
          debug.notes.push(`Google search error: ${errorMsg}`);
          
          // Check if it's a quota error and suggest fallback
          if (isQuotaExceeded(errorMsg)) {
            debug.notes.push('Google quota exceeded - using Bing backup');
            console.log('💡 Google quota exceeded, fallbacks will be used automatically');
          }
          
          return []; 
        }),
        bingRss(kidSafeQuery, debug).catch(e => { 
          console.log('🚨 Bing search failed:', e?.message); 
          debug.notes.push(`Bing search error: ${e?.message}`);
          return []; 
        }),
        retailerSearch(kidSafeQuery, debug).catch(e => { 
          console.log('🚨 Retailer search failed:', e?.message); 
          debug.notes.push(`Retailer search error: ${e?.message}`);
          return []; 
        })
      ]);

      console.log(`🔍 Live search debug:`, debug);
      console.log(`📊 Raw results - Google: ${googleUrls.length}, Bing: ${bingUrls.length}, Retailer: ${retailerUrls.length}`);

      // Combine and dedupe URLs
      const allUrls = [
        ...googleUrls.map(c => c.url),
        ...bingUrls.map(c => c.url), 
        ...retailerUrls
      ];
      
      const uniqueUrls = dedupeByPath(allUrls).slice(0, Math.min(8, MIN_GOOD_RESULTS - results.length));
      console.log(`🔗 Found ${uniqueUrls.length} unique product URLs`);

      // Scrape product details
      const productPromises = uniqueUrls.map(async (url) => {
        try {
          console.log(`🔍 Scraping product from: ${url}`);
          const meta = await scrapeProductMeta(url);
          console.log(`📦 Scraped result for ${url}:`, meta ? `title="${meta.title}", price="${meta.price}"` : 'null');
          
          if (meta && meta.title) {
            const catalogDraft = toCatalogDraft(meta, gender);
            
            // Quality check - make sure this is relevant to the search
            const titleLower = catalogDraft.title.toLowerCase();
            const queryLower = query.toLowerCase();
            const relevanceScore = (
              (titleLower.includes(queryLower) ? 2 : 0) +
              ((catalogDraft.brand || '').toLowerCase().includes(queryLower) ? 1 : 0) +
              (titleLower.split(' ').some(word => queryLower.includes(word)) ? 0.5 : 0)
            );
            
            console.log(`🎯 Relevance score for "${catalogDraft.title}": ${relevanceScore}`);
            
            if (relevanceScore < 0.5) {
              console.log(`❌ Skipping irrelevant result: ${catalogDraft.title}`);
              return null;
            }
            
            return {
              _id: `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: catalogDraft.title,
              brand: catalogDraft.brand || 'Unknown',
              category: catalogDraft.category || category || 'toys',
              gender: catalogDraft.gender,
              price: catalogDraft.price || undefined,
              retailer: catalogDraft.retailer || 'Online Store',
              productUrl: url,
              imageUrl: meta.imageUrl || "/images/christmasMagic.png",
              tags: [query.toLowerCase(), catalogDraft.category || 'toys'],
              popularity: 75 + Math.floor(relevanceScore * 10), // Boost relevant items
              sourceType: "live_search",
              isInCatalog: false
            };
          }
          return null;
        } catch (e: any) {
          console.log(`🚨 Failed to scrape ${url}:`, e?.message || 'Unknown error');
          return null;
        }
      });

      const liveResults = (await Promise.all(productPromises))
        .filter((item): item is NonNullable<typeof item> => {
          if (!item) return false;
          // Additional kid-safety filters
          const title = item.title.toLowerCase();
          const unsafeKeywords = ['adult', 'mature', '18+', 'violent', 'weapon', 'gun', 'knife'];
          return !unsafeKeywords.some(keyword => title.includes(keyword));
        });

      results.push(...liveResults);
      console.log(`🌐 Added ${liveResults.length} live search results`);

    } catch (error: any) {
      console.error('Live search error:', error);
      debug.notes.push(`Live search failed: ${error?.message || 'Unknown error'}`);
    }
  }

  // Step 3: Fill remaining slots with curated items if still needed
  if (results.length < limit && query.trim()) {
    const curatedResults = searchPopularToys(query, Math.min(6, limit - results.length));
    results.push(...curatedResults.map((toy, index) => ({
      _id: `curated_${Date.now()}_${index}`,
      title: toy.title,
      brand: toy.brand,
      category: toy.category,
      gender: toy.gender,
      price: toy.priceRange.min,
      retailer: "multiple",
      productUrl: `https://www.google.com/search?q=${encodeURIComponent(toy.title + " " + toy.brand)}`,
      imageUrl: undefined, // No placeholder image - let frontend handle fallback
      tags: toy.keywords,
      popularity: toy.popularity,
      sourceType: "curated",
      isInCatalog: false
    })));
    console.log(`📋 Added ${curatedResults.length} curated results`);
  }

  // Step 4: Final fallback with trending items if still not enough
  if (results.length < limit / 2) {
    const trendingToys = [
      { title: "PlayStation 5 Console", brand: "Sony", category: "electronics", price: 499.99, popularity: 98, keywords: ["playstation", "ps5", "gaming", "console"] },
      { title: "Nintendo Switch OLED", brand: "Nintendo", category: "electronics", price: 349.99, popularity: 96, keywords: ["nintendo", "switch", "gaming"] },
      { title: "LEGO Creator 3-in-1 Deep Sea Creatures", brand: "LEGO", category: "building-blocks", price: 79.99, popularity: 95, keywords: ["lego", "building", "creator"] },
      { title: "Barbie Dreamhouse Adventures Playset", brand: "Barbie", category: "dolls", price: 199.99, popularity: 92, keywords: ["barbie", "dollhouse", "playset"] },
      { title: "Hot Wheels Track Builder Unlimited", brand: "Hot Wheels", category: "vehicles", price: 49.99, popularity: 88, keywords: ["hot wheels", "cars", "track"] },
      { title: "Pokémon Trading Card Game Battle Academy", brand: "Pokémon", category: "games-puzzles", price: 19.99, popularity: 90, keywords: ["pokemon", "cards", "game"] },
    ].filter(toy => 
      !query.trim() || 
      toy.title.toLowerCase().includes(query.toLowerCase()) ||
      toy.brand.toLowerCase().includes(query.toLowerCase()) ||
      toy.keywords.some(k => k.toLowerCase().includes(query.toLowerCase())) ||
      toy.category.includes(category || '')
    );

    results.push(...trendingToys.slice(0, Math.min(4, limit - results.length)).map((toy, index) => ({
      _id: `trending_${Date.now()}_${index}`,
      title: toy.title,
      brand: toy.brand,
      category: toy.category,
      gender: gender,
      price: toy.price,
      retailer: "multiple",
      productUrl: `https://www.google.com/search?q=${encodeURIComponent(toy.title)}`,
      imageUrl: undefined, // No placeholder image - let frontend handle fallback
      tags: toy.keywords,
      popularity: toy.popularity,
      sourceType: "trending",
      isInCatalog: false
    })));
    console.log(`⭐ Added ${trendingToys.length} trending fallback results`);
  }

  const finalResults = results.slice(0, limit);
  console.log(`✅ Returning ${finalResults.length} total results (${results.filter(r => r.sourceType === "master_catalog").length} catalog, ${results.filter(r => r.sourceType === "live_search").length} live, ${results.filter(r => r.sourceType === "curated").length} curated, ${results.filter(r => r.sourceType === "trending").length} trending)`);

  return {
    items: finalResults,
    total: finalResults.length,
    breakdown: {
      catalog: results.filter((r): r is NonNullable<typeof r> => r?.sourceType === "master_catalog").length,
      curated: results.filter((r): r is NonNullable<typeof r> => r?.sourceType === "curated").length,
      trending: results.filter((r): r is NonNullable<typeof r> => r?.sourceType === "trending").length,
      live: results.filter((r): r is NonNullable<typeof r> => r?.sourceType === "live_search").length,
    },
    debug: debug.notes
  };
}