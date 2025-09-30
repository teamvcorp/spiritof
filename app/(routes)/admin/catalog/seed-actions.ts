"use server";

import { generateFastCatalog, saveFastCatalog } from "@/app/(routes)/admin/catalog/fast-actions";

export async function seedCatalogWithPopularToys() {
  console.log("🌱 Seeding catalog with popular toys...");
  
  try {
    // Generate for all genders
    const genders: ("boy" | "girl" | "neutral")[] = ["boy", "girl", "neutral"];
    let totalSeeded = 0;
    
    for (const gender of genders) {
      console.log(`Generating ${gender} toys...`);
      
      const result = await generateFastCatalog(gender, undefined, 500);
      console.log(`Generated ${result.rows.length} ${gender} toys`);
      
      const saveResult = await saveFastCatalog(gender, result.rows, true);
      if (saveResult.ok) {
        console.log(`✅ Saved ${saveResult.count} ${gender} toys to database`);
        totalSeeded += saveResult.count;
      } else {
        console.error(`❌ Failed to save ${gender} toys:`, saveResult.error);
      }
    }
    
    return {
      success: true,
      message: `Successfully seeded ${totalSeeded} toys across all categories`,
      totalSeeded,
    };
    
  } catch (error) {
    console.error("Seeding failed:", error);
    return {
      success: false,
      message: `Seeding failed: ${error}`,
      totalSeeded: 0,
    };
  }
}