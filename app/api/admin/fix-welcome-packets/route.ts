import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    // Simple auth check - in production you should use proper admin auth
    const { adminPassword } = await req.json();
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Find all parents with pending welcome packet orders
    const parents = await Parent.find({
      "welcomePacketOrders.status": "pending"
    });

    let fixedCount = 0;
    const results = [];

    for (const parent of parents) {
      for (const order of parent.welcomePacketOrders || []) {
        if (order.status === "pending") {
          try {
            // Check with Stripe if the session was actually completed
            const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
            
            if (session.payment_status === "paid" && session.status === "complete") {
              // Mark as completed
              order.status = "completed";
              fixedCount++;
              
              results.push({
                parentId: parent._id,
                sessionId: order.stripeSessionId,
                amount: order.totalAmount,
                action: "marked_completed"
              });
              
              console.log(`✅ Fixed welcome packet order for parent ${parent._id}: ${order.stripeSessionId}`);
            } else {
              results.push({
                parentId: parent._id,
                sessionId: order.stripeSessionId,
                amount: order.totalAmount,
                action: "still_pending",
                stripeStatus: session.status,
                paymentStatus: session.payment_status
              });
            }
          } catch (error) {
            console.error(`❌ Error checking session ${order.stripeSessionId}:`, error);
            results.push({
              parentId: parent._id,
              sessionId: order.stripeSessionId,
              amount: order.totalAmount,
              action: "error_checking",
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
        }
      }
      
      // Save parent if any changes were made
      if (parent.isModified()) {
        await parent.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} welcome packet orders`,
      fixedCount,
      totalChecked: results.length,
      results
    });

  } catch (error) {
    console.error("Fix welcome packets error:", error);
    return NextResponse.json({ 
      error: "Failed to fix welcome packets",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}