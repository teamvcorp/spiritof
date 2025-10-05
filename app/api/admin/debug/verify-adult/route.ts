import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Parent } from "@/models/Parent";

export async function GET() {
  try {
    console.log('🔍 Starting debug verification...');
    
    // Test 1: Auth and Admin verification
    const session = await auth();
    console.log('🔐 Session check:', { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email 
    });

    if (!session?.user?.id) {
      return NextResponse.json({
        step: 'auth',
        error: 'No session or user ID',
        details: { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userId: session?.user?.id 
        }
      }, { status: 401 });
    }

    // Test 2: Database and Admin check
    console.log('🔗 Testing database connection...');
    await dbConnect();
    
    const user = await User.findById(session.user.id).lean();
    console.log('👤 User lookup result:', !!user);

    if (!user) {
      return NextResponse.json({
        step: 'database',
        error: 'User not found in database',
        userId: session.user.id
      }, { status: 404 });
    }

    // Verify admin status
    if (!user.admin) {
      return NextResponse.json({
        step: 'authorization',
        error: 'Admin access required',
        userId: session.user.id
      }, { status: 403 });
    }

    // Test 3: Check existing parent
    const existingParent = await Parent.findOne({ 
      email: user.email, 
      stripeCustomerId: { $exists: true, $ne: null } 
    }).lean();
    console.log('👨‍👩‍👧‍👦 Existing parent check:', !!existingParent);

    // Test 4: Stripe connection
    console.log('💳 Testing Stripe connection...');
    const testStripe = await stripe.customers.list({ limit: 1 });
    console.log('✅ Stripe test successful, found customers:', testStripe.data.length);

    // Test 5: Environment variables
    const envCheck = {
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasMongoUri: !!process.env.MONGODB_URI,
      vercelEnv: process.env.VERCEL_ENV,
      nodeEnv: process.env.NODE_ENV
    };

    return NextResponse.json({
      status: 'success',
      session: {
        userId: session.user.id,
        email: session.user.email
      },
      user: {
        found: !!user,
        email: user?.email
      },
      existingParent: {
        found: !!existingParent,
        hasStripeId: !!(existingParent?.stripeCustomerId)
      },
      stripe: {
        connected: true,
        customerCount: testStripe.data.length
      },
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔥 Debug verification error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}