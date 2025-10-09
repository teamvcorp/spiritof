import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import { z } from "zod";
import { sendAdminNotification } from "@/lib/admin-notifications";

const CreateCheckoutSchema = z.object({
  amount: z.number().int().min(10000), // Minimum $100
  companyName: z.string().min(1),
  companyEmail: z.string().email(),
  paymentMethod: z.enum(['card', 'ach']).default('card'),
  logoUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateCheckoutSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid donation details", 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }

    const { amount, companyName, companyEmail, paymentMethod, logoUrl } = parsed.data;

    await dbConnect();

    // Determine payment method types based on selection
    const paymentMethodTypes = paymentMethod === 'ach' 
      ? ['us_bank_account' as const] 
      : ['card' as const];

    // Create Stripe checkout session for corporate donation
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: companyEmail,
      payment_method_types: paymentMethodTypes,
      mode: paymentMethod === 'ach' ? 'payment' : STRIPE_CONFIG.mode,
      locale: 'en', // Explicitly set to English
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.currency,
            product_data: {
              name: 'Big Magic - Corporate Donation',
              description: `${companyName} - Supporting children's dreams and community programs`,
              images: [`${process.env.NEXTAUTH_URL}/images/big-magic-logo.png`],
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'big_magic_donation',
        companyName,
        companyEmail,
        amount: amount.toString(),
        paymentMethod,
        logoUrl: logoUrl || '',
      },
      success_url: `${process.env.NEXTAUTH_URL}/big-magic?donation=success&amount=${amount / 100}&company=${encodeURIComponent(companyName)}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/big-magic?donation=cancelled`,
    });

    // Send admin notification
    await sendAdminNotification({
      type: 'admin_action',
      title: `Big Magic Donation Initiated - ${companyName}`,
      description: `${companyName} has initiated a corporate donation of $${(amount / 100).toLocaleString()} via ${paymentMethod === 'ach' ? 'ACH bank transfer' : 'card payment'}.`,
      priority: 'high',
      metadata: {
        companyName,
        companyEmail,
        amount: `$${(amount / 100).toLocaleString()}`,
        sessionId: checkoutSession.id,
      },
    });

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id 
    });

  } catch (error: any) {
    console.error("❌ Big Magic checkout error:", error);
    console.error("Error details:", error?.message, error?.stack);
    return NextResponse.json({ 
      error: error?.message || "Failed to create checkout session",
      details: error?.toString(),
    }, { status: 500 });
  }
}
