import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

interface WelcomePacketItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stripeProductId: string;
}

const WELCOME_PACKET_ITEMS: WelcomePacketItem[] = [
  {
    id: 'shirt',
    name: 'Christmas Spirit T-Shirt',
    description: 'Festive holiday shirt to spread Christmas cheer',
    price: 25,
    stripeProductId: 'prod_TBOi5CZSNqWyOc'
  },
  {
    id: 'cocoa-mug',
    name: 'Hot Cocoa Mug',
    description: 'Perfect for warming up with hot chocolate',
    price: 10,
    stripeProductId: 'prod_TBOhVuDqGuKh5O'
  },
  {
    id: 'santa-hat',
    name: 'Santa Hat',
    description: 'Classic red Santa hat for the holidays',
    price: 10,
    stripeProductId: 'prod_TBOhZSapyesNMe'
  },
  {
    id: 'cozy-hoodie',
    name: 'Cozy Holiday Hoodie',
    description: 'Warm and comfortable hoodie for cold winter days',
    price: 35,
    stripeProductId: 'prod_TBOh5AD0HZGcNs'
  }
];

const ENROLLMENT_FEE = 10;
const ENROLLMENT_PRODUCT_ID = 'prod_TBOjbHfeic8jZb';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await dbConnect();

    // Get parent record
    const parent = await Parent.findOne({ userId: session.user.id });
    if (!parent) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });
    }

    const { selectedItems, totalAmount } = await req.json();

    // Validate selected items
    const validItems = selectedItems.filter((itemId: string) => 
      WELCOME_PACKET_ITEMS.some(item => item.id === itemId)
    );

    // Calculate expected total
    const expectedTotal = ENROLLMENT_FEE + validItems.reduce((total: number, itemId: string) => {
      const item = WELCOME_PACKET_ITEMS.find(i => i.id === itemId);
      return total + (item?.price || 0);
    }, 0);

    if (totalAmount !== expectedTotal) {
      return NextResponse.json({ 
        error: "Total amount mismatch" 
      }, { status: 400 });
    }

    // Create line items for Stripe checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      // Enrollment fee (required)
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Welcome Letter & Site Access',
            description: 'Personalized welcome letter with login instructions',
            metadata: {
              type: 'enrollment',
              productId: ENROLLMENT_PRODUCT_ID
            }
          },
          unit_amount: ENROLLMENT_FEE * 100, // Convert to cents
        },
        quantity: 1,
      }
    ];

    // Add selected items
    validItems.forEach((itemId: string) => {
      const item = WELCOME_PACKET_ITEMS.find(i => i.id === itemId);
      if (item) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              description: item.description,
              metadata: {
                type: 'welcome_addon',
                productId: item.stripeProductId,
                itemId: item.id
              }
            },
            unit_amount: item.price * 100, // Convert to cents
          },
          quantity: 1,
        });
      }
    });

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/parent/dashboard?welcome_packet=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/parent/dashboard?welcome_packet=cancelled`,
      metadata: {
        type: 'welcome_packet',
        parentId: parent._id.toString(),
        selectedItems: JSON.stringify(validItems),
        totalAmount: totalAmount.toString()
      },
      customer_email: session.user.email || undefined,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'] // Adjust based on your shipping regions
      }
    });

    // Store the pending order in parent's record
    if (!parent.welcomePacketOrders) {
      parent.welcomePacketOrders = [];
    }

    parent.welcomePacketOrders.push({
      stripeSessionId: checkoutSession.id,
      selectedItems: validItems,
      totalAmount,
      status: 'pending',
      createdAt: new Date()
    });

    await parent.save();

    console.log(`🎁 Created welcome packet checkout for parent ${parent._id}: $${totalAmount}`);

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    });

  } catch (error) {
    console.error("Welcome packet creation error:", error);
    return NextResponse.json({ 
      error: "Failed to create welcome packet order",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}