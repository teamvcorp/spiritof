import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Child } from '@/models/Child';
import { Parent } from '@/models/Parent';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.parentId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const { childId, itemTitle, itemDescription, itemUrl } = await request.json();

  if (!childId || !itemTitle) {
    return NextResponse.json({ 
      error: 'Child ID and item title are required' 
    }, { status: 400 });
  }

  try {
    // Find the child and parent
    const child = await Child.findById(childId);
    const parent = await Parent.findById(session.parentId);

    if (!child || !parent) {
      return NextResponse.json({ error: 'Child or parent not found' }, { status: 404 });
    }

    // Check if child belongs to this parent
    if (!parent.children.includes(childId)) {
      return NextResponse.json({ error: 'Unauthorized access to child' }, { status: 403 });
    }

    // Check if child has enough magic points
    if (child.score365 < 5) {
      return NextResponse.json({ 
        error: 'Not enough magic points. You need 5 magic points to request a new item.',
        required: 5,
        current: child.score365
      }, { status: 400 });
    }

    // Deduct 5 magic points
    child.score365 -= 5;
    
    // Add a simple note to track the request (optional)
    // This could be expanded to a proper ledger system later
    
    await child.save();

    // Send email to "Santa" (admin)
    const requestData = {
      childName: child.displayName,
      itemTitle,
      itemDescription: itemDescription || '',
      itemUrl: itemUrl || '',
      requestedAt: new Date(),
      parentEmail: session.user?.email
    };

    // You can implement email sending here using your preferred service
    // For now, we'll just log it
    console.log('🎅 New Item Request for Santa:', requestData);

    // TODO: Implement actual email sending
    // await sendEmailToSanta(requestData);

    return NextResponse.json({
      success: true,
      message: 'Your request has been sent to Santa! 🎅',
      remainingMagicPoints: child.score365,
      pointsUsed: 5
    });

  } catch (error) {
    console.error('Error processing item request:', error);
    return NextResponse.json({ 
      error: 'Failed to process request' 
    }, { status: 500 });
  }
}