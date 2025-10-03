// /lib/search-config.ts
// Configuration for different search providers

export type SearchProvider = 'google-custom' | 'serper' | 'bing' | 'fallback';

export const SEARCH_CONFIG = {
  // Which provider to use (change this to switch providers)
  provider: (process.env.SEARCH_PROVIDER as SearchProvider) || 'google-custom',
  
  // Fallback order when primary provider fails or hits quota
  fallbackOrder: ['bing', 'google-custom', 'fallback'] as SearchProvider[],
  
  // Rate limiting and retry settings
  rateLimit: {
    'google-custom': {
      maxConcurrent: 3,
      delayMs: 1000,
      dailyLimit: 100 // Free tier daily limit
    },
    'serper': {
      maxConcurrent: 5,
      delayMs: 200,
      dailyLimit: 2500 // Free tier monthly limit (roughly 83/day)
    },
    'bing': {
      maxConcurrent: 2,
      delayMs: 1500,
      dailyLimit: 1000 // Conservative estimate
    },
    'fallback': {
      maxConcurrent: 2,
      delayMs: 2000,
      dailyLimit: Infinity
    }
  },
  
  // Provider availability check
  isAvailable: {
    'google-custom': () => !!(process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID),
    'serper': () => !!process.env.SERPER_API_KEY,
    'bing': () => true, // Always available (no API key required)
    'fallback': () => true
  },
  
  // Error patterns that indicate quota exceeded
  quotaExceededPatterns: [
    'quota exceeded',
    'queries per day',
    'daily limit',
    'rate limit exceeded',
    'too many requests'
  ]
};

// Check if an error indicates quota exceeded
export function isQuotaExceeded(error: string): boolean {
  const errorLower = error.toLowerCase();
  return SEARCH_CONFIG.quotaExceededPatterns.some(pattern => 
    errorLower.includes(pattern.toLowerCase())
  );
}

// Get the best available provider, considering quota status
export function getBestProvider(lastError?: string): SearchProvider {
  // If the configured provider hit quota, try fallbacks
  if (lastError && isQuotaExceeded(lastError)) {
    console.log(`🚨 Quota exceeded for ${SEARCH_CONFIG.provider}, trying fallbacks...`);
    
    for (const provider of SEARCH_CONFIG.fallbackOrder) {
      if (SEARCH_CONFIG.isAvailable[provider]()) {
        console.log(`🔄 Switching to fallback provider: ${provider}`);
        return provider;
      }
    }
  }
  
  // First try the configured provider
  if (SEARCH_CONFIG.isAvailable[SEARCH_CONFIG.provider]()) {
    return SEARCH_CONFIG.provider;
  }
  
  // Then try fallback providers in order
  for (const provider of SEARCH_CONFIG.fallbackOrder) {
    if (SEARCH_CONFIG.isAvailable[provider]()) {
      return provider;
    }
  }
  
  // Should never happen since fallback is always available
  return 'fallback';
}

// Get all available providers
export function getAvailableProviders(): SearchProvider[] {
  return (['google-custom', 'serper', 'bing', 'fallback'] as SearchProvider[])
    .filter(provider => SEARCH_CONFIG.isAvailable[provider]());
}

// Get rate limit settings for a provider
export function getRateLimit(provider: SearchProvider) {
  return SEARCH_CONFIG.rateLimit[provider];
}