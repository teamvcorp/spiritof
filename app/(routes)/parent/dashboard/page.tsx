import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { cookies } from "next/headers";

import {dbConnect} from "@/lib/db";
import {Parent} from "@/models/Parent"; // has fields: pinIsSet: boolean, pinCode: string (hashed)
import {User} from "@/models/User";
import Dashboard from "./Dashboard";  // your actual dashboard UI (server or client)
import PinSetupModal from "./PinSetupModal";
import PinVerifyModal from "./PinVerifyModal";

type PageProps = {
  searchParams: Promise<{ 
    payment?: string; 
    session_id?: string;
    welcome_packet?: string;
    child_welcome_packet?: string;
    child?: string;
  }>;
};

export default async function ParentDashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  await dbConnect();
  
  // Check the database directly for onboarding status and parent existence
  const user = await User.findById(session.user.id).select("isParentOnboarded parentId").lean();
  if (!user?.isParentOnboarded || !user?.parentId) {
    redirect("/onboarding");
  }

  // Use the parentId from the user record, not userId lookup
  const parent = await Parent.findById(user.parentId).lean();
  if (!parent) {
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

  // Get search parameters
  const params = await searchParams;
  console.log('Page level - received searchParams:', params);

  return <Dashboard searchParams={params} />;
}
