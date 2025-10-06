import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { User } from "@/models/User";
import { hasCompletedWelcomePacket, generateUniqueShareSlug, clampInt } from "@/lib/welcome-packet-helpers";
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

    // Get user's parentId first
    const user = await User.findById(session.user.id).select("parentId").lean();
    if (!user?.parentId) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });
    }
    
    const parent = await Parent.findById(user.parentId);
    if (!parent) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });
    }

    // Check if welcome packet has been completed
    const hasWelcomePacket = await hasCompletedWelcomePacket(parent._id.toString());
    console.log(`🎁 Welcome packet status for parent ${parent._id}: ${hasWelcomePacket}`);
    
    if (!hasWelcomePacket) {
      return NextResponse.json({ 
        error: "Welcome packet must be completed before adding children" 
      }, { status: 400 });
    }

    // Parse form data instead of JSON
    const formData = await req.formData();
    const displayName = formData.get('displayName')?.toString()?.trim();
    const percentAllocation = Number(formData.get('percentAllocation') || 0);
    const avatarUrl = formData.get('avatarUrl')?.toString()?.trim();

    if (!displayName || !displayName.trim()) {
      console.log("❌ Missing displayName in form data");
      return NextResponse.json({ error: "Child name is required" }, { status: 400 });
    }

    console.log(`👶 Adding child: ${displayName}, allocation: ${percentAllocation}%, avatar: ${avatarUrl || 'none'}`);

    // Generate unique share slug with collision handling
    const shareSlug = await generateUniqueShareSlug();
    console.log(`🎯 Generated unique share slug: ${shareSlug}`);

    // Create the child with retry logic for extreme edge cases
    let newChild;
    try {
      newChild = await Child.create({
        parentId: parent._id,
        displayName: displayName.trim(),
        avatarUrl: avatarUrl || undefined,
        percentAllocation: clampInt(percentAllocation, 0, 100),
        score365: 0,
        donationsEnabled: true,
        shareSlug,
        neighborBalanceCents: 0,
        neighborLedger: [],
      });
    } catch (error: any) {
      // Handle the extremely rare case where collision occurs between check and create
      if (error.code === 11000 && error.message.includes('shareSlug')) {
        console.warn('⚠️ Rare shareSlug collision during create, retrying...');
        const retrySlug = await generateUniqueShareSlug();
        newChild = await Child.create({
          parentId: parent._id,
          displayName: displayName.trim(),
          avatarUrl: avatarUrl || undefined,
          percentAllocation: clampInt(percentAllocation, 0, 100),
          score365: 0,
          donationsEnabled: true,
          shareSlug: retrySlug,
          neighborBalanceCents: 0,
          neighborLedger: [],
        });
      } else {
        throw error; // Re-throw other errors
      }
    }

    console.log(`👶 Created new child: ${displayName}`);

    // Get the original welcome packet order to determine what items to include
    const originalOrder = parent.welcomePacketOrders?.find(order => order.status === 'completed');
    console.log(`🔍 Found original order:`, originalOrder ? 'Yes' : 'No');
    
    if (!originalOrder) {
      // This shouldn't happen if hasWelcomePacket check passed, but just in case
      console.log("❌ No completed welcome packet found, but hasWelcomePacket was true");
      console.log("📦 Available orders:", parent.welcomePacketOrders?.map(o => ({ status: o.status, items: o.selectedItems?.length })));
      return NextResponse.json({ 
        error: "No completed welcome packet found" 
      }, { status: 400 });
    }

    // Calculate total for this child's welcome packet (same items as original)
    const selectedItems = originalOrder.selectedItems || [];
    const itemsTotal = selectedItems.reduce((total, itemId) => {
      const item = WELCOME_PACKET_ITEMS.find(i => i.id === itemId);
      return total + (item?.price || 0);
    }, 0);
    const totalAmount = ENROLLMENT_FEE + itemsTotal;

    // Create line items for Stripe checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      // Enrollment fee (required)
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Welcome Letter Package for ${displayName}`,
            description: `Personalized welcome letter and login instructions for ${displayName}`,
            metadata: {
              type: 'enrollment',
              productId: ENROLLMENT_PRODUCT_ID,
              childId: newChild._id.toString(),
              childName: displayName
            }
          },
          unit_amount: ENROLLMENT_FEE * 100, // Convert to cents
        },
        quantity: 1,
      }
    ];

    // Add the same selected items from original order
    selectedItems.forEach((itemId: string) => {
      const item = WELCOME_PACKET_ITEMS.find(i => i.id === itemId);
      if (item) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${item.name} for ${displayName}`,
              description: item.description,
              metadata: {
                type: 'welcome_addon',
                productId: item.stripeProductId,
                itemId: item.id,
                childId: newChild._id.toString(),
                childName: displayName
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
      success_url: `${process.env.NEXTAUTH_URL}/parent/dashboard?child_welcome_packet=success&child=${encodeURIComponent(displayName)}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/parent/dashboard?child_welcome_packet=cancelled&child=${encodeURIComponent(displayName)}`,
      metadata: {
        type: 'child_welcome_packet',
        parentId: parent._id.toString(),
        childId: newChild._id.toString(),
        childName: displayName,
        selectedItems: JSON.stringify(selectedItems),
        totalAmount: totalAmount.toString()
      },
      customer_email: session.user.email || undefined,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA']
      }
    });

    // Store the pending order in parent's record
    if (!parent.welcomePacketOrders) {
      parent.welcomePacketOrders = [];
    }

    parent.welcomePacketOrders.push({
      stripeSessionId: checkoutSession.id,
      selectedItems: selectedItems,
      totalAmount,
      status: 'pending',
      shippingAddress: originalOrder.shippingAddress, // Pre-populate with existing address
      shipped: false,
      createdAt: new Date(),
      childId: newChild._id,
      childName: displayName
    });

    await parent.save();

    console.log(`🎁 Created welcome packet checkout for child ${displayName}: $${totalAmount}`);

    return NextResponse.json({
      success: true,
      child: {
        id: newChild._id.toString(),
        name: displayName,
        shareSlug: newChild.shareSlug
      },
      welcomePacket: {
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
        totalAmount,
        items: selectedItems
      }
    });

  } catch (error) {
    console.error("Add child with welcome packet error:", error);
    return NextResponse.json({ 
      error: "Failed to add child and create welcome packet",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}