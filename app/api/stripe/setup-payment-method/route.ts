import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { stripe } from "@/lib/stripe";
import { Types } from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { returnUrl } = await request.json();

    if (!returnUrl) {
      return NextResponse.json({ error: "Return URL is required" }, { status: 400 });
    }

    await dbConnect();

    const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Create or get Stripe customer
    let customerId = parent.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: parent.email,
        name: parent.name,
        metadata: {
          parentId: parent._id.toString(),
          userId: session.user.id,
        },
      });
      
      customerId = customer.id;
      parent.stripeCustomerId = customerId;
      await parent.save();
    }

    // Create Stripe Checkout session for setup mode
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'setup',
      success_url: `${returnUrl}?payment_setup=success`,
      cancel_url: `${returnUrl}?payment_setup=cancelled`,
      metadata: {
        parentId: parent._id.toString(),
        userId: session.user.id,
        purpose: 'christmas_setup',
      },
    });

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error("Setup payment method error:", error);
    return NextResponse.json(
      { error: "Failed to setup payment method" },
      { status: 500 }
    );
  }
}