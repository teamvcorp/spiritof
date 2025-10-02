import type { ObjectId } from "mongoose";

export type NeighborLedgerType = "DONATION" | "REFUND" | "ADJUSTMENT";
export type NeighborLedgerStatus = "PENDING" | "SUCCEEDED" | "FAILED";

export interface NeighborLedgerEntry {
  _id?: ObjectId;
  type: NeighborLedgerType;
  amountCents: number;
  currency: "usd";
  status: NeighborLedgerStatus;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  fromName?: string;
  fromEmail?: string;
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChildMethods {
  recomputeNeighborBalance(): number;
  addNeighborLedgerEntry(entry: Omit<NeighborLedgerEntry, "_id" | "createdAt" | "updatedAt" | "currency" | "status">): NeighborLedgerEntry;
}

export interface IChild {
  _id: ObjectId;
  parentId: ObjectId;

  displayName: string;
  avatarUrl?: string;

  percentAllocation: number; // 0..100 of parent's budget
  score365: number;          // 0..365 naughty/nice

  // Neighbor donations
  donationsEnabled: boolean;
  shareSlug: string;                 // public slug for QR / URL
  neighborBalanceCents: number;      // cached balance from ledger
  neighborLedger: NeighborLedgerEntry[];
  donorTotals?: { count: number; totalCents: number };

  // NEW: Gift list as ObjectId references to MasterCatalog
  giftList: ObjectId[];

  createdAt?: Date;
  updatedAt?: Date;
}
