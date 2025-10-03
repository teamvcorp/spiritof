// /lib/google-custom-search.ts
// Google Custom Search API integration for reliable product searches

export interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl: string;
  pagemap?: {
    product?: Array<{
      name?: string;
      price?: string;
      image?: string;
      brand?: string;
      category?: string;
    }>;
    metatags?: Array<{
      'og:title'?: string;
      'og:description'?: string;
      'og:image'?: string;
      'product:price:amount'?: string;
      'product:brand'?: string;
    }>;
  };
}

export interface GoogleCustomSearchResponse {
  items?: GoogleSearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
  error?: {
    code: number;
    message: string;
    errors: Array<{
      domain: string;
      reason: string;
      message: string;
    }>;
  };
}

const GOOGLE_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

export async function googleCustomSearch(
  query: string,
  options: {
    num?: number; // Number of results (1-10)
    start?: number; // Starting index
    siteSearch?: string; // Restrict to specific site
    excludeTerms?: string[]; // Terms to exclude
  } = {}
): Promise<GoogleCustomSearchResponse> {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    throw new Error('Google Custom Search API credentials not configured');
  }

  const {
    num = 10,
    start = 1,
    siteSearch,
    excludeTerms = []
  } = options;

  // Build search query with exclusions
  let searchQuery = query;
  if (excludeTerms.length > 0) {
    searchQuery += ' ' + excludeTerms.map(term => `-${term}`).join(' ');
  }

  const params = new URLSearchParams({
    key: GOOGLE_API_KEY,
    cx: GOOGLE_CSE_ID,
    q: searchQuery,
    num: num.toString(),
    start: start.toString(),
    safe: 'active',
    fields: 'items(title,link,snippet,displayLink,formattedUrl,pagemap),searchInformation(totalResults,searchTime)'
  });

  if (siteSearch) {
    params.append('siteSearch', siteSearch);
  }

  const url = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data: GoogleCustomSearchResponse = await response.json();

    if (!response.ok) {
      console.error('Google Custom Search API error:', data.error);
      return { error: data.error };
    }

    return data;
  } catch (error) {
    console.error('Google Custom Search request failed:', error);
    return {
      error: {
        code: 500,
        message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: []
      }
    };
  }
}

// Helper function to search specific retailers
export async function searchRetailer(
  query: string,
  retailer: 'walmart' | 'target' | 'amazon' | 'toysrus',
  limit: number = 10
): Promise<GoogleSearchResult[]> {
  const siteMap = {
    walmart: 'walmart.com',
    target: 'target.com', 
    amazon: 'amazon.com',
    toysrus: 'toysrus.com'
  };

  const site = siteMap[retailer];
  const enhancedQuery = `${query} toys kids children`;

  const response = await googleCustomSearch(enhancedQuery, {
    num: limit,
    siteSearch: site,
    excludeTerms: ['review', 'reviews', 'blog', 'news', 'article']
  });

  return response.items || [];
}

// Helper function to extract product data from Google search results
export function extractProductData(result: GoogleSearchResult): {
  title: string;
  url: string;
  price?: string;
  brand?: string;
  image?: string;
  retailer: string;
} {
  const retailer = result.displayLink.replace(/^www\./, '').split('.')[0];
  
  // Try to extract price from various sources
  let price = result.pagemap?.product?.[0]?.price ||
              result.pagemap?.metatags?.[0]?.['product:price:amount'];
  
  // Clean up price format
  if (price && typeof price === 'string') {
    price = price.replace(/[^\d.,]/g, ''); // Remove non-numeric chars except . and ,
    if (price && !price.includes('.') && !price.includes(',')) {
      // If no decimal, assume it's cents and convert to dollars
      if (price.length > 2) {
        price = `${price.slice(0, -2)}.${price.slice(-2)}`;
      }
    }
  }

  return {
    title: result.pagemap?.product?.[0]?.name || 
           result.pagemap?.metatags?.[0]?.['og:title'] || 
           result.title,
    url: result.link,
    price,
    brand: result.pagemap?.product?.[0]?.brand || 
           result.pagemap?.metatags?.[0]?.['product:brand'],
    image: result.pagemap?.product?.[0]?.image || 
           result.pagemap?.metatags?.[0]?.['og:image'],
    retailer: retailer.charAt(0).toUpperCase() + retailer.slice(1)
  };
}

// Batch search function for multiple queries
export async function batchGoogleSearch(
  queries: string[],
  options: {
    maxConcurrent?: number;
    delayMs?: number;
    retailer?: 'walmart' | 'target' | 'amazon' | 'toysrus';
    resultsPerQuery?: number;
  } = {}
): Promise<Array<{ query: string; results: GoogleSearchResult[]; error?: string }>> {
  const {
    maxConcurrent = 3, // Respect API rate limits
    delayMs = 1000, // 1 second delay between batches
    retailer,
    resultsPerQuery = 10
  } = options;

  const results: Array<{ query: string; results: GoogleSearchResult[]; error?: string }> = [];
  
  // Process queries in batches to respect rate limits
  for (let i = 0; i < queries.length; i += maxConcurrent) {
    const batch = queries.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (query) => {
      try {
        const searchResults = retailer 
          ? await searchRetailer(query, retailer, resultsPerQuery)
          : (await googleCustomSearch(`${query} toys kids`, { num: resultsPerQuery })).items || [];
        
        return { query, results: searchResults };
      } catch (error) {
        return { 
          query, 
          results: [], 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add delay between batches (except for the last batch)
    if (i + maxConcurrent < queries.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}