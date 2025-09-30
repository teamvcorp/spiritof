import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create a Stripe Setup Intent for card verification (no payment)
    const setupIntent = await stripe.setupIntents.create({
      customer: undefined, // We'll create customer later if needed
      usage: 'off_session',
      payment_method_types: ['card'],
      metadata: {
        userId: session.user.id,
        purpose: 'adult_verification',
      },
    });

    // Create a Stripe Checkout session for Setup Intent
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'setup',
      setup_intent_data: {
        metadata: {
          userId: session.user.id,
          purpose: 'adult_verification',
        },
      },
      success_url: `${process.env.NEXTAUTH_URL}/onboarding?verified=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/onboarding?verified=false`,
      customer_email: user.email,
      consent_collection: {
        terms_of_service: 'required',
      },
    });

    return NextResponse.json({ 
      url: checkoutSession.url,
      setupIntentId: setupIntent.id 
    });

  } catch (error) {
    console.error('Adult verification error:', error);
    return NextResponse.json(
      { error: 'Failed to create verification session' },
      { status: 500 }
    );
  }
}