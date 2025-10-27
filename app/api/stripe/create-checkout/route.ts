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
    
    // Check if existing customer ID is valid for current mode (test/live)
    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (error: any) {
        // If customer doesn't exist in current mode (test/live mismatch), clear it
        if (error.code === 'resource_missing') {
          console.log(`Clearing invalid Stripe customer ID: ${stripeCustomerId} (mode mismatch)`);
          stripeCustomerId = undefined;
          parent.stripeCustomerId = undefined;
          await parent.save();
        } else {
          throw error; // Re-throw other Stripe errors
        }
      }
    }
    
    // Create new customer if needed
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

    // Create PaymentIntent for embedded payment
    const paymentIntent = await stripe.paymentIntents.create({
      customer: stripeCustomerId,
      amount: amount,
      currency: STRIPE_CONFIG.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'wallet_topup',
        parentId: parent._id.toString(),
        userId: session.user.id,
        amount: amount.toString(),
      },
      description: description || `Add $${(amount / 100).toFixed(2)} to your Christmas Magic wallet`,
    });

    // Create pending ledger entry
    parent.addLedgerEntry({
      type: "TOP_UP",
      amountCents: amount,
      stripePaymentIntentId: paymentIntent.id,
      status: "PENDING",
    });
    await parent.save();

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount
    });

  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ 
      error: "Failed to create checkout session" 
    }, { status: 500 });
  }
}