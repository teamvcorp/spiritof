// /models/Parent.ts
import { Schema, model, models, Types, type Model, type HydratedDocument } from "mongoose";
import type { IParent, NewLedgerEntry, ParentMethods } from "@/types/parentTypes";

const GiftSettingsSchema = new Schema(
    {
        minGifts: { type: Number, default: 1, min: 0, max: 999 },
        maxGifts: { type: Number, default: 5, min: 0, max: 999 },
        perGiftCapCents: { type: Number, default: 0, min: 0 }, // 0 = no cap
    },
    { _id: false }
);

const ChristmasSettingsSchema = new Schema(
    {
        // Budget & Payment
        monthlyBudgetGoal: { type: Number, default: 200, min: 0 },
        autoContributeAmount: { type: Number, default: 50, min: 0 },
        enableAutoContribute: { type: Boolean, default: false },
        
        // Timeline Settings
        listLockDate: { type: String }, // YYYY-MM-DD format
        finalPaymentDate: { type: String },
        
        // Sharing & Gifts
        allowFriendGifts: { type: Boolean, default: true },
        maxFriendGiftValue: { type: Number, default: 25, min: 0 },
        allowEarlyGifts: { type: Boolean, default: false },
        
        // Shipping Address
        shippingAddress: {
            recipientName: { type: String },
            street: { type: String },
            apartment: { type: String },
            city: { type: String },
            state: { type: String },
            zipCode: { type: String },
            country: { type: String, default: "US" },
            isDefault: { type: Boolean, default: true },
        },
        
        // Payment Method
        hasPaymentMethod: { type: Boolean, default: false },
        paymentMethodLast4: { type: String },
        
        // Notifications
        reminderEmails: { type: Boolean, default: true },
        weeklyBudgetUpdates: { type: Boolean, default: true },
        listLockReminders: { type: Boolean, default: true },
        
        // Setup tracking
        setupCompleted: { type: Boolean, default: false },
        setupCompletedAt: { type: Date },
        
        // List Finalization
        listsFinalized: { type: Boolean, default: false },
        listsFinalizedAt: { type: Date },
        totalGiftCostCents: { type: Number, default: 0 },
        finalizedChildrenData: [{
            childId: { type: Types.ObjectId, ref: "Child" },
            childName: String,
            giftCount: Number,
            giftCostCents: Number,
            gifts: [{
                id: { type: Types.ObjectId, ref: "MasterCatalog" },
                name: String,
                price: Number
            }]
        }],
        
        // Logistics & Fulfillment
        shipmentApproved: { type: Boolean, default: false },
        shipmentApprovedAt: { type: Date },
        shipmentApprovedBy: { type: String }, // Admin user ID
        shipped: { type: Boolean, default: false },
        shippedAt: { type: Date },
        shippedBy: { type: String }, // Admin user ID
        trackingNumber: { type: String },
        carrier: { type: String },
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

const WelcomePacketOrderSchema = new Schema(
    {
        stripeSessionId: { type: String, required: true },
        selectedItems: [{ type: String }], // Array of item IDs
        totalAmount: { type: Number, required: true },
        status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
        shippingAddress: {
            recipientName: { type: String },
            street: { type: String },
            apartment: { type: String },
            city: { type: String },
            state: { type: String },
            zipCode: { type: String },
            country: { type: String }
        },
        shipped: { type: Boolean, default: false },
        shippedAt: { type: Date },
        trackingNumber: { type: String },
        childId: { type: Types.ObjectId, ref: "Child" }, // Associate with specific child
        childName: { type: String } // Store child name for admin reference
    },
    { _id: true, timestamps: true }
);
export type ParentDoc = HydratedDocument<IParent> & ParentMethods;
export type ParentModel = Model<IParent, object, ParentMethods>;
const ParentSchema = new Schema<IParent>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, index: true },
        phone: { type: String, trim: true }, // Cell phone for SMS voting links
        smsNotificationTime: { type: String, default: "17:00" }, // 24-hour format HH:MM (default 5 PM)
        smsNotificationsEnabled: { type: Boolean, default: true },
        timezone: { type: String, default: "America/New_York" }, // User's timezone
        avatarUrl: { type: String },
        // in Parent schema fields
        userId: { type: Types.ObjectId, ref: "User", required: true, index: true },


        // budgets
        magicBudgetCents: { type: Number, required: true, default: 0, min: 0 },

        // wallet
        walletBalanceCents: { type: Number, required: true, default: 0 }, // keep in sync from ledger
        walletLedger: { type: [WalletLedgerEntrySchema], default: [] },

        // welcome packets
        welcomePacketOrders: { type: [WelcomePacketOrderSchema], default: [] },

        // stripe
        stripeCustomerId: { type: String, index: true },
        stripeDefaultPaymentMethodId: { type: String },

        // relationships
        children: [{ type: Types.ObjectId, ref: "Child", index: true }],

        // settings
        giftSettings: { type: GiftSettingsSchema, default: () => ({}) },
        christmasSettings: { type: ChristmasSettingsSchema },
        pinIsSet: { type: Boolean, default: false },
        pinCode: { type: String }, 

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


// Delete the cached model to force recompilation with new schema fields
if (models.Parent) {
  delete models.Parent;
}

export const Parent = model<IParent, ParentModel>("Parent", ParentSchema);
