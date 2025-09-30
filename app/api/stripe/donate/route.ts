import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Child } from "@/models/Child";
import { stripe, STRIPE_CONFIG, PAYMENT_LIMITS } from "@/lib/stripe";
import { Types } from "mongoose";
import { z } from "zod";

const CreateDonationSchema = z.object({
  childId: z.string().min(1),
  amount: z.number().int().min(PAYMENT_LIMITS.MIN_DONATION).max(PAYMENT_LIMITS.MAX_DONATION),
  donorName: z.string().min(1).max(100),
  donorEmail: z.string().email().optional(),
  message: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateDonationSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid donation data", 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }

    const { childId, amount, donorName, donorEmail, message } = parsed.data;

    if (!Types.ObjectId.isValid(childId)) {
      return NextResponse.json({ error: "Invalid child ID" }, { status: 400 });
    }

    await dbConnect();
    
    const child = await Child.findById(childId);
    if (!child || !child.donationsEnabled) {
      return NextResponse.json({ 
        error: "Child not found or donations not enabled" 
      }, { status: 404 });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: STRIPE_CONFIG.mode,
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.currency,
            product_data: {
              name: `Christmas Magic for ${child.displayName}`,
              description: message || `Help ${child.displayName} earn Christmas magic points!`,
              images: [`${process.env.NEXTAUTH_URL}/images/christmasMagic.png`],
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'donation',
        childId: child._id.toString(),
        amount: amount.toString(),
        donorName,
        donorEmail: donorEmail || '',
        message: message || '',
      },
      success_url: `${process.env.NEXTAUTH_URL}/share/${child.shareSlug}?donation=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/share/${child.shareSlug}?donation=cancelled`,
    });

    // Create pending ledger entry
    const childDoc = child as unknown as { addNeighborLedgerEntry: (entry: { type: string; amountCents: number; fromName?: string; fromEmail?: string; message?: string; stripeCheckoutSessionId: string; status: string }) => void };
    childDoc.addNeighborLedgerEntry({
      type: "DONATION",
      amountCents: amount,
      fromName: donorName,
      fromEmail: donorEmail,
      message: message,
      stripeCheckoutSessionId: checkoutSession.id,
      status: "PENDING",
    });
    await child.save();

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id 
    });

  } catch (error) {
    console.error("Donation checkout error:", error);
    return NextResponse.json({ 
      error: "Failed to create donation checkout" 
    }, { status: 500 });
  }
}