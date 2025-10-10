import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Container from "@/components/ui/Container";
import { AuthOptions } from "@/components/auth/AuthOptions";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  // If already logged in, redirect appropriately
  if (session) {
    // If there's a callbackUrl from NextAuth, use it
    if (params.callbackUrl) {
      redirect(params.callbackUrl);
    }
    
    // Otherwise, use default logic
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