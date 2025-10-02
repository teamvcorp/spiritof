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
    // Add timeout wrapper for auth to prevent hanging
    const session = await Promise.race([
      auth(),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout after 5 seconds')), 5000)
      )
    ]);

    if (!session?.user?.id) {
      console.warn('No session or user ID found', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userId: session?.user?.id 
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add retry logic for database operations
    let dbRetries = 3;
    let user, existingParent;
    
    while (dbRetries > 0) {
      try {
        await dbConnect();
        
        // First get the user, then search for existing parent
        user = await User.findById(session.user.id).lean();
        
        if (user) {
          existingParent = await Parent.findOne({ 
            email: user.email, 
            stripeCustomerId: { $exists: true, $ne: null } 
          }).lean();
        }
        
        break; // Success, exit retry loop
      } catch (dbError) {
        dbRetries--;
        console.warn(`Database operation failed, ${dbRetries} retries left:`, dbError);
        if (dbRetries === 0) throw dbError;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }

    if (!user) {
      console.error('User not found in database', { userId: session.user.id });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingParent && existingParent.stripeCustomerId) {
      // Already verified, redirect to setup with customer ID
      const baseUrl = getBaseUrl();
      return NextResponse.redirect(new URL(`/onboarding?verified=true&customer_id=${existingParent.stripeCustomerId}`, baseUrl));
    }

    // Add retry logic for Stripe operations
    let customer, checkoutSession;
    let stripeRetries = 2;
    
    while (stripeRetries > 0) {
      try {
        // Create Stripe customer for age verification
        customer = await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: {
            userId: session.user.id,
            purpose: 'adult_verification',
            platform: 'spirit_of_santa'
          },
        });

        // Get the base URL for redirects
        const baseUrl = getBaseUrl();

        // Create a Stripe Checkout session for Setup Intent (card verification)
        checkoutSession = await stripe.checkout.sessions.create({
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
        
        break; // Success, exit retry loop
      } catch (stripeError) {
        stripeRetries--;
        console.warn(`Stripe operation failed, ${stripeRetries} retries left:`, stripeError);
        if (stripeRetries === 0) throw stripeError;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
      }
    }

    if (!checkoutSession?.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return NextResponse.redirect(checkoutSession.url);

  } catch (error) {
    console.error('Adult verification error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    const baseUrl = getBaseUrl();
    return NextResponse.redirect(new URL("/onboarding?error=verification_failed", baseUrl));
  }
}

// Improved base URL determination with better environment detection
function getBaseUrl(): string {
  // Production environment
  if (process.env.VERCEL_ENV === 'production') {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://www.spiritofsanta.club';
  }
  
  // Preview/staging environment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Development fallback
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}