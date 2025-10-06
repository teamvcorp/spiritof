// /types/models/parent.ts
import type { ObjectId } from "mongoose";

export type VoteLedger = Record<string, string>; // childId -> "YYYY-MM-DD"

export interface GiftSettings {
    minGifts: number;
    maxGifts: number;
    perGiftCapCents: number; // 0 = no per-gift cap
}

export interface ChristmasSettings {
    // Budget & Payment
    monthlyBudgetGoal: number;
    autoContributeAmount: number;
    enableAutoContribute: boolean;
    
    // Timeline Settings
    listLockDate: string; // YYYY-MM-DD format
    finalPaymentDate: string;
    
    // Sharing & Gifts
    allowFriendGifts: boolean;
    maxFriendGiftValue: number;
    allowEarlyGifts: boolean;
    
    // Shipping Address
    shippingAddress: {
        recipientName: string;
        street: string;
        apartment?: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        isDefault: boolean;
    };
    
    // Payment Method
    hasPaymentMethod: boolean;
    paymentMethodLast4?: string;
    
    // Notifications
    reminderEmails: boolean;
    weeklyBudgetUpdates: boolean;
    listLockReminders: boolean;
    
    // Setup tracking
    setupCompleted?: boolean;
    setupCompletedAt?: Date;
    
    // List Finalization
    listsFinalized?: boolean;
    listsFinalizedAt?: Date;
    totalGiftCostCents?: number;
    finalizedChildrenData?: Array<{
        childId: ObjectId;
        childName: string;
        giftCount: number;
        giftCostCents: number;
        gifts: Array<{
            id: ObjectId;
            name: string;
            price: number;
        }>;
    }>;
    
    // Logistics & Fulfillment
    shipmentApproved?: boolean;
    shipmentApprovedAt?: Date;
    shipmentApprovedBy?: string; // Admin user ID
    shipped?: boolean;
    shippedAt?: Date;
    shippedBy?: string; // Admin user ID
    trackingNumber?: string;
    carrier?: string;
}

export type LedgerType = "TOP_UP" | "REFUND" | "ADJUSTMENT";
export type LedgerStatus = "PENDING" | "SUCCEEDED" | "FAILED";

export type NewLedgerEntry = Omit<
    WalletLedgerEntry,
    "_id" | "createdAt" | "updatedAt" | "currency" | "status"
> & {
    currency?: "usd";
    status?: LedgerStatus;
};

export interface ParentMethods {
    addLedgerEntry(entry: NewLedgerEntry): IParent["walletLedger"][number];
    recomputeWalletBalance(): number;
    canVoteToday(childId: string, todayISO: string): boolean;
    recordVote(childId: string, todayISO: string): void;
}

export interface WalletLedgerEntry {
    _id?: ObjectId;
    type: LedgerType;
    amountCents: number;        // + for top-up/adjustment credit, - for refund/adjustment debit
    currency: "usd";
    stripePaymentIntentId?: string;
    stripeCheckoutSessionId?: string;
    status: LedgerStatus;
    createdAt?: Date;           // populated by subdoc timestamps
    updatedAt?: Date;
}

export interface WelcomePacketOrder {
    _id?: ObjectId;
    stripeSessionId: string;
    selectedItems: string[];     // Array of item IDs
    totalAmount: number;
    status: "pending" | "completed" | "failed";
    shippingAddress?: {
        recipientName?: string;
        street?: string;
        apartment?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    shipped?: boolean;
    shippedAt?: Date;
    trackingNumber?: string;
    childId?: ObjectId;          // Associate with specific child
    childName?: string;          // Store child name for admin reference
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IParent {
    _id: ObjectId;
    name: string;
    email: string;
    avatarUrl?: string;
    userId: ObjectId;

    // money
    magicBudgetCents: number;       // monthly target budget
    walletBalanceCents: number;     // cached balance derived from walletLedger
    walletLedger: WalletLedgerEntry[];

    // welcome packets
    welcomePacketOrders?: WelcomePacketOrder[];

    // stripe
    stripeCustomerId?: string;
    stripeDefaultPaymentMethodId?: string;

    // relationships
    children: ObjectId[];

    // settings
    giftSettings: GiftSettings;
    christmasSettings?: ChristmasSettings;
    pinIsSet: boolean;
    pinCode?: string;

    // voting (per child per day)
    voteLedger: VoteLedger;

    createdAt?: Date;
    updatedAt?: Date;
}
