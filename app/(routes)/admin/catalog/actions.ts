"use server";

import { dbConnect } from "@/lib/db";
import { CatalogItem } from "@/models/CatalogItem";

export interface DraftRow {
  title: string;
  brand?: string;
  model?: string;
  category?: string;
  gender: string;
  price?: number;
  retailer?: string;
  productUrl?: string;
  imageUrl?: string;
  tags: string[];
}

// Simplified catalog generation using the toy data source
export async function generateCatalog(query: string, model = "gpt-4o-mini") {
  console.log(`[${model}] Generating catalog for: ${query}`);
  
  try {
    await dbConnect();
    
    // Use the toy data source instead of complex AI generation
    const { searchPopularToys } = await import("@/lib/toy-data-source");
    const toys = searchPopularToys(query, 50);
    
    if (toys.length === 0) {
      return {
        success: false,
        message: "No toys found for this query",
        runs: [],
        rows: [],
        created: 0,
      };
    }

    // Convert to draft rows
    const rows: DraftRow[] = toys.map(toy => ({
      title: toy.title,
      brand: toy.brand,
      category: toy.category,
      gender: toy.gender,
      price: toy.priceRange.min,
      retailer: "Multiple",
      productUrl: "",
      imageUrl: "",
      tags: toy.keywords || [],
    }));

    // Save to database
    let created = 0;
    for (const row of rows) {
      try {
        const existing = await CatalogItem.findOne({
          title: { $regex: new RegExp(row.title.slice(0, 20), "i") },
          brand: row.brand,
        });

        if (!existing) {
          await CatalogItem.create({
            title: row.title,
            brand: row.brand,
            category: row.category,
            gender: row.gender,
            price: row.price,
            retailer: row.retailer,
            productUrl: row.productUrl,
            imageUrl: row.imageUrl,
            tags: row.tags,
          });
          created++;
        }
      } catch (error) {
        console.error("Error saving catalog item:", error);
      }
    }

    return {
      success: true,
      message: `Generated ${created} new catalog items from ${rows.length} toys`,
      runs: [{ q: query, phase: "simplified" }],
      rows: rows,
      created: created,
    };

  } catch (error) {
    console.error("Catalog generation error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      runs: [],
      rows: [],
      created: 0,
    };
  }
}

export async function searchCatalog(query: string) {
  try {
    await dbConnect();
    
    const items = await CatalogItem.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
      ]
    })
    .limit(50)
    .lean();

    return items;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

export async function saveReviewed(gender: string, rows: DraftRow[]) {
  try {
    await dbConnect();
    
    let count = 0;
    for (const row of rows) {
      try {
        const existing = await CatalogItem.findOne({
          title: { $regex: new RegExp(row.title.slice(0, 20), "i") },
          brand: row.brand,
        });

        if (!existing) {
          await CatalogItem.create({
            title: row.title,
            brand: row.brand,
            category: row.category,
            gender: row.gender,
            price: row.price,
            retailer: row.retailer,
            productUrl: row.productUrl,
            imageUrl: row.imageUrl,
            tags: row.tags,
          });
          count++;
        }
      } catch (error) {
        console.error("Error saving catalog item:", error);
      }
    }

    return { ok: true, count };
  } catch (error) {
    console.error("Save error:", error);
    return { ok: false, count: 0 };
  }
}