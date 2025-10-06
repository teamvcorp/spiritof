import { Schema, model, models, Types, type Model, type HydratedDocument } from "mongoose";
import type { IChild, ChildMethods } from "@/types/childType";

const NeighborLedgerEntrySchema = new Schema(
  {
    type: { type: String, enum: ["DONATION", "REFUND", "ADJUSTMENT"], required: true },
    amountCents: { type: Number, required: true },
    currency: { type: String, enum: ["usd"], default: "usd" },
    status: { type: String, enum: ["PENDING", "SUCCEEDED", "FAILED"], default: "PENDING" },

    stripePaymentIntentId: { type: String },
    stripeCheckoutSessionId: { type: String },

    fromName: { type: String },
    fromEmail: { type: String, lowercase: true },
    message: { type: String, maxlength: 500 },
  },
  { _id: true, timestamps: true }
);

export type ChildDoc = HydratedDocument<IChild> & ChildMethods;
export type ChildModel = Model<IChild, object, ChildMethods>;

const ChildSchema = new Schema<IChild>(
  {
    parentId: { type: Types.ObjectId, ref: "Parent", required: true, index: true },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String },

    percentAllocation: { type: Number, required: true, min: 0, max: 100, default: 0 },
    score365: { type: Number, required: true, min: 0, max: 365, default: 0 },

    donationsEnabled: { type: Boolean, default: true },
    shareSlug: { type: String, required: true, unique: true, index: true },

    neighborBalanceCents: { type: Number, required: true, default: 0 },
    neighborLedger: { type: [NeighborLedgerEntrySchema], default: [] },
    donorTotals: {
      count: { type: Number, default: 0, min: 0 },
      totalCents: { type: Number, default: 0, min: 0 },
    },

    // NEW: Gift list as references to master catalog
    giftList: { 
      type: [{ type: Schema.Types.ObjectId, ref: "MasterCatalog" }],
      default: [],
      index: true
    },
    
    // Gift list locking (when finalized)
    giftListLocked: { type: Boolean, default: false },
    giftListLockedAt: { type: Date },

    // Early gift requests
    earlyGiftRequests: [{
      giftId: { type: Types.ObjectId, ref: "CatalogItem" },
      giftTitle: { type: String },
      giftPrice: { type: Number },
      giftImageUrl: { type: String },
      reason: { type: String, maxlength: 500 },
      requestedPoints: { type: Number },
      requestedAt: { type: Date, default: Date.now },
      status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
      parentResponse: { type: String, maxlength: 300 },
      respondedAt: { type: Date }
    }],

    // Friend gift requests
    friendGiftRequests: [{
      giftId: { type: Types.ObjectId, ref: "CatalogItem" },
      giftTitle: { type: String },
      giftPrice: { type: Number },
      giftImageUrl: { type: String },
      friendName: { type: String },
      friendAddress: { type: String },
      message: { type: String, maxlength: 200 },
      requestedPoints: { type: Number },
      requestedAt: { type: Date, default: Date.now },
      status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
      parentResponse: { type: String, maxlength: 300 },
      respondedAt: { type: Date }
    }],
  },
  { timestamps: true }
);

// Legacy virtual for backward compatibility (if needed)
ChildSchema.virtual("gifts", {
  ref: "Gift",
  localField: "_id",
  foreignField: "childId",
});

// NEW: Virtual for populated gift catalog items
ChildSchema.virtual("catalogGifts", {
  ref: "MasterCatalog",
  localField: "giftList",
  foreignField: "_id",
});
/** Tiny methods */
ChildSchema.methods.recomputeNeighborBalance = function (this: HydratedDocument<IChild>) {
  const total = (this.neighborLedger ?? []).reduce<number>(
    (sum, e) => sum + (e.status === "SUCCEEDED" ? e.amountCents : 0),
    0
  );
  this.neighborBalanceCents = total;
  return total;
};

ChildSchema.methods.addNeighborLedgerEntry = function (
  this: HydratedDocument<IChild>,
  entry: Omit<IChild["neighborLedger"][number], "_id" | "createdAt" | "updatedAt" | "currency" | "status">
) {
  const arr = this.neighborLedger as unknown as Types.DocumentArray<IChild["neighborLedger"][number]>;
  const subdoc = arr.create({ currency: "usd", status: "PENDING", ...entry });
  arr.push(subdoc);
  return subdoc;
};

export const Child =
  (models.Child as ChildModel) || model<IChild, ChildModel>("Child", ChildSchema);