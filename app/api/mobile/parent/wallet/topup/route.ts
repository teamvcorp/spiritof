// Wallet top-up endpoint for mobile
import { NextRequest } from 'next/server';
import { withMobileAuth, MobileApiResponse } from '@/lib/mobile-auth';
import { dbConnect } from '@/lib/db';
import { Parent } from '@/models/Parent';
import { stripe } from '@/lib/stripe';

interface TopUpRequest {
  amountCents: number;
  pin?: string;
}

export const POST = withMobileAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();
    
    const body: TopUpRequest = await request.json();
    const { amountCents } = body;

    if (!amountCents || amountCents < 100) {
      return MobileApiResponse.error('Minimum top-up amount is $1.00', 400);
    }

    if (amountCents > 100000) { // $1000 max
      return MobileApiResponse.error('Maximum top-up amount is $1000.00', 400);
    }

    // Get parent profile
    const parent = await Parent.findOne({ userId: user.userId });
    if (!parent) {
      return MobileApiResponse.error('Parent profile not found', 404);
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        parentId: parent._id.toString(),
        userId: user.userId,
        type: 'wallet_topup',
      },
    });

    // Create pending ledger entry
    const ledgerEntry = parent.addLedgerEntry({
      type: 'TOP_UP',
      amountCents,
      status: 'PENDING',
      stripePaymentIntentId: paymentIntent.id,
    });

    await parent.save();

    const response = {
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: amountCents,
        currency: 'usd',
      },
      ledgerEntryId: ledgerEntry._id?.toString() || '',
      currentBalance: parent.recomputeWalletBalance() / 100, // Convert to dollars
    };

    return MobileApiResponse.success(response);
  } catch (error) {
    console.error('Wallet top-up error:', error);
    return MobileApiResponse.error('Failed to create payment intent', 500);
  }
});

export async function OPTIONS() {
  return MobileApiResponse.success({}, 200);
}