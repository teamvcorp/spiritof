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

const ENROLLMENT_FEE = 5;
const ENROLLMENT_PRODUCT_ID = 'prod_TBOjbHfeic8jZb';

export async function POST(req: NextRequest) {
  console.log("🎁 Welcome packet API called");
  try {
    console.log("1. Checking auth...");
    const session = await auth();
    if (!session?.user?.id) {
      console.log("❌ No session or user ID");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.log("✅ Auth OK, user ID:", session.user.id);

    console.log("2. Connecting to database...");
    await dbConnect();
    console.log("✅ Database connected");

    // Get parent record
    console.log("3. Finding parent record...");
    const parent = await Parent.findOne({ userId: session.user.id });
    if (!parent) {
      console.log("❌ Parent not found for user:", session.user.id);
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });
    }
    console.log("✅ Parent found:", parent._id);

    // Parse and validate request body
    let requestBody;
    try {
      console.log("4. Parsing request body...");
      requestBody = await req.json();
      console.log("✅ Request body parsed:", requestBody);
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return NextResponse.json({ 
        error: "Invalid JSON in request body" 
      }, { status: 400 });
    }

    const { selectedItems, totalAmount } = requestBody;

    console.log("5. Validating request fields...");
    console.log("selectedItems:", selectedItems, "type:", typeof selectedItems);
    console.log("totalAmount:", totalAmount, "type:", typeof totalAmount);

    // Validate required fields
    if (!Array.isArray(selectedItems)) {
      console.log("❌ selectedItems is not an array");
      return NextResponse.json({ 
        error: "selectedItems must be an array" 
      }, { status: 400 });
    }

    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      console.log("❌ totalAmount validation failed");
      return NextResponse.json({ 
        error: "totalAmount must be a positive number" 
      }, { status: 400 });
    }
    console.log("✅ Basic validation passed");

    // Validate selected items
    console.log("6. Validating selected items...");
    const validItems = selectedItems.filter((itemId: string) => 
      WELCOME_PACKET_ITEMS.some(item => item.id === itemId)
    );

    console.log("Valid items filtered:", validItems);

    // Calculate expected total
    console.log("7. Calculating expected total...");
    const expectedTotal = ENROLLMENT_FEE + validItems.reduce((total: number, itemId: string) => {
      const item = WELCOME_PACKET_ITEMS.find(i => i.id === itemId);
      return total + (item?.price || 0);
    }, 0);

    console.log("Expected total:", expectedTotal, "Received total:", totalAmount);

    if (totalAmount !== expectedTotal) {
      console.log("❌ Total amount mismatch");
      return NextResponse.json({ 
        error: "Total amount mismatch",
        expected: expectedTotal,
        received: totalAmount,
        details: `Expected $${expectedTotal} but received $${totalAmount}`
      }, { status: 400 });
    }
    console.log("✅ Total amount validation passed");

    // Create line items for Stripe checkout
    console.log("8. Creating Stripe line items...");
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
    console.log("9. Adding selected items to line items...");
    validItems.forEach((itemId: string) => {
      const item = WELCOME_PACKET_ITEMS.find(i => i.id === itemId);
      if (item) {
        console.log(`Adding item: ${item.name} ($${item.price})`);
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
    console.log("✅ Line items created:", lineItems.length);

    // Create Stripe checkout session
    console.log("10. Creating Stripe checkout session...");
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
    console.log("✅ Stripe session created:", checkoutSession.id);

    // Store the pending order in parent's record
    console.log("11. Storing order in parent record...");
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
    console.log("✅ Parent record updated");

    console.log(`🎁 Created welcome packet checkout for parent ${parent._id}: $${totalAmount}`);

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    });

  } catch (error) {
    console.error("❌ Welcome packet creation error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: "Failed to create welcome packet order",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}