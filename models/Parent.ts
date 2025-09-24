// /models/Parent.ts
import { Schema, model, models, Types, type Model, type HydratedDocument } from "mongoose";
import type { IParent, NewLedgerEntry } from "@/types/parentTypes";

const GiftSettingsSchema = new Schema(
    {
        minGifts: { type: Number, default: 1, min: 0, max: 999 },
        maxGifts: { type: Number, default: 5, min: 0, max: 999 },
        perGiftCapCents: { type: Number, default: 0, min: 0 }, // 0 = no cap
    },
    { _id: false }
);

const WalletLedgerEntrySchema = new Schema(
    {
        type: { type: String, enum: ["TOP_UP", "REFUND", "ADJUSTMENT"], required: true },
        amountCents: { type: Number, required: true }, // allow negative for debits
        currency: { type: String, enum: ["usd"], default: "usd" },

        stripePaymentIntentId: { type: String },
        stripeCheckoutSessionId: { type: String },

        status: { type: String, enum: ["PENDING", "SUCCEEDED", "FAILED"], default: "PENDING" },
    },
    { _id: true, timestamps: true }
);
export type ParentDoc = HydratedDocument<IParent>;
export type ParentModel = Model<IParent>;
const ParentSchema = new Schema<IParent>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, index: true },
        avatarUrl: { type: String },
        // in Parent schema fields
        userId: { type: Types.ObjectId, ref: "User", required: true, index: true },


        // budgets
        magicBudgetCents: { type: Number, required: true, default: 0, min: 0 },

        // wallet
        walletBalanceCents: { type: Number, required: true, default: 0 }, // keep in sync from ledger
        walletLedger: { type: [WalletLedgerEntrySchema], default: [] },

        // stripe
        stripeCustomerId: { type: String, index: true },
        stripeDefaultPaymentMethodId: { type: String },

        // relationships
        children: [{ type: Types.ObjectId, ref: "Child", index: true }],

        // settings
        giftSettings: { type: GiftSettingsSchema, default: () => ({}) },

        // Map<childId,"YYYY-MM-DD"> for daily vote lockout
        voteLedger: { type: Map, of: String, default: () => new Map() },
    },
    { timestamps: true }
);
// Instance: recompute balance from ledger
ParentSchema.methods.recomputeWalletBalance = function (
    this: HydratedDocument<IParent>
): number {
    const total = (this.walletLedger ?? []).reduce<number>(
        (sum, e: IParent["walletLedger"][number]) =>
            sum + (e.status === "SUCCEEDED" ? e.amountCents : 0),
        0
    );
    this.walletBalanceCents = total;
    return total;
};

// Instance: append a ledger entry (does not call Stripe)
ParentSchema.methods.addLedgerEntry = function (
    this: HydratedDocument<IParent>,
    entry: NewLedgerEntry
): IParent["walletLedger"][number] {
    // Tell TS that walletLedger is a DocumentArray of the subdoc type
    const docArray = this.walletLedger as unknown as Types.DocumentArray<
        IParent["walletLedger"][number]
    >;

    // Create a real subdocument instance with defaults
    const subdoc = docArray.create({
        currency: "usd",
        status: "PENDING",
        ...entry,
    });

    docArray.push(subdoc);
    return subdoc;
};

// Static: safe compute of child allocation
ParentSchema.statics.computeChildAllocationCents = function (magicBudgetCents: number, percentAllocation: number) {
    const pct = Math.max(0, Math.min(100, percentAllocation ?? 0));
    return Math.round((magicBudgetCents * pct) / 100);
};

// Instance: vote helpers
ParentSchema.methods.canVoteToday = function (childId: string, todayISO: string) {
    const last = this.voteLedger?.get(String(childId));
    return !last || last !== todayISO;
};
ParentSchema.methods.recordVote = function (childId: string, todayISO: string) {
    this.voteLedger.set(String(childId), todayISO);
};


export const Parent = models.Parent as ParentModel || model<IParent, ParentModel>("Parent", ParentSchema);
