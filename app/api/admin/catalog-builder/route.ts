import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { MasterCatalog } from '@/models/MasterCatalog';
import { enhancedProductSearch } from '@/lib/enhanced-search';
import { scrapeProductMeta, dedupeByPath } from '@/lib/catalog-sourcing';
import { searchPopularToys } from '@/lib/toy-data-source';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'defaultpassword';

// Popular toy search queries based on trends and seasons
const TRENDING_QUERIES = [
  // Core categories
  'barbie', 'lego', 'pokemon', 'disney princess', 'marvel', 'minecraft',
  'hot wheels', 'baby doll', 'action figure', 'puzzle', 'board game',
  
  // Gaming
  'nintendo switch', 'playstation', 'xbox', 'video games', 'gaming controller',
  
  // Educational
  'stem toys', 'learning toys', 'science kit', 'robot toy', 'coding toy',
  
  // Outdoor
  'bike', 'scooter', 'outdoor toys', 'sports toys', 'water toys',
  
  // Arts & Crafts
  'art supplies', 'craft kit', 'drawing set', 'paint set', 'jewelry making',
  
  // Trending characters/brands
  'paw patrol', 'peppa pig', 'frozen', 'spider-man', 'batman', 'unicorn',
  'dinosaur', 'cars', 'trucks', 'dolls', 'stuffed animals',
  
  // Age-specific
  'toddler toys', 'preschool toys', 'teen gifts', 'baby toys'
];

interface CatalogBuildResult {
  query: string;
  found: number;
  scraped: number;
  added: number;
  errors: string[];
}

export async function GET(request: NextRequest) {
  const password = request.headers.get('X-Admin-Password');
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  
  const existingCount = await MasterCatalog.countDocuments();
  
  return NextResponse.json({
    message: 'Catalog Builder Admin API',
    currentCatalogSize: existingCount,
    availableQueries: TRENDING_QUERIES.length,
    endpoints: {
      buildCatalog: 'POST /api/admin/catalog-builder (builds catalog from trending searches)',
      testSearch: 'POST /api/admin/catalog-builder/test (test search for specific query)',
      clearCatalog: 'DELETE /api/admin/catalog-builder (clears entire catalog)',
      getStats: 'GET /api/admin/catalog-builder/stats (get catalog statistics)'
    }
  });
}

export async function POST(request: NextRequest) {
  const password = request.headers.get('X-Admin-Password');
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { 
    queries = TRENDING_QUERIES, 
    maxPerQuery = 5, 
    testMode = false,
    customQuery = null 
  } = body;

  await dbConnect();

  console.log(`🚀 Starting catalog build with ${queries.length} queries, max ${maxPerQuery} per query`);
  
  const results: CatalogBuildResult[] = [];
  let totalAdded = 0;
  
  // If testing a custom query, just use that
  const searchQueries = customQuery ? [customQuery] : queries.slice(0, testMode ? 3 : queries.length);

  for (const query of searchQueries) {
    console.log(`🔍 Processing query: "${query}"`);
    
    const result: CatalogBuildResult = {
      query,
      found: 0,
      scraped: 0,
      added: 0,
      errors: []
    };

    try {
      // Use our enhanced search to find products
      const searchResponse = await enhancedProductSearch(query, 'neutral', undefined, undefined, maxPerQuery * 2);
      const searchResults = searchResponse.items;
      result.found = searchResults.length;
      
      console.log(`📦 Found ${searchResults.length} results for "${query}"`);

      // Process each search result
      const productPromises = searchResults
        .filter((item: any) => item.productUrl) // Only items with URLs
        .slice(0, maxPerQuery)
        .map(async (item: any) => {
          try {
            console.log(`🔗 Processing: ${item.title}`);
            
            // Check if already exists in catalog
            const existing = await MasterCatalog.findOne({
              $or: [
                { productUrl: item.productUrl },
                { title: { $regex: new RegExp(item.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } }
              ]
            });

            if (existing) {
              console.log(`⏭️ Skipping existing item: ${item.title}`);
              return null;
            }

            // Extract additional metadata if we have a URL
            let enhancedMeta = null;
            if (item.productUrl && item.productUrl.startsWith('http')) {
              try {
                enhancedMeta = await scrapeProductMeta(item.productUrl);
                result.scraped++;
              } catch (e: any) {
                result.errors.push(`Scraping failed for ${item.productUrl}: ${e?.message || e}`);
              }
            }

            // Create catalog entry
            const catalogItem = {
              title: enhancedMeta?.title || item.title,
              brand: enhancedMeta?.brand || item.brand || 'Unknown',
              category: item.category || 'toys',
              gender: item.gender || 'neutral',
              price: enhancedMeta?.price || item.price,
              retailer: enhancedMeta?.retailer || item.retailer || 'online',
              productUrl: item.productUrl,
              imageUrl: enhancedMeta?.imageUrl || item.imageUrl,
              tags: [query, ...(item.tags || [])],
              popularity: item.popularity || 50,
              sourceType: item.sourceType || 'admin_import',
              availability: 'in_stock',
              isInCatalog: true,
              addedAt: new Date(),
              searchQuery: query
            };

            // Save to master catalog
            const catalogEntry = new MasterCatalog(catalogItem);
            await catalogEntry.save();
            
            result.added++;
            totalAdded++;
            console.log(`✅ Added: ${catalogItem.title}`);
            
            return catalogEntry;
          } catch (error: any) {
            result.errors.push(`Error processing ${item.title}: ${error?.message || error}`);
            return null;
          }
        });

      await Promise.all(productPromises);
      
    } catch (error: any) {
      console.error(`❌ Error processing query "${query}":`, error);
      result.errors.push(`Query failed: ${error?.message || error}`);
    }

    results.push(result);
    
    // Small delay between queries to be respectful
    if (!testMode) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const summary = {
    totalQueries: searchQueries.length,
    totalItemsAdded: totalAdded,
    totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
    results: results,
    catalogSize: await MasterCatalog.countDocuments()
  };

  console.log(`🎉 Catalog build complete! Added ${totalAdded} items across ${searchQueries.length} queries`);

  return NextResponse.json(summary);
}

export async function DELETE(request: NextRequest) {
  const password = request.headers.get('X-Admin-Password');
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  
  const result = await MasterCatalog.deleteMany({});
  
  return NextResponse.json({
    message: 'Catalog cleared',
    deletedCount: result.deletedCount
  });
}