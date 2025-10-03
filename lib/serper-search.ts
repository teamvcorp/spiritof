// /lib/serper-search.ts
// Serper.dev API integration - easier alternative to Google Custom Search API

export interface SerperSearchResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  position: number;
  sitelinks?: Array<{
    title: string;
    link: string;
  }>;
}

export interface SerperResponse {
  searchParameters: {
    q: string;
    type: string;
    engine: string;
  };
  organic: SerperSearchResult[];
  peopleAlsoAsk?: Array<{
    question: string;
    snippet: string;
    title: string;
    link: string;
  }>;
  relatedSearches?: Array<{
    query: string;
  }>;
  searchInformation: {
    totalResults: number;
    timeTaken: number;
    originalQuery: string;
  };
}

const SERPER_API_KEY = process.env.SERPER_API_KEY;

export async function serperSearch(
  query: string,
  options: {
    num?: number; // Number of results (max 100)
    page?: number; // Page number
    location?: string; // Geographic location
    tbs?: string; // Time-based search (e.g., 'qdr:d' for past day)
    site?: string; // Restrict to specific site (e.g., 'walmart.com')
  } = {}
): Promise<SerperResponse | null> {
  if (!SERPER_API_KEY) {
    throw new Error('Serper API key not configured. Add SERPER_API_KEY to your .env file');
  }

  const {
    num = 10,
    page = 1,
    location = 'United States',
    tbs,
    site
  } = options;

  // Build search query with site restriction if specified
  let searchQuery = query;
  if (site) {
    searchQuery = `site:${site} ${query}`;
  }

  const requestBody = {
    q: searchQuery,
    num,
    page,
    location,
    ...(tbs && { tbs })
  };

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Serper API error:', response.status, errorText);
      return null;
    }

    const data: SerperResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Serper API request failed:', error);
    return null;
  }
}

// Helper function to search specific retailers using Serper
export async function serperRetailerSearch(
  query: string,
  retailer: 'walmart' | 'target' | 'amazon' | 'toysrus',
  limit: number = 10
): Promise<SerperSearchResult[]> {
  const siteMap = {
    walmart: 'walmart.com',
    target: 'target.com',
    amazon: 'amazon.com',
    toysrus: 'toysrus.com'
  };

  const site = siteMap[retailer];
  const enhancedQuery = `${query} toys kids children`;

  const response = await serperSearch(enhancedQuery, {
    num: limit,
    site
  });

  return response?.organic || [];
}

// Batch search function for multiple queries with rate limiting
export async function batchSerperSearch(
  queries: string[],
  options: {
    maxConcurrent?: number;
    delayMs?: number;
    retailer?: 'walmart' | 'target' | 'amazon' | 'toysrus';
    resultsPerQuery?: number;
  } = {}
): Promise<Array<{ query: string; results: SerperSearchResult[]; error?: string }>> {
  const {
    maxConcurrent = 5, // Serper allows higher concurrency than Google
    delayMs = 200, // Shorter delay for Serper
    retailer,
    resultsPerQuery = 10
  } = options;

  const results: Array<{ query: string; results: SerperSearchResult[]; error?: string }> = [];
  
  // Process queries in batches
  for (let i = 0; i < queries.length; i += maxConcurrent) {
    const batch = queries.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (query) => {
      try {
        const searchResults = retailer 
          ? await serperRetailerSearch(query, retailer, resultsPerQuery)
          : (await serperSearch(`${query} toys kids`, { num: resultsPerQuery }))?.organic || [];
        
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

    // Add delay between batches
    if (i + maxConcurrent < queries.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// Convert Serper results to the format expected by your existing code
export function convertSerperToRawCandidates(results: SerperSearchResult[]): Array<{
  url: string;
  title?: string;
  snippet?: string;
}> {
  return results.map(result => ({
    url: result.link,
    title: result.title,
    snippet: result.snippet
  }));
}