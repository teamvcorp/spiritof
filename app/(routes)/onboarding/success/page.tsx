import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function OnboardingSuccess() {
  // This page exists to handle the success redirect and force session refresh
  // Get fresh session to ensure updated onboarding status
  const session = await auth();
  
  console.log('🎉 Onboarding success page - session check:', {
    userId: session?.user?.id,
    isOnboarded: session?.isParentOnboarded,
    parentId: session?.parentId
  });
  
  // Force redirect to dashboard - the fresh session should have updated data
  redirect("/parent/dashboard");
}