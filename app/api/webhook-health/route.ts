import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhook_url: `${process.env.NEXTAUTH_URL}/api/stripe/webhook`,
    environment: process.env.NODE_ENV,
    stripe_mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test'
  });
}

export async function POST(req: NextRequest) {
  // Simple health check that accepts any POST
  const body = await req.text();
  console.log('Webhook health check received:', body.slice(0, 100));
  
  return NextResponse.json({
    received: true,
    timestamp: new Date().toISOString(),
    body_length: body.length
  });
}