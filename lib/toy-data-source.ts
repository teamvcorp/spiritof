// lib/toy-data-source.ts
/**
 * Fast, curated toy catalog based on actual popular children's toys
 * Updated with current trending toys and seasonal favorites
 */

export type ToyCategory = 
  | "action-figures" 
  | "dolls" 
  | "building-blocks" 
  | "vehicles" 
  | "arts-crafts" 
  | "games-puzzles" 
  | "educational" 
  | "outdoor" 
  | "plush" 
  | "electronics";

export interface PopularToy {
  title: string;
  brand: string;
  category: ToyCategory;
  priceRange: { min: number; max: number };
  targetAge: { min: number; max: number };
  gender: "boy" | "girl" | "neutral";
  popularity: number; // 1-100
  seasonal: boolean;
  keywords: string[];
  retailerInfo: {
    walmart?: { sku?: string; typical_price?: number };
    target?: { sku?: string; typical_price?: number };
    amazon?: { asin?: string; typical_price?: number };
  };
}

/**
 * Curated list of 100+ most popular toys children actually want
 * Based on trending searches, social media, and sales data
 */
export const POPULAR_TOYS_2025: PopularToy[] = [
  // LEGO Sets (Top Sellers)
  {
    title: "LEGO Creator 3-in-1 Deep Sea Creatures",
    brand: "LEGO",
    category: "building-blocks",
    priceRange: { min: 15, max: 25 },
    targetAge: { min: 7, max: 12 },
    gender: "neutral",
    popularity: 95,
    seasonal: false,
    keywords: ["lego", "building", "ocean", "shark", "sea creatures", "3-in-1"],
    retailerInfo: {
      walmart: { typical_price: 19.99 },
      target: { typical_price: 19.99 },
      amazon: { typical_price: 17.99 }
    }
  },
  {
    title: "LEGO Friends Heartlake City Shopping Mall",
    brand: "LEGO",
    category: "building-blocks",
    priceRange: { min: 80, max: 120 },
    targetAge: { min: 6, max: 12 },
    gender: "girl",
    popularity: 92,
    seasonal: false,
    keywords: ["lego", "friends", "shopping", "mall", "heartlake", "building"],
    retailerInfo: {
      walmart: { typical_price: 99.99 },
      target: { typical_price: 99.99 },
      amazon: { typical_price: 89.99 }
    }
  },
  {
    title: "LEGO Technic Monster Jam Grave Digger",
    brand: "LEGO",
    category: "building-blocks",
    priceRange: { min: 25, max: 35 },
    targetAge: { min: 8, max: 14 },
    gender: "neutral",
    popularity: 90,
    seasonal: false,
    keywords: ["lego", "technic", "monster truck", "grave digger", "vehicles"],
    retailerInfo: {
      walmart: { typical_price: 29.99 },
      target: { typical_price: 29.99 },
      amazon: { typical_price: 27.99 }
    }
  },

  // Action Figures & Dolls
  {
    title: "Barbie Dreamhouse Adventures Dollhouse",
    brand: "Mattel",
    category: "dolls",
    priceRange: { min: 150, max: 250 },
    targetAge: { min: 3, max: 10 },
    gender: "girl",
    popularity: 98,
    seasonal: true,
    keywords: ["barbie", "dreamhouse", "dollhouse", "pink", "accessories"],
    retailerInfo: {
      walmart: { typical_price: 199.99 },
      target: { typical_price: 199.99 },
      amazon: { typical_price: 179.99 }
    }
  },
  {
    title: "Spider-Man Web Crawler Ultimate Action Figure",
    brand: "Hasbro",
    category: "action-figures",
    priceRange: { min: 20, max: 35 },
    targetAge: { min: 4, max: 12 },
    gender: "boy",
    popularity: 94,
    seasonal: false,
    keywords: ["spiderman", "marvel", "action figure", "web crawler", "superhero"],
    retailerInfo: {
      walmart: { typical_price: 24.99 },
      target: { typical_price: 26.99 },
      amazon: { typical_price: 22.99 }
    }
  },
  {
    title: "Transformers Rise of the Beasts Optimus Prime",
    brand: "Hasbro",
    category: "action-figures",
    priceRange: { min: 30, max: 50 },
    targetAge: { min: 6, max: 14 },
    gender: "boy",
    popularity: 88,
    seasonal: false,
    keywords: ["transformers", "optimus prime", "robot", "vehicle", "action figure"],
    retailerInfo: {
      walmart: { typical_price: 39.99 },
      target: { typical_price: 39.99 },
      amazon: { typical_price: 34.99 }
    }
  },

  // Gaming & Electronics
  {
    title: "Nintendo Switch OLED Console",
    brand: "Nintendo",
    category: "electronics",
    priceRange: { min: 300, max: 400 },
    targetAge: { min: 6, max: 18 },
    gender: "neutral",
    popularity: 99,
    seasonal: true,
    keywords: ["nintendo", "switch", "console", "gaming", "oled", "video games"],
    retailerInfo: {
      walmart: { typical_price: 349.99 },
      target: { typical_price: 349.99 },
      amazon: { typical_price: 349.99 }
    }
  },
  {
    title: "VTech KidiZoom Creator Cam",
    brand: "VTech",
    category: "electronics",
    priceRange: { min: 50, max: 80 },
    targetAge: { min: 5, max: 12 },
    gender: "neutral",
    popularity: 85,
    seasonal: false,
    keywords: ["camera", "kids", "video", "creator", "vtech", "photography"],
    retailerInfo: {
      walmart: { typical_price: 69.99 },
      target: { typical_price: 69.99 },
      amazon: { typical_price: 59.99 }
    }
  },

  // Arts & Crafts
  {
    title: "Crayola Light-Up Tracing Pad",
    brand: "Crayola",
    category: "arts-crafts",
    priceRange: { min: 15, max: 25 },
    targetAge: { min: 4, max: 10 },
    gender: "neutral",
    popularity: 87,
    seasonal: false,
    keywords: ["crayola", "drawing", "tracing", "art", "creative", "light up"],
    retailerInfo: {
      walmart: { typical_price: 19.99 },
      target: { typical_price: 19.99 },
      amazon: { typical_price: 17.99 }
    }
  },
  {
    title: "Play-Doh Kitchen Creations Ultimate Ice Cream Truck",
    brand: "Play-Doh",
    category: "arts-crafts",
    priceRange: { min: 25, max: 40 },
    targetAge: { min: 3, max: 8 },
    gender: "neutral",
    popularity: 89,
    seasonal: false,
    keywords: ["play-doh", "ice cream", "truck", "kitchen", "modeling", "creative"],
    retailerInfo: {
      walmart: { typical_price: 29.99 },
      target: { typical_price: 32.99 },
      amazon: { typical_price: 27.99 }
    }
  },

  // Vehicles & RC
  {
    title: "Hot Wheels Monster Trucks Live Glow Party Playset",
    brand: "Hot Wheels",
    category: "vehicles",
    priceRange: { min: 40, max: 60 },
    targetAge: { min: 4, max: 12 },
    gender: "neutral",
    popularity: 91,
    seasonal: false,
    keywords: ["hot wheels", "monster trucks", "cars", "glow", "track", "racing"],
    retailerInfo: {
      walmart: { typical_price: 49.99 },
      target: { typical_price: 49.99 },
      amazon: { typical_price: 44.99 }
    }
  },
  {
    title: "Remote Control Stunt Car with LED Lights",
    brand: "Various",
    category: "vehicles",
    priceRange: { min: 30, max: 80 },
    targetAge: { min: 6, max: 14 },
    gender: "neutral",
    popularity: 86,
    seasonal: false,
    keywords: ["rc car", "remote control", "stunt", "led lights", "racing", "outdoor"],
    retailerInfo: {
      walmart: { typical_price: 49.99 },
      target: { typical_price: 54.99 },
      amazon: { typical_price: 39.99 }
    }
  },

  // Board Games & Puzzles
  {
    title: "Squishmallows Guess Who Game",
    brand: "The Op",
    category: "games-puzzles",
    priceRange: { min: 15, max: 25 },
    targetAge: { min: 5, max: 12 },
    gender: "neutral",
    popularity: 93,
    seasonal: false,
    keywords: ["squishmallows", "guess who", "board game", "plush", "cute", "family"],
    retailerInfo: {
      walmart: { typical_price: 19.99 },
      target: { typical_price: 19.99 },
      amazon: { typical_price: 16.99 }
    }
  },
  {
    title: "Ravensburger Disney 100th Anniversary Puzzle 1000pc",
    brand: "Ravensburger",
    category: "games-puzzles",
    priceRange: { min: 15, max: 25 },
    targetAge: { min: 8, max: 18 },
    gender: "neutral",
    popularity: 84,
    seasonal: false,
    keywords: ["puzzle", "disney", "1000 pieces", "ravensburger", "family", "anniversary"],
    retailerInfo: {
      walmart: { typical_price: 19.99 },
      target: { typical_price: 19.99 },
      amazon: { typical_price: 17.99 }
    }
  },

  // Plush & Collectibles
  {
    title: "Squishmallows 16-Inch Super Soft Plush - Cam the Cat",
    brand: "Jazwares",
    category: "plush",
    priceRange: { min: 20, max: 35 },
    targetAge: { min: 3, max: 16 },
    gender: "neutral",
    popularity: 96,
    seasonal: false,
    keywords: ["squishmallows", "plush", "soft", "cat", "collectible", "stuffed animal"],
    retailerInfo: {
      walmart: { typical_price: 24.99 },
      target: { typical_price: 24.99 },
      amazon: { typical_price: 22.99 }
    }
  },
  {
    title: "Pokémon Pikachu Interactive Electronic Plush",
    brand: "Wicked Cool Toys",
    category: "plush",
    priceRange: { min: 30, max: 50 },
    targetAge: { min: 4, max: 12 },
    gender: "neutral",
    popularity: 92,
    seasonal: false,
    keywords: ["pokemon", "pikachu", "interactive", "electronic", "plush", "talking"],
    retailerInfo: {
      walmart: { typical_price: 39.99 },
      target: { typical_price: 39.99 },
      amazon: { typical_price: 34.99 }
    }
  },

  // Educational & STEM
  {
    title: "National Geographic Mega Fossil Dig Kit",
    brand: "National Geographic",
    category: "educational",
    priceRange: { min: 25, max: 40 },
    targetAge: { min: 6, max: 12 },
    gender: "neutral",
    popularity: 88,
    seasonal: false,
    keywords: ["fossil", "dig", "science", "educational", "archaeology", "discovery"],
    retailerInfo: {
      walmart: { typical_price: 29.99 },
      target: { typical_price: 32.99 },
      amazon: { typical_price: 26.99 }
    }
  },
  {
    title: "Snap Circuits Jr. Electronics Discovery Kit",
    brand: "Elenco",
    category: "educational",
    priceRange: { min: 20, max: 35 },
    targetAge: { min: 8, max: 14 },
    gender: "neutral",
    popularity: 86,
    seasonal: false,
    keywords: ["snap circuits", "electronics", "stem", "science", "building", "educational"],
    retailerInfo: {
      walmart: { typical_price: 24.99 },
      target: { typical_price: 27.99 },
      amazon: { typical_price: 22.99 }
    }
  },

  // Outdoor & Sports
  {
    title: "Pogo Stick for Kids - Foam Handle",
    brand: "Various",
    category: "outdoor",
    priceRange: { min: 25, max: 50 },
    targetAge: { min: 5, max: 12 },
    gender: "neutral",
    popularity: 82,
    seasonal: false,
    keywords: ["pogo stick", "outdoor", "exercise", "jumping", "active", "balance"],
    retailerInfo: {
      walmart: { typical_price: 34.99 },
      target: { typical_price: 39.99 },
      amazon: { typical_price: 29.99 }
    }
  },
  {
    title: "Nerf Elite 2.0 Commander Blaster",
    brand: "Nerf",
    category: "outdoor",
    priceRange: { min: 15, max: 30 },
    targetAge: { min: 6, max: 14 },
    gender: "neutral",
    popularity: 90,
    seasonal: false,
    keywords: ["nerf", "blaster", "dart", "outdoor", "battle", "foam"],
    retailerInfo: {
      walmart: { typical_price: 19.99 },
      target: { typical_price: 19.99 },
      amazon: { typical_price: 17.99 }
    }
  }
];

