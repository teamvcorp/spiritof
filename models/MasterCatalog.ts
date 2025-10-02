import mongoose, { Schema, Model, HydratedDocument } from "mongoose";

export type CatalogGender = "boy" | "girl" | "neutral";

export interface MasterCatalogItem {
  _id?: mongoose.Types.ObjectId;
  title: string;
  brand?: string;
  category?: string;
  gender: CatalogGender;
  ageMin?: number;
  ageMax?: number;
  price?: number;
  retailer?: string;
  productUrl: string; // Required - unique identifier
  
  // Vercel Blob storage for image
  imageUrl?: string; // Original source image URL
  blobUrl?: string;  // Vercel Blob URL for stored image
  imageStoredAt?: Date; // When image was uploaded to blob
  
  // Product identifiers
  sku?: string;
  asin?: string;
  upc?: string;
  ean?: string;
  model?: string;
  
  // Search and categorization
  tags?: string[];
  popularity?: number;
  searchTerms?: string[]; // Terms that led to this item being found
  
  // Metadata
  sourceType: "live_search" | "manual" | "curated" | "trending";
  isActive: boolean; // Can be set to false to hide items
  lastValidatedAt?: Date; // Last time product URL was validated
  
  createdAt: Date;
  updatedAt: Date;
}

type Q = Record<string, never>;
type NoMethods = Record<string, never>;
type NoVirtuals = Record<string, never>;

export type MasterCatalogModel = Model<MasterCatalogItem, Q, NoMethods, NoVirtuals>;
export type MasterCatalogDoc = HydratedDocument<MasterCatalogItem>;

const MasterCatalogSchema = new Schema<MasterCatalogItem, MasterCatalogModel, NoMethods, Q, NoVirtuals>({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  brand: { type: String, trim: true },
  category: { type: String, trim: true },
  gender: { type: String, enum: ["boy", "girl", "neutral"], required: true, index: true },
  ageMin: Number,
  ageMax: Number,
  price: { type: Number, min: 0 },
  retailer: { type: String, trim: true, lowercase: true },
  productUrl: { type: String, required: true, unique: true, trim: true }, // Unique constraint
  
  // Image storage
  imageUrl: { type: String, trim: true }, // Original source
  blobUrl: { type: String, trim: true },   // Vercel blob stored image
  imageStoredAt: Date,
  
  // Product identifiers
  sku: { type: String, trim: true },
  asin: { type: String, trim: true },
  upc: { type: String, trim: true },
  ean: { type: String, trim: true },
  model: { type: String, trim: true },
  
  // Search and metadata
  tags: { type: [String], default: [] },
  popularity: { type: Number, min: 0, max: 100 },
  searchTerms: { type: [String], default: [] },
  
  sourceType: { 
    type: String, 
    enum: ["live_search", "manual", "curated", "trending"], 
    default: "live_search" 
  },
  isActive: { type: Boolean, default: true, index: true },
  lastValidatedAt: Date,
}, { timestamps: true });

// Indexes for efficient searching
MasterCatalogSchema.index({ title: "text", brand: "text", tags: "text" });
MasterCatalogSchema.index({ gender: 1, category: 1 });
MasterCatalogSchema.index({ price: 1 });
MasterCatalogSchema.index({ retailer: 1 });
MasterCatalogSchema.index({ isActive: 1, createdAt: -1 });
MasterCatalogSchema.index({ productUrl: 1 }); // For deduplication

export const MasterCatalog: MasterCatalogModel =
  (mongoose.models.MasterCatalog as MasterCatalogModel) ??
  mongoose.model<MasterCatalogItem, MasterCatalogModel>("MasterCatalog", MasterCatalogSchema);