import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Parent } from "@/models/Parent";

export async function GET() {
  return handleVerification();
}

export async function POST() {
  return handleVerification();
}

async function handleVerification() {
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

    // Check if user already has a verified Stripe customer
    const existingParent = await Parent.findOne({ 
      email: user.email, 
      stripeCustomerId: { $exists: true, $ne: null } 
    });
    
    if (existingParent && existingParent.stripeCustomerId) {
      // Already verified, redirect to setup with customer ID
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      return NextResponse.redirect(new URL(`/onboarding?verified=true&customer_id=${existingParent.stripeCustomerId}`, baseUrl));
    }

    // Create Stripe customer for age verification
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: session.user.id,
        purpose: 'adult_verification',
        platform: 'spirit_of_santa'
      },
    });

    // Get the base URL for redirects
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';

    // Create a Stripe Checkout session for Setup Intent (card verification)
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customer.id,
      setup_intent_data: {
        metadata: {
          userId: session.user.id,
          customerId: customer.id,
          purpose: 'adult_verification',
        },
      },
      success_url: `${baseUrl}/onboarding/verify-success?session_id={CHECKOUT_SESSION_ID}&customer_id=${customer.id}`,
      cancel_url: `${baseUrl}/onboarding?error=verification_cancelled`,
      consent_collection: {
        terms_of_service: 'required',
      },
      payment_method_types: ['card'],
      locale: 'en',
    });

    if (!checkoutSession.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return NextResponse.redirect(checkoutSession.url);

  } catch (error) {
    console.error('Adult verification error:', error);
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL("/onboarding?error=verification_failed", baseUrl));
  }
}