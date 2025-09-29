import { dbConnect } from "@/lib/db";
import { CatalogItem } from "@/models/CatalogItem";
import ChildGiftBuilder from "./ui/ChildGiftBuilder";

// TODO: replace with your real Child model query
type ChildLite = { id: string; name: string };

async function getChildren(): Promise<ChildLite[]> {
  // stub until you re-connect Child model
  return [{ id: "000000000000000000000001", name: "Sample Child" }];
}

export default async function ChildrenListPage() {
  await dbConnect();
  const initialChildren = await getChildren();

  // prefetch 1st page for fast TTFB (optional)
  const initialCatalog = await CatalogItem.find({ gender: "neutral" })
    .sort({ updatedAt: -1 })
    .limit(24)
    .select("title gender price retailer productUrl imageUrl brand model category")
    .lean();

  return (
    <ChildGiftBuilder initialChildren={initialChildren} initialCatalog={initialCatalog} />
  );
}
