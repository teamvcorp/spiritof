import mongoose, { Schema, Model, HydratedDocument } from "mongoose";

export type CatalogGender = "boy" | "girl" | "neutral";

export interface MasterCatalogItem {
  _id?: mongoose.Types.ObjectId;
  title: string;
  brand?: string;
  brandLogoUrl?: string; // NEW: Vercel Blob URL for brand logo
  brandLogoStoredAt?: Date; // NEW: When brand logo was uploaded
  category?: string;
  description?: string;
  gender: CatalogGender;
  ageMin?: number;
  ageMax?: number;
  price?: number;
  retailer?: string;
  productUrl: string;
  
  // Vercel Blob storage for product image
  imageUrl?: string;
  imageStoredAt?: Date;
  
  // Product identifiers
  sku?: string;
  asin?: string;
  upc?: string;
  ean?: string;
  model?: string;
  
  // Search and categorization
  tags?: string[];
  popularity?: number;
  searchTerms?: string[];
  
  // Metadata
  sourceType: "live_search" | "manual" | "curated" | "trending";
  isActive: boolean;
  lastValidatedAt?: Date;
  
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
  brandLogoUrl: { type: String, trim: true }, // NEW: Brand logo from Vercel Blob
  brandLogoStoredAt: Date, // NEW: Track upload time
  category: { type: String, trim: true },
  description: { type: String, trim: true, maxlength: 1000 },
  gender: { type: String, enum: ["boy", "girl", "neutral"], required: true, index: true },
  ageMin: Number,
  ageMax: Number,
  price: { type: Number, min: 0 },
  retailer: { type: String, trim: true, lowercase: true },
  productUrl: { type: String, required: true, unique: true, trim: true },
  
  // Image storage
  imageUrl: { type: String, trim: true },
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

export const MasterCatalog: MasterCatalogModel =
  (mongoose.models.MasterCatalog as MasterCatalogModel) ??
  mongoose.model<MasterCatalogItem, MasterCatalogModel>("MasterCatalog", MasterCatalogSchema);