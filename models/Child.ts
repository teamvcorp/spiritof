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
  },
  { timestamps: true }
);
ChildSchema.virtual("gifts", {
  ref: "Gift",
  localField: "_id",
  foreignField: "childId",
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