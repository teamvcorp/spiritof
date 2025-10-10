import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Container from "@/components/ui/Container";
import { AuthOptions } from "@/components/auth/AuthOptions";

export default async function AuthPage() {
  const session = await auth();

  // If already logged in, redirect appropriately
  if (session) {
    if (session.isParentOnboarded) {
      redirect("/children/list");
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <div className="bg-[url('/images/snow.png')] bg-cover bg-center min-h-screen bg-frostyBlue py-20 px-4  ">

      <Container size='xl'>
        <AuthOptions />
      </Container>
    </div>
  );
}