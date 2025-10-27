import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Create Stripe payment intent for $5 welcome packet
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500, // $5.00 in cents
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "pre_registration",
        email: email,
        name: name,
      },
      receipt_email: email,
      description: "Spirit of Santa - Pre-Registration Welcome Packet",
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error("Pre-registration error:", error);
    return NextResponse.json(
      {
        error: "Failed to process pre-registration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
