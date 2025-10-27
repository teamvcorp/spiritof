import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { User } from "@/models/User";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { paymentIntentId, shippingAddress } = await req.json();

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Payment intent ID is required" }, { status: 400 });
    }

    await dbConnect();

    // Get user's parentId
    const user = await User.findById(session.user.id).select("parentId").lean();
    if (!user?.parentId) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    const parent = await Parent.findById(user.parentId);
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Verify the payment intent is paid
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ 
        error: "Payment has not been completed" 
      }, { status: 400 });
    }

    // Find the corresponding welcome packet order
    const order = parent.welcomePacketOrders?.find(
      o => o.stripeSessionId === paymentIntentId && o.status === 'pending'
    );

    if (!order) {
      return NextResponse.json({ 
        error: "Welcome packet order not found" 
      }, { status: 404 });
    }

    // Update the order with shipping address and mark as completed
    order.status = 'completed';
    
    if (shippingAddress) {
      order.shippingAddress = {
        recipientName: shippingAddress.recipientName || '',
        street: shippingAddress.street || '',
        apartment: shippingAddress.apartment || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        zipCode: shippingAddress.zipCode || '',
        country: shippingAddress.country || 'US'
      };
    }

    await parent.save();

    console.log(`✅ Completed welcome packet order for child ${order.childName}`);

    // Revalidate the dashboard to show the new child
    revalidatePath("/parent/dashboard");

    return NextResponse.json({
      success: true,
      childName: order.childName
    });

  } catch (error) {
    console.error("Complete welcome packet error:", error);
    return NextResponse.json({ 
      error: "Failed to complete welcome packet order",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
