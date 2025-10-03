import { NextRequest, NextResponse } from 'next/server';
import { enhancedProductSearch } from '@/lib/enhanced-search';
import { scrapeProductMeta } from '@/lib/catalog-sourcing';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'defaultpassword';

export async function POST(request: NextRequest) {
  const password = request.headers.get('X-Admin-Password');
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { query, limit = 5 } = body;

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    console.log(`🧪 Testing search for: "${query}"`);
    
    // Run the enhanced search
    const searchResponse = await enhancedProductSearch(query, 'neutral', undefined, undefined, limit);
    const searchResults = searchResponse.items;
    
    console.log(`📦 Found ${searchResults.length} results for "${query}"`);
    
    // Try to scrape additional details for the first few results with URLs
    const enhancedResults = await Promise.all(
      searchResults.slice(0, 3).map(async (item: any) => {
        if (item.productUrl && item.productUrl.startsWith('http')) {
          try {
            const scrapedMeta = await scrapeProductMeta(item.productUrl);
            return {
              ...item,
              scrapedMeta: scrapedMeta,
              enhanced: true
            };
          } catch (e: any) {
            return {
              ...item,
              scrapingError: e?.message || 'Scraping failed',
              enhanced: false
            };
          }
        }
        return {
          ...item,
          enhanced: false,
          reason: 'No valid URL'
        };
      })
    );

    return NextResponse.json({
      query,
      totalFound: searchResults.length,
      results: searchResults,
      enhancedSample: enhancedResults,
      fullResponse: searchResponse,
      summary: {
        withUrls: searchResults.filter((item: any) => item.productUrl).length,
        sourceBreakdown: searchResponse.breakdown
      }
    });

  } catch (error: any) {
    console.error('Test search failed:', error);
    return NextResponse.json({ 
      error: 'Search failed', 
      details: error?.message || error 
    }, { status: 500 });
  }
}