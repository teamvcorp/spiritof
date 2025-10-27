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
    
    // Silent events - informational only, no action needed
    const silentEvents = [
      'charge.updated',
      'charge.succeeded',
      'payment_method.attached',
      'customer.updated',
      'invoice.payment_succeeded'
    ];
    
    if (silentEvents.includes(event.type)) {
      return NextResponse.json({ received: true });
    }
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
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
  } else if (metadata.type === 'welcome_packet') {
    await handleWelcomePacketOrder(session);
  } else if (metadata.type === 'child_welcome_packet') {
    await handleChildWelcomePacketOrder(session);
  } else if (metadata.type === 'big_magic_donation') {
    await handleBigMagicDonation(session);
  }
}

async function handleWalletTopup(session: Stripe.Checkout.Session) {
  const { metadata } = session;
  const parentId = metadata?.parentId;
  const amount = parseInt(metadata?.amount || '0');
  
  if (!parentId || !amount) {
    return;
  }

  const parent = await Parent.findById(parentId);
  if (!parent) {
    return;
  }

  // Find the pending ledger entry and mark as succeeded
  const pendingEntry = parent.walletLedger.find(
    (entry: { stripeCheckoutSessionId?: string; status: string }) => entry.stripeCheckoutSessionId === session.id && entry.status === 'PENDING'
  );

  if (pendingEntry) {
    (pendingEntry as { status: string; stripePaymentIntentId?: string }).status = 'SUCCEEDED';
    (pendingEntry as { status: string; stripePaymentIntentId?: string }).stripePaymentIntentId = session.payment_intent as string;
    
    // Recompute wallet balance
    const oldBalance = parent.walletBalanceCents;
    parent.recomputeWalletBalance();
    const newBalance = parent.walletBalanceCents;
    
    await parent.save();
  } else {
    console.log(`📋 Webhook: Available entries:`, parent.walletLedger.map((e: { status: string; amountCents: number }) => ({
       
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
  }
}

async function handleWelcomePacketOrder(session: Stripe.Checkout.Session) {
  const { metadata } = session;
  const parentId = metadata?.parentId;
  const totalAmount = parseInt(metadata?.totalAmount || '0');
  
  if (!parentId || !totalAmount) {
    return;
  }

  const parent = await Parent.findById(parentId);
  if (!parent) {
    return;
  }

  // Find the pending welcome packet order and mark as completed
  const pendingOrder = parent.welcomePacketOrders?.find(
    order => order.stripeSessionId === session.id && order.status === 'pending'
  );

  if (pendingOrder) {
    
    // Update order status
    pendingOrder.status = 'completed';
    
    // Store shipping address from the session
    const shippingDetails = (session as any).shipping_details;
    if (shippingDetails?.address) {
      const address = shippingDetails.address;
      pendingOrder.shippingAddress = {
        recipientName: shippingDetails.name || '',
        street: address.line1 || '',
        apartment: address.line2 || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.postal_code || '',
        country: address.country || ''
      };
    }
    
    await parent.save();
  } else {
  }
}

async function handleChildWelcomePacketOrder(session: Stripe.Checkout.Session) {
  const { metadata } = session;
  const parentId = metadata?.parentId;
  const childId = metadata?.childId;
  const childName = metadata?.childName;
  const totalAmount = parseInt(metadata?.totalAmount || '0');
  
  if (!parentId || !childId || !totalAmount) {
    return;
  }

  const parent = await Parent.findById(parentId);
  if (!parent) {
    return;
  }

  // Find the pending welcome packet order for this child
  const pendingOrder = parent.welcomePacketOrders?.find(
    order => order.stripeSessionId === session.id && 
             order.status === 'pending' && 
             order.childId?.toString() === childId
  );

  if (pendingOrder) {
    
    // Update order status
    pendingOrder.status = 'completed';
    
    // Store shipping address from the session
    const shippingDetails = (session as any).shipping_details;
    if (shippingDetails?.address) {
      const address = shippingDetails.address;
      pendingOrder.shippingAddress = {
        recipientName: shippingDetails.name || '',
        street: address.line1 || '',
        apartment: address.line2 || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.postal_code || '',
        country: address.country || ''
      };
    }
    
    await parent.save();
  } else {
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const { metadata } = session;
  
  // Only handle child welcome packet cancellations (cleanup needed)
  if (metadata?.type === 'child_welcome_packet') {
    const parentId = metadata.parentId;
    const childId = metadata.childId;
    const childName = metadata.childName;
    
    if (!parentId || !childId) {
      return;
    }
    
    const parent = await Parent.findById(parentId);
    if (!parent) {
      return;
    }
    
    // Remove the pending welcome packet order
    if (parent.welcomePacketOrders) {
      const orderIndex = parent.welcomePacketOrders.findIndex(
        order => order.stripeSessionId === session.id && order.status === 'pending'
      );
      
      if (orderIndex >= 0) {
        parent.welcomePacketOrders.splice(orderIndex, 1);
        await parent.save();
      } else {
      }
    }
    
    // Delete the child that was created
    try {
      const deletedChild = await Child.findByIdAndDelete(childId);
      if (deletedChild) {
      } else {
      }
    } catch (error) {
      console.error(`❌ Error deleting child ${childId}:`, error);
    }
  } else {
  }
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  
  const customerId = setupIntent.customer as string;
  const paymentMethodId = setupIntent.payment_method as string;
  
  if (!customerId || !paymentMethodId) {
    return;
  }
  
  try {
    // Find parent by Stripe customer ID
    const parent = await Parent.findOne({ stripeCustomerId: customerId });
    if (!parent) {
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
  } catch (error) {
    console.error(`❌ Error processing setup intent: ${error}`);
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  
  // Handle wallet top-up payments (using PaymentIntent directly)
  if (paymentIntent.metadata?.type === 'wallet_topup') {
    const parentId = paymentIntent.metadata.parentId;
    const amount = parseInt(paymentIntent.metadata.amount || '0');
    
    if (parentId && amount) {
      try {
        const parent = await Parent.findById(parentId);
        if (parent) {
          // Find the pending ledger entry and mark as succeeded
          const pendingEntry = parent.walletLedger.find(
            (entry: { stripePaymentIntentId?: string; status: string }) => 
              entry.stripePaymentIntentId === paymentIntent.id && entry.status === 'PENDING'
          );

          if (pendingEntry) {
            console.log(`✅ Webhook: Completing wallet top-up for parent ${parentId}: $${amount / 100}`);
            
            (pendingEntry as { status: string }).status = 'SUCCEEDED';
            
            // Recompute wallet balance
            const oldBalance = parent.walletBalanceCents;
            parent.recomputeWalletBalance();
            const newBalance = parent.walletBalanceCents;
            
            await parent.save();
            
            console.log(`✅ Webhook: Wallet balance updated from ${oldBalance} to ${newBalance}`);
          } else {
            console.log(`⚠️ Webhook: No pending entry found for PaymentIntent ${paymentIntent.id}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing wallet top-up payment: ${error}`);
      }
    }
    return;
  }
  
  // Handle welcome packet payments (using PaymentIntent directly)
  if (paymentIntent.metadata?.type === 'child_welcome_packet') {
    const parentId = paymentIntent.metadata.parentId;
    const childId = paymentIntent.metadata.childId;
    const childName = paymentIntent.metadata.childName;
    
    if (parentId && childId) {
      try {
        const parent = await Parent.findById(parentId);
        if (parent) {
          // Find the pending welcome packet order
          const pendingOrder = parent.welcomePacketOrders?.find(
            order => order.stripeSessionId === paymentIntent.id && 
                     order.status === 'pending' && 
                     order.childId?.toString() === childId
          );

          if (pendingOrder) {
            console.log(`✅ Webhook: Completing welcome packet order for ${childName}`);
            
            // Update order status
            pendingOrder.status = 'completed';
            await parent.save();
            
            console.log(`✅ Webhook: Welcome packet order completed for ${childName}`);
          } else {
            console.log(`⚠️ Webhook: No pending order found for PaymentIntent ${paymentIntent.id}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing welcome packet payment: ${error}`);
      }
    }
    return;
  }
  
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
  }
}

async function handleBigMagicDonation(session: Stripe.Checkout.Session) {
  const { metadata } = session;
  const companyName = metadata?.companyName;
  const companyEmail = metadata?.companyEmail;
  const amount = parseInt(metadata?.amount || '0');
  const logoUrl = metadata?.logoUrl || undefined;
  const paymentMethod = metadata?.paymentMethod || 'card';
  
  if (!companyName || !amount) {
    return;
  }

  // Save donation to database
  const { CorporateDonation } = await import("@/models/CorporateDonation");
  
  const donation = await CorporateDonation.create({
    companyName,
    companyEmail,
    amount,
    paymentMethod: paymentMethod === 'ach' ? 'wire' : paymentMethod, // Map 'ach' to 'wire' for database
    status: 'completed',
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string,
    logoUrl: logoUrl || undefined,
    completedAt: new Date(),
  });
  
  // Send admin notification
  const { sendAdminNotification } = await import("@/lib/admin-notifications");
  
  await sendAdminNotification({
    type: 'admin_action',
    title: `Big Magic Donation Completed - ${companyName}`,
    description: `${companyName} has successfully completed their corporate donation of $${(amount / 100).toLocaleString()}.`,
    priority: 'high',
    metadata: {
      companyName,
      companyEmail,
      amount: `$${(amount / 100).toLocaleString()}`,
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      logoUrl: logoUrl || 'Not provided',
      donationId: String(donation._id),
    },
  });
}