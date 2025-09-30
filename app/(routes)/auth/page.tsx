import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Container from "@/components/ui/Container";
import { AuthOptions } from "@/components/auth/AuthOptions";

export default async function AuthPage() {
  const session = await auth();

  // If already logged in, redirect appropriately
  if (session) {
    if (session.isParentOnboarded) {
      redirect("/parent/dashboard");
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-evergreen via-santa to-blueberry py-20 px-4">
      <Container className="max-w-lg">
        <AuthOptions />
      </Container>
    </div>
  );
}