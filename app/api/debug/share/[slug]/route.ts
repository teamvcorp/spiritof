import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Child } from '@/models/Child';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    console.log('🔍 Debug share page for slug:', slug);
    
    // Test database connection
    await dbConnect();
    console.log('✅ Database connected');
    
    // Look for the child
    const child = await Child.findOne({ shareSlug: slug }).lean();
    console.log('👶 Child found:', !!child);
    
    if (!child) {
      return NextResponse.json({
        error: 'Child not found',
        slug: slug,
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }
    
    return NextResponse.json({
      status: 'success',
      child: {
        id: child._id,
        displayName: child.displayName,
        shareSlug: child.shareSlug,
        score365: child.score365,
        donationsEnabled: child.donationsEnabled,
        neighborBalanceCents: child.neighborBalanceCents,
        donorTotals: child.donorTotals
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🔥 Debug share error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}