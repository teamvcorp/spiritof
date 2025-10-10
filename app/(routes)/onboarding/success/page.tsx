import { redirect } from "next/navigation";

export default function OnboardingSuccess() {
  // This page exists to handle the success redirect and force session refresh
  // It immediately redirects to children list with a fresh session (no PIN required)
  redirect("/children/list");
}