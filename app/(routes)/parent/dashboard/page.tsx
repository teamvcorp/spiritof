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
  
  // Check the database directly for onboarding status instead of relying on session
  const user = await User.findById(session.user.id).select("isParentOnboarded").lean();
  if (!user?.isParentOnboarded) {
    redirect("/onboarding");
  }

  const parent = await Parent.findOne({ userId: session.user.id }).lean();
  if (!parent) redirect("/onboarding");
  if (!parent) redirect("/onboarding");

  const cookieKey = `parent_pin_ok_${parent._id.toString()}`;
  const pinOk = (await cookies()).get(cookieKey)?.value === "1";

  if (!parent.pinIsSet) return <PinSetupModal parentId={String(parent._id)} />;
  if (!pinOk) return <PinVerifyModal parentId={String(parent._id)} />;

  return <Dashboard />;
}
