import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { cookies } from "next/headers";

import {dbConnect} from "@/lib/db";
import {Parent} from "@/models/Parent"; // has fields: pinIsSet: boolean, pinCode: string (hashed)
import {User} from "@/models/User";
import Dashboard from "./Dashboard";  // your actual dashboard UI (server or client)
import PinSetupModal from "./PinSetupModal";
import PinVerifyModal from "./PinVerifyModal";

export default async function ParentDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  await dbConnect();
  
  // Check the database directly for onboarding status and parent existence
  const user = await User.findById(session.user.id).select("isParentOnboarded parentId").lean();
  if (!user?.isParentOnboarded || !user?.parentId) {
    console.log('🔄 User not onboarded, redirecting to onboarding:', { 
      userId: session.user.id, 
      isOnboarded: user?.isParentOnboarded, 
      hasParentId: !!user?.parentId 
    });
    redirect("/onboarding");
  }

  const parent = await Parent.findOne({ userId: session.user.id }).lean();
  if (!parent) {
    console.log('❌ Parent not found, resetting onboarding status and redirecting');
    // Reset onboarding status if parent is missing
    await User.findByIdAndUpdate(session.user.id, { 
      isParentOnboarded: false, 
      parentId: null 
    });
    redirect("/onboarding");
  }

  const cookieKey = `parent_pin_ok_${parent._id.toString()}`;
  const pinOk = (await cookies()).get(cookieKey)?.value === "1";

  if (!parent.pinIsSet) return <PinSetupModal parentId={String(parent._id)} />;
  if (!pinOk) return <PinVerifyModal parentId={String(parent._id)} />;

  return <Dashboard />;
}
