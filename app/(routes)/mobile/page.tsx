import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { isMobileDevice } from "@/lib/mobile-utils";
import MobileSignIn from "@/app/(routes)/mobile/MobileSignIn";

export default async function MobilePage() {
  const session = await auth();
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";

  // Check if user is on a mobile device
  const isMobile = isMobileDevice(userAgent);

  // If not on mobile, redirect to home page
  if (!isMobile) {
    redirect("/");
  }

  // If already authenticated, redirect to mobile vote page
  if (session?.user) {
    redirect("/mobile/vote");
  }

  // Show mobile sign-in page
  return <MobileSignIn />;
}
