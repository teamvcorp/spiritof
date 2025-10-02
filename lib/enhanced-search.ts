import { searchMasterCatalog } from "@/lib/catalog-service";
import { searchPopularToys } from "@/lib/toy-data-source";

// Enhanced search that combines multiple sources
export async function enhancedProductSearch(
  query: string,
  gender: "boy" | "girl" | "neutral" = "neutral",
  category?: string,
  priceRange?: { min: number; max: number },
  limit: number = 24
) {
  const results = [];

  // 1. First search our master catalog (fastest)
  const catalogResults = await searchMasterCatalog(query, gender, category, priceRange, Math.ceil(limit * 0.6));
  results.push(...catalogResults.map(item => ({
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

  // 2. If we don't have enough results, supplement with curated popular toys
  if (results.length < limit && query.trim()) {
    const curatedResults = searchPopularToys(query, limit - results.length);
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
  }

  // 3. If still not enough and this is a specific search, add some trending items
  if (results.length < limit / 2) {
    const trendingToys = [
      { title: "LEGO Creator 3-in-1 Deep Sea Creatures", brand: "LEGO", category: "building-blocks", price: 79.99, popularity: 95 },
      { title: "Barbie Dreamhouse Adventures Playset", brand: "Barbie", category: "dolls", price: 199.99, popularity: 92 },
      { title: "Hot Wheels Track Builder Unlimited", brand: "Hot Wheels", category: "vehicles", price: 49.99, popularity: 88 },
      { title: "Pokémon Trading Card Game Battle Academy", brand: "Pokémon", category: "games-puzzles", price: 19.99, popularity: 90 },
      { title: "Nintendo Switch Lite", brand: "Nintendo", category: "electronics", price: 199.99, popularity: 96 },
      { title: "National Geographic Crystal Growing Kit", brand: "National Geographic", category: "educational", price: 24.99, popularity: 85 },
    ].filter(toy => 
      !query.trim() || 
      toy.title.toLowerCase().includes(query.toLowerCase()) ||
      toy.brand.toLowerCase().includes(query.toLowerCase()) ||
      toy.category.includes(category || '')
    );

    results.push(...trendingToys.slice(0, Math.min(6, limit - results.length)).map((toy, index) => ({
      _id: `trending_${Date.now()}_${index}`,
      title: toy.title,
      brand: toy.brand,
      category: toy.category,
      gender: gender,
      price: toy.price,
      retailer: "multiple",
      productUrl: `https://www.google.com/search?q=${encodeURIComponent(toy.title)}`,
      imageUrl: undefined, // No placeholder image - let frontend handle fallback
      tags: [toy.category, toy.brand.toLowerCase()],
      popularity: toy.popularity,
      sourceType: "trending",
      isInCatalog: false
    })));
  }

  return {
    items: results.slice(0, limit),
    total: results.length,
    breakdown: {
      catalog: results.filter(r => r.sourceType === "master_catalog").length,
      curated: results.filter(r => r.sourceType === "curated").length,
      trending: results.filter(r => r.sourceType === "trending").length,
    }
  };
}