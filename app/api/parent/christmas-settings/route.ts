import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Types } from "mongoose";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await dbConnect();

    const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Check payment method status and get address from welcome packet if available
    let hasPaymentMethod = false;
    let paymentMethodLast4 = undefined;
    let welcomePacketAddress = null;

    // Try to get address from completed welcome packet order
    if (parent.welcomePacketOrders && parent.welcomePacketOrders.length > 0) {
      const completedOrder = parent.welcomePacketOrders.find(order => 
        order.status === 'completed' && order.shippingAddress
      );
      if (completedOrder?.shippingAddress) {
        welcomePacketAddress = completedOrder.shippingAddress;
      }
    }

    if (parent.stripeCustomerId) {
      try {
        const { stripe } = await import("@/lib/stripe");
        
        // First check if we have a stored default payment method
        if (parent.stripeDefaultPaymentMethodId) {
          try {
            const paymentMethod = await stripe.paymentMethods.retrieve(parent.stripeDefaultPaymentMethodId);
            if (paymentMethod && paymentMethod.card) {
              hasPaymentMethod = true;
              paymentMethodLast4 = paymentMethod.card.last4;
            }
          } catch (pmError) {
            console.warn("Stored payment method not found, checking customer:", pmError);
          }
        }
        
        // If no stored payment method or it failed, check customer's payment methods
        if (!hasPaymentMethod) {
          const paymentMethods = await stripe.paymentMethods.list({
            customer: parent.stripeCustomerId,
            type: 'card',
          });
          
          if (paymentMethods.data.length > 0) {
            const defaultPM = paymentMethods.data[0]; // Use first available
            hasPaymentMethod = true;
            paymentMethodLast4 = defaultPM.card?.last4;
            
            // Update parent with the found payment method
            parent.stripeDefaultPaymentMethodId = defaultPM.id;
            await parent.save();
          }
        }
      } catch (stripeError) {
        console.warn("Could not check payment methods:", stripeError);
      }
    }

    const settings = {
      ...parent.christmasSettings,
      hasPaymentMethod,
      paymentMethodLast4,
    };

    return NextResponse.json({
      success: true,
      settings: settings || {},
      parentName: parent.name, // Include parent name for auto-population
      welcomePacketAddress, // Include welcome packet address for auto-population
    });

  } catch (error) {
    console.error("Get Christmas settings error:", error);
    return NextResponse.json(
      { error: "Failed to get Christmas settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const settings = await request.json();

    // Validate required fields
    if (!settings.shippingAddress?.recipientName || !settings.shippingAddress?.street || 
        !settings.shippingAddress?.city || !settings.shippingAddress?.state || 
        !settings.shippingAddress?.zipCode) {
      return NextResponse.json(
        { error: "Complete shipping address is required (recipient name, street, city, state, and ZIP code)" },
        { status: 400 }
      );
    }

    if (!settings.listLockDate || !settings.finalPaymentDate) {
      return NextResponse.json(
        { error: "List lock date and final payment date are required" },
        { status: 400 }
      );
    }

    // Validate date logic
    const listLockDate = new Date(settings.listLockDate);
    const finalPaymentDate = new Date(settings.finalPaymentDate);
    
    if (finalPaymentDate <= listLockDate) {
      return NextResponse.json(
        { error: "Final payment date must be after list lock date" },
        { status: 400 }
      );
    }

    await dbConnect();

    const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Update parent with Christmas settings
    parent.christmasSettings = {
      ...settings,
      setupCompleted: true,
      setupCompletedAt: new Date(),
    };

    await parent.save();

    return NextResponse.json({
      success: true,
      message: "Christmas settings saved successfully",
    });

  } catch (error) {
    console.error("Save Christmas settings error:", error);
    return NextResponse.json(
      { error: "Failed to save Christmas settings" },
      { status: 500 }
    );
  }
}