import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { User } from "@/models/User";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

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
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    const parent = await Parent.findById(user.parentId);
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    console.log(`🔍 Checking welcome packet status for parent ${parent._id}`);

    // Check for any pending welcome packet orders
    const pendingOrders = parent.welcomePacketOrders?.filter(order => order.status === 'pending') || [];
    console.log(`Found ${pendingOrders.length} pending orders`);

    let updatedAny = false;

    for (const order of pendingOrders) {
      if (order.stripeSessionId) {
        try {
          console.log(`🔍 Checking Stripe session: ${order.stripeSessionId}`);
          const stripeSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
          
          console.log(`   Payment status: ${stripeSession.payment_status}`);
          console.log(`   Session status: ${stripeSession.status}`);

          if (stripeSession.payment_status === 'paid' && stripeSession.status === 'complete') {
            console.log(`✅ Found completed payment, updating order status`);
            
            // Update order status
            order.status = 'completed';
            
            // Store shipping address if available
            const shippingDetails = (stripeSession as any).shipping_details;
            if (shippingDetails?.address) {
              const address = shippingDetails.address;
              order.shippingAddress = {
                recipientName: shippingDetails.name || '',
                street: address.line1 || '',
                apartment: address.line2 || '',
                city: address.city || '',
                state: address.state || '',
                zipCode: address.postal_code || '',
                country: address.country || ''
              };
            }
            
            updatedAny = true;
          }
        } catch (error) {
          console.error(`❌ Error checking Stripe session ${order.stripeSessionId}:`, error);
        }
      }
    }

    if (updatedAny) {
      await parent.save();
      console.log(`✅ Updated parent record with completed orders`);
    }

    // Check final status
    const hasCompleted = parent.welcomePacketOrders?.some(order => order.status === 'completed') || false;

    return NextResponse.json({
      success: true,
      hasCompletedWelcomePacket: hasCompleted,
      totalOrders: parent.welcomePacketOrders?.length || 0,
      completedOrders: parent.welcomePacketOrders?.filter(order => order.status === 'completed').length || 0,
      pendingOrders: parent.welcomePacketOrders?.filter(order => order.status === 'pending').length || 0,
      updatedOrders: updatedAny
    });

  } catch (error) {
    console.error("Check welcome packet error:", error);
    return NextResponse.json({ 
      error: "Failed to check welcome packet status",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}