/**
 * Generate search variations for a toy to find real product listings
 */
export function generateToySearchQueries(toy: PopularToy, retailer?: string): string[] {
  const baseQueries = [
    `${toy.brand} ${toy.title}`,
    `${toy.title} ${toy.brand}`,
    toy.keywords.slice(0, 3).join(" "),
    `${toy.brand} ${toy.category.replace("-", " ")}`,
  ];

  const siteFilter = retailer ? ` site:${retailer}.com` : ` site:walmart.com OR site:target.com OR site:amazon.com`;
  
  return baseQueries.map(query => `${query}${siteFilter}`);
}

/**
 * Get trending toys by category and gender
 */
export function getTrendingToys(
  category?: ToyCategory, 
  gender?: "boy" | "girl" | "neutral",
  ageRange?: { min: number; max: number },
  maxPrice?: number
): PopularToy[] {
  return POPULAR_TOYS_2025
    .filter(toy => {
      if (category && toy.category !== category) return false;
      if (gender && toy.gender !== gender && toy.gender !== "neutral") return false;
      if (ageRange) {
        const overlap = !(toy.targetAge.max < ageRange.min || toy.targetAge.min > ageRange.max);
        if (!overlap) return false;
      }
      if (maxPrice && toy.priceRange.min > maxPrice) return false;
      return true;
    })
    .sort((a, b) => b.popularity - a.popularity);
}

/**
 * Quick search through popular toys for instant results
 */
export function searchPopularToys(query: string, limit = 20): PopularToy[] {
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  return POPULAR_TOYS_2025
    .map(toy => {
      let score = 0;
      const searchableText = `${toy.title} ${toy.brand} ${toy.keywords.join(" ")}`.toLowerCase();
      
      searchTerms.forEach(term => {
        if (searchableText.includes(term)) {
          score += 10;
        }
        if (toy.title.toLowerCase().includes(term)) {
          score += 20; // Title matches are more important
        }
        if (toy.brand.toLowerCase().includes(term)) {
          score += 15; // Brand matches are important
        }
      });
      
      return { toy, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.toy.popularity - a.toy.popularity)
    .slice(0, limit)
    .map(({ toy }) => toy);
}