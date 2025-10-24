import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { stripe } from "@/lib/stripe";
import { Types } from "mongoose";

export async function POST(request: NextRequest) {
  try {
    // Debug log to verify Stripe key mode
    const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
    console.log(`🔑 Setup payment method - Stripe mode: ${isLiveMode ? 'LIVE' : 'TEST'}`);
    
    console.log("1️⃣ Checking authentication...");
    const session = await auth();
    if (!session?.user?.id) {
      console.log("❌ Authentication failed - no session");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.log(`✅ Authenticated user: ${session.user.id}`);

    console.log("2️⃣ Parsing request body...");
    const { returnUrl } = await request.json();
    console.log(`Request body parsed, returnUrl: ${returnUrl}`);

    if (!returnUrl) {
      console.log("❌ No returnUrl provided");
      return NextResponse.json({ error: "Return URL is required" }, { status: 400 });
    }

    console.log("3️⃣ Connecting to database...");
    await dbConnect();
    console.log("✅ Database connected");

    console.log("4️⃣ Finding parent record...");
    const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
    if (!parent) {
      console.log("❌ Parent not found for user:", session.user.id);
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }
    console.log(`✅ Parent found: ${parent._id}, customerId: ${parent.stripeCustomerId || 'none'}`);

    // Create or get Stripe customer
    let customerId = parent.stripeCustomerId;
    
    if (!customerId) {
      console.log("5️⃣ Creating new Stripe customer...");
      const customer = await stripe.customers.create({
        email: parent.email,
        name: parent.name,
        metadata: {
          parentId: parent._id.toString(),
          userId: session.user.id,
        },
      });
      
      customerId = customer.id;
      console.log(`✅ Stripe customer created: ${customerId}`);
      
      parent.stripeCustomerId = customerId;
      await parent.save();
      console.log("✅ Parent record updated with customerId");
    } else {
      console.log(`5️⃣ Using existing Stripe customer: ${customerId}`);
    }

    console.log("6️⃣ Creating Stripe checkout session...");
    // Create Stripe Checkout session for setup mode
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'setup',
      locale: 'en', // Explicitly set to English
      success_url: `${returnUrl}?payment_setup=success`,
      cancel_url: `${returnUrl}?payment_setup=cancelled`,
      metadata: {
        parentId: parent._id.toString(),
        userId: session.user.id,
        purpose: 'christmas_setup',
      },
    });

    console.log(`✅ Created checkout session: ${checkoutSession.id} (${checkoutSession.livemode ? 'LIVE' : 'TEST'} mode)`);

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      livemode: checkoutSession.livemode, // Include mode in response for debugging
    });

  } catch (error) {
    console.error("❌ Setup payment method error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    
    return NextResponse.json(
      { 
        error: "Failed to setup payment method",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}