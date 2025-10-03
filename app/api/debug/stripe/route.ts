import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';

export async function GET() {
  try {
    // Test auth
    const session = await auth();
    console.log('🔐 Session:', { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      userId: session?.user?.id 
    });

    // Test database connection
    await dbConnect();
    console.log('🔗 Database connected');

    // Test Stripe connection
    const testCustomer = await stripe.customers.list({ limit: 1 });
    console.log('💳 Stripe connected, customer count:', testCustomer.data.length);

    // Test environment variables
    const envCheck = {
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasMongoUri: !!process.env.MONGODB_URI,
      baseUrl: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
      vercelEnv: process.env.VERCEL_ENV,
    };

    return NextResponse.json({
      status: 'success',
      session: session ? { userId: session.user?.id, email: session.user?.email } : null,
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔥 Debug error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}