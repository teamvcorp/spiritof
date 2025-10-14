import { dbConnect } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { StyledGiftBuilder } from "./ui/StyledGiftBuilder";
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
    .select("_id displayName avatarUrl score365 giftListLocked giftListLockedAt")
    .lean<IChild[]>();

  const childrenFormatted = children.map(child => ({
    id: child._id.toString(),
    name: child.displayName,
    avatarUrl: child.avatarUrl,
    magicPoints: child.score365 || 0,
    isLocked: child.giftListLocked || false,
    lockedAt: child.giftListLockedAt?.toISOString(),
  }));

  // Check if lists are finalized
  const listsFinalized = parent.christmasSettings?.listsFinalized || false;

  return (
    <StyledGiftBuilder 
      initialChildren={childrenFormatted}
      listsFinalized={listsFinalized}
    />
  );
}
