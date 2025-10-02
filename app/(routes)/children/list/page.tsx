import { dbConnect } from "@/lib/db";
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

  return (
    <EnhancedChildGiftBuilder 
      initialChildren={childrenFormatted} 
    />
  );
}
