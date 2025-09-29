// /types/models/parent.ts
import type { ObjectId } from "mongoose";

export type VoteLedger = Record<string, string>; // childId -> "YYYY-MM-DD"

export interface GiftSettings {
    minGifts: number;
    maxGifts: number;
    perGiftCapCents: number; // 0 = no per-gift cap
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

    // stripe
    stripeCustomerId?: string;
    stripeDefaultPaymentMethodId?: string;

    // relationships
    children: ObjectId[];

    // settings
    giftSettings: GiftSettings;
    pinIsSet: boolean;
    pinCode?: string;

    // voting (per child per day)
    voteLedger: VoteLedger;

    createdAt?: Date;
    updatedAt?: Date;
}
