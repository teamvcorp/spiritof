# Google Custom Search API Setup Guide

## Why You Need This
Your current search system is getting rate-limited (HTTP 451 errors) because you're using proxy services like Jina.ai to scrape Google. Google Custom Search API gives you **official, unrestricted access** to Google's search results with **100 free searches per day** and paid plans for more.

## Step 1: Create Google Custom Search Engine

1. **Go to Google Custom Search Engine**: https://cse.google.com/cse/
2. **Click "Add"** to create a new search engine
3. **Configure your search engine**:
   - **Sites to search**: Leave empty (this will search the entire web)
   - **Language**: English
   - **Name**: "Spirit of Santa Toy Search"
   - **Search engine keywords**: toys, children, kids, gifts, christmas

4. **Click "Create"**
5. **Copy your Search Engine ID** (looks like: `017576662512468239146:omuauf_lfve`)

## Step 2: Get Google Custom Search API Key

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one:
   - Project name: "spirit-of-santa" 
   - Enable billing (required for API access)

3. **Enable Custom Search API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Custom Search API"
   - Click on it and press "Enable"

4. **Create API Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key (looks like: `AIzaSyB1234567890abcdefghijklmnop`)

5. **Restrict the API Key** (recommended):
   - Click on your API key to edit it
   - Under "API restrictions", select "Custom Search API"
   - Under "Application restrictions", add your domain or IP

## Step 3: Configure Search Engine for Web Search

1. **Go back to your Custom Search Engine**: https://cse.google.com/cse/
2. **Click on your search engine** to edit it
3. **In the "Setup" tab**:
   - Remove any sites from "Sites to search" section
   - Turn ON "Search the entire web"
   - Turn ON "Image search"
   - Turn OFF "Safe Search" (optional, for broader results)

4. **In the "Look and feel" tab**:
   - Choose "Results only" layout
   - Disable ads (if you don't want them)

## Step 4: Update Your .env File

Add these lines to your `.env` file:

```env
# Google Custom Search API (for reliable product searches)
GOOGLE_CUSTOM_SEARCH_API_KEY=your_actual_api_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_actual_engine_id_here
```

**Replace with your actual values:**
- `GOOGLE_CUSTOM_SEARCH_API_KEY`: The API key from Step 2
- `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`: The Search Engine ID from Step 1

## Step 5: Test Your Setup

Once configured, your catalog builder will automatically use the Google Custom Search API instead of the unreliable proxy services.

**What you'll get:**
- ✅ **No more 451 errors** or rate limiting
- ✅ **Official Google results** with rich metadata
- ✅ **100 free searches/day** (more with paid plan)
- ✅ **Better product information** extracted from search results
- ✅ **Reliable retailer-specific searches** (Walmart, Target, Amazon)

## Cost Information

- **Free Tier**: 100 searches per day
- **Paid Plan**: $5 per 1,000 additional searches
- **For your use case**: Probably stay within free tier for testing, upgrade if needed

## Alternative: Serper.dev API (Easier Setup)

If Google Custom Search seems complex, you can also use Serper.dev:

1. Go to https://serper.dev/
2. Sign up for free account (2,500 free searches)
3. Get your API key
4. Add to .env: `SERPER_API_KEY=your_serper_key`

I can help you implement Serper.dev integration if you prefer that route!

## Troubleshooting

**API Key doesn't work?**
- Make sure billing is enabled on your Google Cloud project
- Check that Custom Search API is enabled
- Verify API key restrictions aren't too strict

**Search Engine ID not working?**
- Make sure "Search the entire web" is enabled
- Check that no specific sites are listed in "Sites to search"

**Getting quota errors?**
- You've hit your daily limit (100 searches for free tier)
- Either wait until tomorrow or upgrade to paid plan

Need help with any of these steps? Let me know!