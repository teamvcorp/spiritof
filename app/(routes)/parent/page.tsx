import { redirect } from "next/navigation";


export default function ParentPage() {
  // Redirect to the actual parent dashboard
  redirect("/parent/dashboard");
}
