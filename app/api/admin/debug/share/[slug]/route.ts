import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Child } from '@/models/Child';
import { User } from '@/models/User';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
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
    
    console.log('🔍 Debug share page for slug:', slug);
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