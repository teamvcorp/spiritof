// Child donation endpoint
import { NextRequest } from 'next/server';
import { MobileApiResponse } from '@/lib/mobile-auth';
import { dbConnect } from '@/lib/db';
import { Child } from '@/models/Child';
import { stripe } from '@/lib/stripe';

interface DonationRequest {
  shareSlug: string;
  amountCents: number;
  donorName?: string;
  donorEmail?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body: DonationRequest = await request.json();
    const { shareSlug, amountCents, donorName, donorEmail, message } = body;

    if (!shareSlug) {
      return MobileApiResponse.error('Share slug is required', 400);
    }

    if (!amountCents || amountCents < 100) {
      return MobileApiResponse.error('Minimum donation amount is $1.00', 400);
    }

    if (amountCents > 50000) { // $500 max
      return MobileApiResponse.error('Maximum donation amount is $500.00', 400);
    }

    // Find child by share slug
    const child = await Child.findOne({ shareSlug });
    if (!child) {
      return MobileApiResponse.error('Child not found', 404);
    }

    if (!child.donationsEnabled) {
      return MobileApiResponse.error('Donations are not enabled for this child', 403);
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        childId: child._id.toString(),
        shareSlug,
        donorName: donorName || 'Anonymous',
        type: 'neighbor_donation',
      },
      description: `Donation for ${child.displayName} - ${message || 'Christmas gift support'}`,
    });

    // Create pending ledger entry
    const ledgerEntry = child.addNeighborLedgerEntry({
      type: 'DONATION',
      amountCents,
      stripePaymentIntentId: paymentIntent.id,
      fromName: donorName,
      fromEmail: donorEmail,
      message,
    });

    await child.save();

    const response = {
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: amountCents,
        currency: 'usd',
      },
      ledgerEntryId: ledgerEntry._id?.toString() || '',
      childName: child.displayName,
      currentDonations: child.recomputeNeighborBalance() / 100, // Convert to dollars
    };

    return MobileApiResponse.success(response);
  } catch (error) {
    console.error('Child donation error:', error);
    return MobileApiResponse.error('Failed to create donation payment intent', 500);
  }
}

export async function OPTIONS() {
  return MobileApiResponse.success({}, 200);
}