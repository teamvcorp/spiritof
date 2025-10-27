import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { User } from "@/models/User";
import { generateUniqueShareSlug, clampInt } from "@/lib/welcome-packet-helpers";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

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

    console.log(`🎁 Adding child with welcome packet for parent ${parent._id}`);

    // Parse form data instead of JSON
    const formData = await req.formData();
    const displayName = formData.get('displayName')?.toString()?.trim();
    const percentAllocation = Number(formData.get('percentAllocation') || 0);
    const avatarUrl = formData.get('avatarUrl')?.toString()?.trim();
    const selectedItemsJson = formData.get('selectedItems')?.toString();
    
    // Parse custom selected items from form data
    let customSelectedItems: string[] = [];
    if (selectedItemsJson) {
      try {
        customSelectedItems = JSON.parse(selectedItemsJson);
      } catch (error) {
        console.error('Failed to parse selectedItems:', error);
        customSelectedItems = [];
      }
    }

    if (!displayName || !displayName.trim()) {
      console.log("❌ Missing displayName in form data");
      return NextResponse.json({ error: "Child name is required" }, { status: 400 });
    }

    // Check existing budget allocation
    const existingChildren = await Child.find({ parentId: parent._id });
    const currentTotalAllocation = existingChildren.reduce((sum, child) => sum + (child.percentAllocation || 0), 0);
    const newTotalAllocation = currentTotalAllocation + percentAllocation;
    
    if (newTotalAllocation > 100) {
      console.log(`❌ Budget exceeded: current ${currentTotalAllocation}%, trying to add ${percentAllocation}%, total would be ${newTotalAllocation}%`);
      return NextResponse.json({ 
        error: `Budget exceeded! You've already allocated ${currentTotalAllocation}% to existing children. You can only allocate ${100 - currentTotalAllocation}% more.` 
      }, { status: 400 });
    }

    console.log(`👶 Adding child: ${displayName}, allocation: ${percentAllocation}%, avatar: ${avatarUrl || 'none'}, items: ${customSelectedItems.join(', ') || 'none'}`);
    console.log(`💰 Budget check passed: ${currentTotalAllocation}% used, adding ${percentAllocation}%, total: ${newTotalAllocation}%`);

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

    // Get the previous welcome packet order for shipping address (if exists)
    const previousOrder = parent.welcomePacketOrders?.find(order => order.status === 'completed');
    console.log(`🔍 Found previous order for shipping address:`, previousOrder ? 'Yes' : 'No');

    // Calculate total for this child's welcome packet (use custom selected items)
    console.log(`🎁 Using custom selected items for ${displayName}: ${customSelectedItems.join(', ') || 'none'}`);
    const itemsTotal = customSelectedItems.reduce((total, itemId) => {
      const item = WELCOME_PACKET_ITEMS.find(i => i.id === itemId);
      return total + (item?.price || 0);
    }, 0);
    const totalAmount = ENROLLMENT_FEE + itemsTotal;

    console.log(`💰 Total welcome packet cost: $${totalAmount} (Enrollment: $${ENROLLMENT_FEE} + Items: $${itemsTotal})`);

    // Create Stripe PaymentIntent for embedded payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'child_welcome_packet',
        parentId: parent._id.toString(),
        childId: newChild._id.toString(),
        childName: displayName,
        selectedItems: JSON.stringify(customSelectedItems),
        totalAmount: totalAmount.toString()
      },
      description: `Welcome Packet for ${displayName}`,
    });

    // Store the pending order in parent's record
    if (!parent.welcomePacketOrders) {
      parent.welcomePacketOrders = [];
    }

    parent.welcomePacketOrders.push({
      stripeSessionId: paymentIntent.id, // Store PaymentIntent ID
      selectedItems: customSelectedItems,
      totalAmount,
      status: 'pending',
      shippingAddress: previousOrder?.shippingAddress, // Pre-populate with existing address if available
      shipped: false,
      createdAt: new Date(),
      childId: newChild._id,
      childName: displayName
    });

    await parent.save();

    console.log(`🎁 Created welcome packet PaymentIntent for child ${displayName}: $${totalAmount}`);

    return NextResponse.json({
      success: true,
      child: {
        id: newChild._id.toString(),
        name: displayName,
        shareSlug: newChild.shareSlug
      },
      payment: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        totalAmount,
        items: customSelectedItems
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