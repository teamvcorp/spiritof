import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Types } from "mongoose";
import GiftApprovals from "@/components/parents/GiftApprovals";

export default async function GiftApprovalsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  if (!session.isParentOnboarded) {
    redirect("/onboarding");
  }

  await dbConnect();

  // Verify parent exists
  const parent = await Parent.findOne({ 
    userId: new Types.ObjectId(session.user.id) 
  }).lean();

  if (!parent) {
    redirect("/onboarding");
  }

  return <GiftApprovals />;
}