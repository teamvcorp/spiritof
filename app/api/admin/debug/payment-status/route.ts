import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { User } from "@/models/User";
import { stripe } from "@/lib/stripe";
import { Types } from "mongoose";

export async function GET() {
  try {
    // Verify admin access
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user?.admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get parent for debugging
    const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    const debugInfo: any = {
      parentId: parent._id.toString(),
      email: parent.email,
      stripeCustomerId: parent.stripeCustomerId || null,
      stripeDefaultPaymentMethodId: parent.stripeDefaultPaymentMethodId || null,
      hasChristmasSettings: !!parent.christmasSettings,
      setupCompleted: parent.christmasSettings?.setupCompleted || false,
    };

    // Check Stripe customer and payment methods
    if (parent.stripeCustomerId) {
      try {
        // Get customer info
        const customer = await stripe.customers.retrieve(parent.stripeCustomerId);
        
        // Check if customer is not deleted
        if (!customer.deleted) {
          debugInfo.stripeCustomer = {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            defaultPaymentMethod: customer.invoice_settings?.default_payment_method || null,
          };

          // List payment methods
          const paymentMethods = await stripe.paymentMethods.list({
            customer: parent.stripeCustomerId,
            type: 'card',
          });

          debugInfo.paymentMethods = paymentMethods.data.map(pm => ({
            id: pm.id,
            last4: pm.card?.last4,
            brand: pm.card?.brand,
            exp_month: pm.card?.exp_month,
            exp_year: pm.card?.exp_year,
            created: new Date(pm.created * 1000).toISOString(),
          }));

          // Check setup intents
          const setupIntents = await stripe.setupIntents.list({
            customer: parent.stripeCustomerId,
            limit: 5,
          });

          debugInfo.recentSetupIntents = setupIntents.data.map(si => ({
            id: si.id,
            status: si.status,
            payment_method: si.payment_method,
            created: new Date(si.created * 1000).toISOString(),
          }));
        } else {
          debugInfo.stripeError = "Customer has been deleted";
        }

      } catch (stripeError) {
        debugInfo.stripeError = stripeError instanceof Error ? stripeError.message : String(stripeError);
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Payment debug error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}