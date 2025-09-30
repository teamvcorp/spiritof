import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import Stripe from "stripe";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await dbConnect();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { metadata } = session;
  
  if (!metadata) return;

  if (metadata.type === 'wallet_topup') {
    await handleWalletTopup(session);
  } else if (metadata.type === 'donation') {
    await handleDonation(session);
  }
}

async function handleWalletTopup(session: Stripe.Checkout.Session) {
  const { metadata } = session;
  const parentId = metadata?.parentId;
  const amount = parseInt(metadata?.amount || '0');
  
  if (!parentId || !amount) return;

  const parent = await Parent.findById(parentId);
  if (!parent) return;

  // Find the pending ledger entry and mark as succeeded
  const pendingEntry = parent.walletLedger.find(
    (entry: { stripeCheckoutSessionId?: string; status: string }) => entry.stripeCheckoutSessionId === session.id && entry.status === 'PENDING'
  );

  if (pendingEntry) {
    (pendingEntry as { status: string; stripePaymentIntentId?: string }).status = 'SUCCEEDED';
    (pendingEntry as { status: string; stripePaymentIntentId?: string }).stripePaymentIntentId = session.payment_intent as string;
    
    // Recompute wallet balance
    const parentDoc = parent as unknown as { recomputeWalletBalance: () => Promise<void> };
    await parentDoc.recomputeWalletBalance();
    await parent.save();
    
    console.log(`Wallet topped up: Parent ${parentId}, Amount: $${amount / 100}`);
  }
}

async function handleDonation(session: Stripe.Checkout.Session) {
  const { metadata } = session;
  const childId = metadata?.childId;
  const amount = parseInt(metadata?.amount || '0');
  
  if (!childId || !amount) return;

  const child = await Child.findById(childId);
  if (!child) return;

  // Find the pending ledger entry and mark as succeeded
  const pendingEntry = child.neighborLedger.find(
    (entry: { stripeCheckoutSessionId?: string; status: string }) => entry.stripeCheckoutSessionId === session.id && entry.status === 'PENDING'
  );

  if (pendingEntry) {
    (pendingEntry as { status: string; stripePaymentIntentId?: string }).status = 'SUCCEEDED';
    (pendingEntry as { status: string; stripePaymentIntentId?: string }).stripePaymentIntentId = session.payment_intent as string;
    
    // Update magic score (1:1 ratio with dollars)
    const magicPointsToAdd = Math.floor(amount / 100); // $1 = 1 magic point
    child.score365 = Math.min(365, child.score365 + magicPointsToAdd);
    
    // Update donor totals
    child.donorTotals = child.donorTotals || { count: 0, totalCents: 0 };
    child.donorTotals.count += 1;
    child.donorTotals.totalCents += amount;
    
    // Recompute neighbor balance
    const childDoc = child as unknown as { recomputeNeighborBalance: () => Promise<void> };
    await childDoc.recomputeNeighborBalance();
    await child.save();
    
    console.log(`Donation processed: Child ${childId}, Amount: $${amount / 100}, Magic: +${magicPointsToAdd}`);
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Additional handling if needed - the checkout.session.completed usually covers this
  console.log(`Payment succeeded: ${paymentIntent.id}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Mark any related ledger entries as failed
  const checkoutSessionId = paymentIntent.metadata?.checkout_session_id;
  
  if (checkoutSessionId) {
    // Find and mark failed entries in both Parent and Child collections
    await Parent.updateMany(
      { "walletLedger.stripeCheckoutSessionId": checkoutSessionId },
      { $set: { "walletLedger.$.status": "FAILED" } }
    );
    
    await Child.updateMany(
      { "neighborLedger.stripeCheckoutSessionId": checkoutSessionId },
      { $set: { "neighborLedger.$.status": "FAILED" } }
    );
    
    console.log(`Payment failed: ${paymentIntent.id}`);
  }
}