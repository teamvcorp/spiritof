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
    console.log(`🎯 Webhook received: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        console.log(`💳 Processing checkout completed`);
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'setup_intent.succeeded':
        console.log(`🔐 Processing setup intent succeeded`);
        await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
        break;
      
      case 'payment_intent.succeeded':
        console.log(`✅ Processing payment succeeded`);
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        console.log(`❌ Processing payment failed`);
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`🤷 Unhandled event type: ${event.type}`);
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
  
  console.log(`🎁 Webhook: Processing wallet topup - Parent: ${parentId}, Amount: $${amount / 100}, Session: ${session.id}`);
  
  if (!parentId || !amount) {
    console.log(`❌ Webhook: Missing parentId (${parentId}) or amount (${amount})`);
    return;
  }

  const parent = await Parent.findById(parentId);
  if (!parent) {
    console.log(`❌ Webhook: Parent not found: ${parentId}`);
    return;
  }

  console.log(`📊 Webhook: Parent found, wallet ledger has ${parent.walletLedger?.length || 0} entries`);

  // Find the pending ledger entry and mark as succeeded
  const pendingEntry = parent.walletLedger.find(
    (entry: { stripeCheckoutSessionId?: string; status: string }) => entry.stripeCheckoutSessionId === session.id && entry.status === 'PENDING'
  );

  if (pendingEntry) {
    console.log(`✅ Webhook: Found pending entry, updating to SUCCEEDED`);
    (pendingEntry as { status: string; stripePaymentIntentId?: string }).status = 'SUCCEEDED';
    (pendingEntry as { status: string; stripePaymentIntentId?: string }).stripePaymentIntentId = session.payment_intent as string;
    
    // Recompute wallet balance
    const oldBalance = parent.walletBalanceCents;
    parent.recomputeWalletBalance();
    const newBalance = parent.walletBalanceCents;
    
    console.log(`💰 Webhook: Balance updated from $${oldBalance / 100} to $${newBalance / 100}`);
    
    await parent.save();
    
    console.log(`🎉 Webhook: Wallet topped up successfully - Parent ${parentId}, Amount: $${amount / 100}`);
  } else {
    console.log(`❌ Webhook: No pending entry found for session ${session.id}`);
    console.log(`📋 Webhook: Available entries:`, parent.walletLedger.map((e: { stripeCheckoutSessionId?: string; status: string; amountCents: number }) => ({ 
      sessionId: e.stripeCheckoutSessionId, 
      status: e.status,
      amount: e.amountCents 
    })));
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
    child.recomputeNeighborBalance();
    await child.save();
    
    console.log(`Donation processed: Child ${childId}, Amount: $${amount / 100}, Magic: +${magicPointsToAdd}`);
  }
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  console.log(`🔐 Setup intent succeeded: ${setupIntent.id}`);
  
  const customerId = setupIntent.customer as string;
  const paymentMethodId = setupIntent.payment_method as string;
  
  if (!customerId || !paymentMethodId) {
    console.log(`❌ Setup intent missing customer (${customerId}) or payment method (${paymentMethodId})`);
    return;
  }
  
  try {
    // Find parent by Stripe customer ID
    const parent = await Parent.findOne({ stripeCustomerId: customerId });
    if (!parent) {
      console.log(`❌ Parent not found for customer: ${customerId}`);
      return;
    }
    
    // Set as default payment method for the customer
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    
    // Update parent record
    parent.stripeDefaultPaymentMethodId = paymentMethodId;
    await parent.save();
    
    console.log(`✅ Payment method set for parent ${parent._id}: ${paymentMethodId}`);
  } catch (error) {
    console.error(`❌ Error processing setup intent: ${error}`);
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  
  // Handle Christmas finalization payments
  if (paymentIntent.metadata?.type === 'christmas_finalization') {
    const parentId = paymentIntent.metadata.parentId;
    
    if (parentId) {
      try {
        const parent = await Parent.findById(parentId);
        if (parent) {
          // Update the ledger entry status
          const pendingEntry = parent.walletLedger.find(entry => 
            entry.stripePaymentIntentId === paymentIntent.id && entry.status === 'PENDING'
          );
          
          if (pendingEntry) {
            pendingEntry.status = 'SUCCEEDED';
            parent.recomputeWalletBalance();
            await parent.save();
            console.log(`✅ Christmas finalization payment succeeded for parent ${parentId}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing finalization payment: ${error}`);
      }
    }
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Mark any related ledger entries as failed
  const checkoutSessionId = paymentIntent.metadata?.checkout_session_id;
  
  // Handle Christmas finalization payment failures
  if (paymentIntent.metadata?.type === 'christmas_finalization') {
    const parentId = paymentIntent.metadata.parentId;
    
    if (parentId) {
      try {
        const parent = await Parent.findById(parentId);
        if (parent) {
          const pendingEntry = parent.walletLedger.find(entry => 
            entry.stripePaymentIntentId === paymentIntent.id && entry.status === 'PENDING'
          );
          
          if (pendingEntry) {
            pendingEntry.status = 'FAILED';
            await parent.save();
            console.log(`❌ Christmas finalization payment failed for parent ${parentId}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing finalization payment failure: ${error}`);
      }
    }
    return;
  }
  
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