import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { stripe, STRIPE_CONFIG, PAYMENT_LIMITS } from "@/lib/stripe";
import { Types } from "mongoose";
import { z } from "zod";

const CreateCheckoutSchema = z.object({
  amount: z.number().int().min(PAYMENT_LIMITS.MIN_WALLET_TOP_UP).max(PAYMENT_LIMITS.MAX_WALLET_TOP_UP),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateCheckoutSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid amount", 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }

    const { amount, description } = parsed.data;

    await dbConnect();
    
    // Find or create parent
    const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found. Please complete onboarding." }, { status: 404 });
    }

    // Create or get Stripe customer
    let stripeCustomerId = parent.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: parent.email,
        name: parent.name,
        metadata: {
          parentId: parent._id.toString(),
          userId: session.user.id,
        },
      });
      stripeCustomerId = customer.id;
      parent.stripeCustomerId = stripeCustomerId;
      await parent.save();
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: STRIPE_CONFIG.mode,
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.currency,
            product_data: {
              name: 'Spirit of Santa - Wallet Top-up',
              description: description || `Add $${(amount / 100).toFixed(2)} to your Christmas Magic wallet`,
              images: [`${process.env.NEXTAUTH_URL}/images/christmasMagic.png`],
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'wallet_topup',
        parentId: parent._id.toString(),
        userId: session.user.id,
        amount: amount.toString(),
      },
      success_url: `${process.env.NEXTAUTH_URL}/parent/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/parent/dashboard?payment=cancelled`,
    });

    // Create pending ledger entry
    parent.addLedgerEntry({
      type: "TOP_UP",
      amountCents: amount,
      stripeCheckoutSessionId: checkoutSession.id,
      status: "PENDING",
    });
    await parent.save();

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id 
    });

  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ 
      error: "Failed to create checkout session" 
    }, { status: 500 });
  }
}