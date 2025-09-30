"use server";

import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Gift } from "@/models/Gift";
import { CatalogItem } from "@/models/CatalogItem";
import { Child } from "@/models/Child";
import { Parent } from "@/models/Parent";
import { auth } from "@/auth";

type DraftItem = {
  title: string;
  url: string;
  imageUrl?: string;
  price?: string | number;
  retailer?: string;
  brand?: string;
  model?: string;
  category?: string;
};

export async function submitProposal(childId: string, items: DraftItem[]) {
  await dbConnect();
  if (!Types.ObjectId.isValid(childId)) throw new Error("Invalid childId");
  if (!Array.isArray(items) || items.length === 0) throw new Error("No items");

  const docs = items.slice(0, 50).map((it) => ({
    childId: new Types.ObjectId(childId),
    title: String(it.title || it.url || "Gift"),
    ids: {
      retailer: it.retailer,
      productUrl: it.url,
      imageUrl: it.imageUrl,
      brand: it.brand,
      model: it.model,
      category: it.category,
    },
    notes: "",
  }));

  await Gift.insertMany(docs, { ordered: false });
  return { ok: true, count: docs.length };
}

/**
 * Add a catalog item to a child's gift list (handles both database and trending/curated items)
 */
export async function addCatalogItemToGiftList(
  childId: string,
  catalogItemId: string,
  itemData?: {
    title: string;
    brand?: string;
    category?: string;
    price?: number;
    retailer?: string;
    productUrl?: string;
    imageUrl?: string;
    popularity?: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  await dbConnect();

  // Validate child belongs to parent
  const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
  if (!parent) {
    throw new Error("Parent not found");
  }

  const child = await Child.findOne({ 
    _id: new Types.ObjectId(childId), 
    parentId: parent._id 
  });
  if (!child) {
    throw new Error("Child not found or not authorized");
  }

  let giftData: {
    title: string;
    retailer?: string;
    productUrl?: string;
    imageUrl?: string;
    brand?: string;
    model?: string;
    category?: string;
    sku?: string;
    asin?: string;
    upc?: string;
    ean?: string;
    price?: number;
    popularity?: number;
  };

  // Check if this is a trending/curated item (fake ID) or a real database item
  if (catalogItemId.startsWith('trending_') || catalogItemId.startsWith('curated_')) {
    if (!itemData) {
      throw new Error("Item data is required for trending/curated items");
    }
    giftData = {
      title: itemData.title,
      retailer: itemData.retailer,
      productUrl: itemData.productUrl,
      imageUrl: itemData.imageUrl,
      brand: itemData.brand,
      category: itemData.category,
      price: itemData.price,
      popularity: itemData.popularity,
    };
  } else {
    // This is a real database catalog item
    let catalogItem;
    try {
      catalogItem = await CatalogItem.findById(catalogItemId);
      if (!catalogItem) {
        throw new Error("Catalog item not found");
      }
    } catch (error) {
      // If it's not a valid ObjectId, treat it as external
      if (error && typeof error === 'object' && 'name' in error && error.name === 'CastError') {
        throw new Error("Invalid catalog item ID. Please refresh and try again.");
      }
      throw error;
    }

    giftData = {
      title: catalogItem.title,
      retailer: catalogItem.retailer,
      productUrl: catalogItem.productUrl,
      imageUrl: catalogItem.imageUrl,
      brand: catalogItem.brand,
      model: catalogItem.model,
      category: catalogItem.category,
      sku: catalogItem.sku,
      asin: catalogItem.asin,
      upc: catalogItem.upc,
      ean: catalogItem.ean,
      price: catalogItem.price,
    };
  }

  // Check if gift already exists for this child
  const existingGift = await Gift.findOne({
    childId: child._id,
    title: giftData.title,
    "ids.productUrl": giftData.productUrl
  });

  if (existingGift) {
    return {
      success: false,
      message: "This gift is already in the child's list",
      giftId: existingGift._id.toString()
    };
  }

  // Create new gift
  const newGift = await Gift.create({
    childId: child._id,
    title: giftData.title,
    ids: {
      retailer: giftData.retailer,
      productUrl: giftData.productUrl,
      imageUrl: giftData.imageUrl,
      brand: giftData.brand,
      model: giftData.model,
      category: giftData.category,
      sku: giftData.sku,
      asin: giftData.asin,
      upc: giftData.upc,
      ean: giftData.ean,
    },
    notes: `Price: $${giftData.price || 0}${giftData.popularity ? ` - ${giftData.popularity}% popular` : ''}`,
  });

  return {
    success: true,
    message: "Gift added to list successfully",
    giftId: newGift._id.toString()
  };
}

/**
 * Remove a gift from a child's list
 */
export async function removeGiftFromList(
  childId: string,
  giftId: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  await dbConnect();

  // Validate child belongs to parent
  const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
  if (!parent) {
    throw new Error("Parent not found");
  }

  const child = await Child.findOne({ 
    _id: new Types.ObjectId(childId), 
    parentId: parent._id 
  });
  if (!child) {
    throw new Error("Child not found or not authorized");
  }

  // Remove the gift
  const deletedGift = await Gift.findOneAndDelete({
    _id: new Types.ObjectId(giftId),
    childId: child._id
  });

  if (!deletedGift) {
    throw new Error("Gift not found or already removed");
  }

  return {
    success: true,
    message: "Gift removed from list successfully"
  };
}

/**
 * Get gift images from Gift collection for catalog items
 */
export async function getGiftImages() {
  await dbConnect();
  
  // Get all gifts that have images
  const giftsWithImages = await Gift.find({
    'ids.imageUrl': { $exists: true, $nin: [null, ''] }
  }).select('title ids.imageUrl ids.productUrl').lean();
  
  // Create a map of title -> imageUrl for quick lookup
  const imageMap = new Map<string, string>();
  
  giftsWithImages.forEach(gift => {
    if (gift.ids?.imageUrl) {
      // Map by title (case-insensitive)
      const normalizedTitle = gift.title.toLowerCase().trim();
      imageMap.set(normalizedTitle, gift.ids.imageUrl);
      
      // Also map by product URL if available
      if (gift.ids.productUrl) {
        imageMap.set(gift.ids.productUrl, gift.ids.imageUrl);
      }
    }
  });
  
  return Object.fromEntries(imageMap);
}

/**
 * Get a child's current gift list
 */
export async function getChildGiftList(childId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  await dbConnect();

  // Validate child belongs to parent
  const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
  if (!parent) {
    throw new Error("Parent not found");
  }

  const child = await Child.findOne({ 
    _id: new Types.ObjectId(childId), 
    parentId: parent._id 
  });
  if (!child) {
    throw new Error("Child not found or not authorized");
  }

  const gifts = await Gift.find({ childId: child._id })
    .sort({ createdAt: -1 })
    .lean();

  return {
    success: true,
    gifts: gifts.map(gift => ({
      _id: gift._id.toString(),
      title: gift.title,
      ids: gift.ids,
      imageUrl: gift.ids?.imageUrl, // Include imageUrl for frontend
      notes: gift.notes,
      createdAt: gift.createdAt
    }))
  };
}
