import { dbConnect } from "@/lib/db";
import { MasterCatalog, type MasterCatalogItem } from "@/models/MasterCatalog";
import { uploadImageToBlob } from "@/lib/image-service";

/**
 * Check if an image URL is external (not a local placeholder)
 */
function isExternalImageUrl(imageUrl: string): boolean {
  // Skip local placeholder images
  if (imageUrl.startsWith('/images/')) {
    return false;
  }
  
  // Check if it's a valid external URL
  try {
    const url = new URL(imageUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Find or create a catalog item, ensuring no duplicates based on productUrl
 */
export async function findOrCreateCatalogItem(
  productData: {
    title: string;
    productUrl: string;
    brand?: string;
    category?: string;
    gender?: "boy" | "girl" | "neutral";
    price?: number;
    retailer?: string;
    imageUrl?: string;
    sku?: string;
    asin?: string;
    upc?: string;
    ean?: string;
    model?: string;
    tags?: string[];
    popularity?: number;
    searchTerms?: string[];
    sourceType?: "live_search" | "manual" | "curated" | "trending";
  }
): Promise<{ success: boolean; catalogItem?: MasterCatalogItem; isNew: boolean; error?: string }> {
  
  await dbConnect();

  try {
    // Check if item already exists by productUrl
    const existingItem = await MasterCatalog.findOne({ 
      productUrl: productData.productUrl 
    });

    if (existingItem) {
      // Update search terms if new ones provided
      if (productData.searchTerms && productData.searchTerms.length > 0) {
        const newTerms = productData.searchTerms.filter(
          term => !existingItem!.searchTerms?.includes(term)
        );
        if (newTerms.length > 0) {
          existingItem.searchTerms = [...(existingItem.searchTerms || []), ...newTerms];
          existingItem.lastValidatedAt = new Date();
          await existingItem.save();
        }
      }

      return {
        success: true,
        catalogItem: existingItem.toObject(),
        isNew: false
      };
    }

    // Create new catalog item
    const newCatalogData: Partial<MasterCatalogItem> = {
      title: productData.title,
      productUrl: productData.productUrl,
      brand: productData.brand,
      category: productData.category,
      gender: productData.gender || "neutral",
      price: productData.price,
      retailer: productData.retailer,
      imageUrl: productData.imageUrl,
      sku: productData.sku,
      asin: productData.asin,
      upc: productData.upc,
      ean: productData.ean,
      model: productData.model,
      tags: productData.tags || [],
      popularity: productData.popularity,
      searchTerms: productData.searchTerms || [],
      sourceType: productData.sourceType || "live_search",
      isActive: true,
      lastValidatedAt: new Date(),
    };

    // If image URL provided and it's a real external URL, try to upload to Vercel Blob
    if (productData.imageUrl && isExternalImageUrl(productData.imageUrl)) {
      const filename = `${productData.title}-${productData.retailer || 'unknown'}`;
      const uploadResult = await uploadImageToBlob(productData.imageUrl, filename);
      
      if (uploadResult.success && uploadResult.blobUrl) {
        newCatalogData.blobUrl = uploadResult.blobUrl;
        newCatalogData.imageStoredAt = new Date();
        console.log(`✅ Image uploaded to blob for: ${productData.title}`);
      } else {
        console.log(`⚠️ Failed to upload image for: ${productData.title} - ${uploadResult.error}`);
        // Keep original imageUrl as fallback
      }
    }

    const newItem = await MasterCatalog.create(newCatalogData);

    return {
      success: true,
      catalogItem: newItem.toObject(),
      isNew: true
    };

  } catch (error) {
    console.error('Error in findOrCreateCatalogItem:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      isNew: false
    };
  }
}

/**
 * Search the master catalog with improved filtering
 */
export async function searchMasterCatalog(
  query: string = "",
  gender: "boy" | "girl" | "neutral" = "neutral",
  category?: string,
  priceRange?: { min: number; max: number },
  limit: number = 24
): Promise<MasterCatalogItem[]> {
  
  await dbConnect();

  const searchFilter: Record<string, unknown> = {
    isActive: true
  };

  // Gender filter
  if (gender !== "neutral") {
    searchFilter.gender = { $in: [gender, "neutral"] };
  } else {
    searchFilter.gender = gender;
  }

  // Category filter
  if (category) {
    searchFilter.category = new RegExp(category, 'i');
  }

  // Price range filter
  if (priceRange) {
    searchFilter.price = {
      $gte: priceRange.min,
      $lte: priceRange.max
    };
  }

  let searchQuery;

  if (query.trim()) {
    // Text search with scoring
    searchFilter.$text = { $search: query };
    searchQuery = MasterCatalog.find(searchFilter, {
      score: { $meta: "textScore" }
    }).sort({ score: { $meta: "textScore" } });
  } else {
    // No text search, sort by recent and popular
    searchQuery = MasterCatalog.find(searchFilter)
      .sort({ popularity: -1, createdAt: -1 });
  }

  const results = await searchQuery
    .limit(limit)
    .lean<MasterCatalogItem[]>();

  return results;
}

/**
 * Get catalog item by ID with proper image URL
 */
export async function getCatalogItemById(catalogId: string): Promise<MasterCatalogItem | null> {
  await dbConnect();
  
  const item = await MasterCatalog.findById(catalogId).lean<MasterCatalogItem>();
  return item;
}

/**
 * Get the best image URL for a catalog item (blob first, then original)
 */
export function getBestImageUrl(item: MasterCatalogItem): string {
  if (item.blobUrl) {
    return item.blobUrl;
  }
  if (item.imageUrl) {
    return item.imageUrl;
  }
  return "/images/christmasMagic.png"; // Default fallback
}