import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { stripe } from "@/lib/stripe";

interface Props {
  searchParams: Promise<{
    session_id?: string;
    customer_id?: string;
  }>;
}

export default async function VerifySuccessPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const { session_id, customer_id } = await searchParams;
  
  if (!session_id || !customer_id) {
    redirect("/onboarding?error=missing_verification_data");
  }

  // Don't wrap redirect in try-catch since redirects throw NEXT_REDIRECT errors
  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) redirect("/auth");

  try {
    // Verify the Stripe session was successful
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
    
    if (checkoutSession.status !== 'complete') {
      redirect("/onboarding?error=verification_incomplete");
    }

    // Verification successful - redirect to onboarding with success status
  } catch (error) {
    console.error('Stripe session verification error:', error);
    redirect("/onboarding?error=verification_failed");
  }

  // If we get here, verification was successful
  redirect(`/onboarding?verified=true&customer_id=${customer_id}`);
}