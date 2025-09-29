import mongoose, { Schema, Model, HydratedDocument } from "mongoose";

export type CatalogGender = "boy" | "girl" | "neutral";

export interface CatalogItem {
  title: string;                 // human title
  gender: CatalogGender;         // bucket
  ageMin?: number;               // optional age hints
  ageMax?: number;
  price?: number;                // USD
  retailer?: string;             // "target" | "walmart" | "amazon" | etc.
  productUrl?: string;           // for parent review / purchase
  imageUrl?: string;
  brand?: string;
  model?: string;
  category?: string;
  tags?: string[];               // freeform tags to power search
  sku?: string;
  asin?: string;
  upc?: string;
  ean?: string;
  createdAt: Date;
  updatedAt: Date;
}

type Q = Record<string, never>;
type NoMethods = Record<string, never>;
type NoVirtuals = Record<string, never>;

export type CatalogItemModel = Model<CatalogItem, Q, NoMethods, NoVirtuals>;
export type CatalogItemDoc = HydratedDocument<CatalogItem>;

const CatalogSchema = new Schema<CatalogItem, CatalogItemModel, NoMethods, Q, NoVirtuals>({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  gender: { type: String, enum: ["boy", "girl", "neutral"], required: true, index: true },
  ageMin: Number,
  ageMax: Number,
  price: Number,
  retailer: { type: String, trim: true, lowercase: true },
  productUrl: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  brand: String,
  model: String,
  category: String,
  tags: { type: [String], default: [] },
  sku: String,
  asin: String,
  upc: String,
  ean: String,
}, { timestamps: true });

CatalogSchema.index({ title: "text", brand: "text", model: "text", category: "text", tags: "text" });
CatalogSchema.index({ gender: 1, price: 1 });

export const CatalogItem: CatalogItemModel =
  (mongoose.models.CatalogItem as CatalogItemModel) ??
  mongoose.model<CatalogItem, CatalogItemModel>("CatalogItem", CatalogSchema);
