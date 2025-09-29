// models/Gift.ts
import mongoose, { Schema, Model, HydratedDocument, Types } from "mongoose";
import type { GiftIdentifiers } from "@/types/gift";

export interface Gift {
  childId: Types.ObjectId;
  title: string;
  ids: GiftIdentifiers;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Define explicit “empty” helper types (instead of `{}`)
type Q = Record<string, never>;          // no query helpers
type NoMethods = Record<string, never>;  // no instance methods
type NoVirtuals = Record<string, never>; // no virtuals

export type GiftModel = Model<Gift, Q, NoMethods, NoVirtuals>;
export type GiftDoc = HydratedDocument<Gift, NoMethods, NoVirtuals>;

const IdentifiersSchema = new Schema<GiftIdentifiers>(
  {
    retailer: String,
    productUrl: String,
    imageUrl: String,
    sku: String,
    asin: String,
    upc: String,
    ean: String,
    brand: String,
    model: String,
    category: String,
    color: String,
    size: String,
  },
  { _id: false }
);

// ⬇️ The change is here: use `NoMethods` instead of `{}`, and include `NoVirtuals`
const GiftSchema = new Schema<Gift, GiftModel, NoMethods, Q, NoVirtuals>(
  {
    childId: { type: Schema.Types.ObjectId, ref: "Child", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    ids: { type: IdentifiersSchema, default: {} },
    notes: { type: String, default: "", maxlength: 1000 },
  },
  { timestamps: true }
);

GiftSchema.index({ "ids.sku": 1 });
GiftSchema.index({ "ids.asin": 1 });
GiftSchema.index({ "ids.upc": 1 });
GiftSchema.index({ "ids.ean": 1 });
GiftSchema.index({ title: "text", "ids.brand": "text", "ids.model": "text", "ids.category": "text" });

export const Gift: GiftModel =
  (mongoose.models.Gift as GiftModel) ??
  mongoose.model<Gift, GiftModel>("Gift", GiftSchema);
