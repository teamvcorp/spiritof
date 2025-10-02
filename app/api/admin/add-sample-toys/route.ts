import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { findOrCreateCatalogItem } from '@/lib/catalog-service';

// Popular toys with real images from major retailers
const SAMPLE_TOYS_WITH_IMAGES = [
  {
    title: "LEGO Classic Creative Bricks 11005",
    brand: "LEGO",
    category: "building-blocks",
    gender: "neutral" as const,
    price: 44.99,
    retailer: "target",
    productUrl: "https://www.target.com/p/lego-classic-creative-bricks-11005/-/A-76151797",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    tags: ["building", "creativity", "LEGO"],
    popularity: 95,
    sourceType: "manual" as const
  },
  {
    title: "Barbie Dreamtopia Rainbow Cove Princess Castle",
    brand: "Barbie",
    category: "dolls",
    gender: "girl" as const,
    price: 49.99,
    retailer: "walmart",
    productUrl: "https://www.walmart.com/ip/Barbie-Dreamtopia-Rainbow-Cove-Princess-Castle/123456789",
    imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop",
    tags: ["dolls", "princess", "castle"],
    popularity: 92,
    sourceType: "manual" as const
  },
  {
    title: "Hot Wheels Monster Trucks Pit & Launch Playset",
    brand: "Hot Wheels",
    category: "vehicles",
    gender: "boy" as const,
    price: 29.99,
    retailer: "amazon",
    productUrl: "https://www.amazon.com/dp/B08X123456",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=400&fit=crop",
    tags: ["cars", "trucks", "racing"],
    popularity: 88,
    sourceType: "manual" as const
  },
  {
    title: "National Geographic Break Open 10 Premium Geodes Kit",
    brand: "National Geographic",
    category: "educational",
    gender: "neutral" as const,
    price: 29.99,
    retailer: "target",
    productUrl: "https://www.target.com/p/national-geographic-break-open-10-premium-geodes-kit/-/A-54321098",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    tags: ["science", "geology", "educational"],
    popularity: 85,
    sourceType: "manual" as const
  },
  {
    title: "Pokémon Trading Card Game Battle Academy",
    brand: "Pokémon",
    category: "games-puzzles",
    gender: "neutral" as const,
    price: 19.99,
    retailer: "gamestop",
    productUrl: "https://www.gamestop.com/toys-games/trading-cards/pokemon-trading-card-game-battle-academy/123456.html",
    imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop",
    tags: ["cards", "pokemon", "strategy"],
    popularity: 90,
    sourceType: "manual" as const
  },
  {
    title: "Melissa & Doug Wooden Building Blocks Set",
    brand: "Melissa & Doug",
    category: "building-blocks",
    gender: "neutral" as const,
    price: 24.99,
    retailer: "target",
    productUrl: "https://www.target.com/p/melissa-doug-wooden-building-blocks/-/A-13579246",
    imageUrl: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=400&fit=crop",
    tags: ["wooden", "blocks", "classic"],
    popularity: 87,
    sourceType: "manual" as const
  },
  {
    title: "Crayola Light-up Tracing Pad",
    brand: "Crayola",
    category: "arts-crafts",
    gender: "neutral" as const,
    price: 19.99,
    retailer: "walmart",
    productUrl: "https://www.walmart.com/ip/crayola-light-up-tracing-pad/987654321",
    imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop",
    tags: ["art", "drawing", "creative"],
    popularity: 83,
    sourceType: "manual" as const
  },
  {
    title: "Play-Doh Kitchen Creations Ultimate Ice Cream Truck",
    brand: "Play-Doh",
    category: "arts-crafts",
    gender: "neutral" as const,
    price: 34.99,
    retailer: "amazon",
    productUrl: "https://www.amazon.com/dp/B09ABC123XYZ",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
    tags: ["play-doh", "creativity", "kitchen"],
    popularity: 89,
    sourceType: "manual" as const
  }
];

export async function POST() {
  try {
    await dbConnect();
    
    const results = [];
    
    for (const toy of SAMPLE_TOYS_WITH_IMAGES) {
      const result = await findOrCreateCatalogItem(toy);
      results.push({
        title: toy.title,
        success: result.success,
        isNew: result.isNew,
        error: result.error
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Sample toys with images added to catalog",
      results
    });
    
  } catch (error) {
    console.error('Error adding sample toys:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}