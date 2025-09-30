import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

export const STRIPE_CONFIG = {
  currency: 'usd',
  payment_method_types: ['card'] as const,
  mode: 'payment' as const,
  success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel`,
} as const;

// Minimum amounts in cents
export const PAYMENT_LIMITS = {
  MIN_WALLET_TOP_UP: 500, // $5.00 minimum
  MAX_WALLET_TOP_UP: 50000, // $500.00 maximum
  MIN_DONATION: 100, // $1.00 minimum
  MAX_DONATION: 10000, // $100.00 maximum
} as const;