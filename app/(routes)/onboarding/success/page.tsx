import { redirect } from "next/navigation";

export default function OnboardingSuccess() {
  // This page exists to handle the success redirect and force session refresh
  // It immediately redirects to dashboard with a fresh session
  redirect("/parent/dashboard");
}