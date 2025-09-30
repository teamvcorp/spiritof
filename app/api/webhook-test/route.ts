import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🧪 Webhook test endpoint hit!');
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  try {
    const body = await req.text();
    console.log('Body:', body);
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      message: 'Webhook test endpoint working'
    });
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook test endpoint is active',
    timestamp: new Date().toISOString()
  });
}