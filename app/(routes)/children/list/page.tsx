import { dbConnect } from "@/lib/db";
import { CatalogItem } from "@/models/CatalogItem";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import EnhancedChildGiftBuilder from "./ui/EnhancedChildGiftBuilder";
import type { IChild } from "@/types/childType";

export default async function ChildrenListPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  await dbConnect();

  // Get children for authenticated parent
  const parent = await Parent.findOne({ userId: session.user.id }).lean();
  if (!parent) {
    redirect("/onboarding");
  }

  const children = await Child.find({ parentId: parent._id })
    .select("_id displayName")
    .lean<IChild[]>();

  const childrenFormatted = children.map(child => ({
    id: child._id.toString(),
    name: child.displayName,
  }));

  // prefetch trending toys for fast TTFB
  const initialCatalogRaw = await CatalogItem.find({ gender: "neutral" })
    .sort({ updatedAt: -1 })
    .limit(24)
    .select("title gender price retailer productUrl imageUrl brand model category")
    .lean();

  // Convert _id from ObjectId to string for type compatibility
  const initialCatalog = initialCatalogRaw.map((item: Record<string, unknown>) => ({
    ...item,
    _id: String(item._id),
  })) as Array<{
    _id: string;
    title: string;
    brand?: string;
    category?: string;
    gender?: string;
    price?: number;
    retailer?: string;
    productUrl?: string;
    imageUrl?: string;
    tags?: string[];
  }>;

  return (
    <EnhancedChildGiftBuilder 
      initialChildren={childrenFormatted} 
      initialCatalog={initialCatalog} 
    />
  );
}
