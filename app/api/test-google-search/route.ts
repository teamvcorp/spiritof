// /app/api/test-google-search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { googleCustomSearch } from '@/lib/google-custom-search';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'barbie toys';
  
  console.log(`🧪 Testing Google Custom Search API with query: "${query}"`);
  
  try {
    const response = await googleCustomSearch(`${query} toys kids`, {
      num: 5
    });
    
    if (response.error) {
      return NextResponse.json({
        success: false,
        error: response.error,
        message: 'Google Custom Search API returned an error'
      }, { status: 400 });
    }
    
    const results = response.items || [];
    
    return NextResponse.json({
      success: true,
      query,
      totalResults: response.searchInformation?.totalResults || '0',
      searchTime: response.searchInformation?.searchTime || 0,
      resultsCount: results.length,
      results: results.map(item => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink,
        hasProductData: !!(item.pagemap?.product || item.pagemap?.metatags)
      })),
      message: `Found ${results.length} results successfully`
    });
    
  } catch (error) {
    console.error('Google Custom Search test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test Google Custom Search API'
    }, { status: 500 });
  }
}

// Test different retailers
export async function POST(request: NextRequest) {
  const { query = 'lego', retailers = ['walmart', 'target', 'amazon'] } = await request.json();
  
  console.log(`🧪 Testing retailer-specific searches for: "${query}"`);
  
  const results = [];
  
  for (const retailer of retailers) {
    try {
      const response = await googleCustomSearch(`${query} toys site:${retailer}.com`, {
        num: 3
      });
      
      results.push({
        retailer,
        success: !response.error,
        error: response.error?.message,
        resultsCount: response.items?.length || 0,
        sampleResults: response.items?.slice(0, 2).map(item => ({
          title: item.title,
          link: item.link,
          displayLink: item.displayLink
        })) || []
      });
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      results.push({
        retailer,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        resultsCount: 0,
        sampleResults: []
      });
    }
  }
  
  return NextResponse.json({
    success: true,
    query,
    results,
    summary: {
      totalRetailers: retailers.length,
      successfulRetailers: results.filter(r => r.success).length,
      totalResults: results.reduce((sum, r) => sum + r.resultsCount, 0)
    }
  });
}