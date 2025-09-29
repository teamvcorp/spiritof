"use server";

import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Gift } from "@/models/Gift";

type DraftItem = {
  title: string;
  url: string;
  imageUrl?: string;
  price?: string | number;
  retailer?: string;
  brand?: string;
  model?: string;
  category?: string;
};

export async function submitProposal(childId: string, items: DraftItem[]) {
  await dbConnect();
  if (!Types.ObjectId.isValid(childId)) throw new Error("Invalid childId");
  if (!Array.isArray(items) || items.length === 0) throw new Error("No items");

  const docs = items.slice(0, 50).map((it) => ({
    childId: new Types.ObjectId(childId),
    title: String(it.title || it.url || "Gift"),
    ids: {
      retailer: it.retailer,
      productUrl: it.url,
      imageUrl: it.imageUrl,
      brand: it.brand,
      model: it.model,
      category: it.category,
    },
    notes: "",
  }));

  await Gift.insertMany(docs, { ordered: false });
  return { ok: true, count: docs.length };
}
