import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Child } from '@/models/Child';
import { Parent } from '@/models/Parent';
import { ToyRequest } from '@/models/ToyRequest';
import { notifyToyRequest } from '@/lib/admin-notifications';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
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
    // Find the parent by userId and the child
    const parent = await Parent.findOne({ userId: session.user.id });
    const child = await Child.findById(childId);

    if (!child || !parent) {
      return NextResponse.json({ error: 'Child or parent not found' }, { status: 404 });
    }

    // Check if child belongs to this parent
    if (child.parentId.toString() !== parent._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized access to child' }, { status: 403 });
    }

    // Check if child has enough magic points
    if (child.score365 < 1) {
      return NextResponse.json({ 
        error: 'Not enough magic points. You need 1 magic point to request a new item.',
        required: 1,
        current: child.score365
      }, { status: 400 });
    }

    // Deduct 1 magic point
    child.score365 -= 1;
    await child.save();

    // Save the request to database
    const toyRequest = await ToyRequest.create({
      childId: child._id,
      childName: child.displayName,
      parentId: parent._id,
      parentEmail: session.user?.email,
      itemTitle,
      itemDescription: itemDescription || '',
      itemUrl: itemUrl || '',
      magicPointsUsed: 1,
      status: 'PENDING'
    });

    console.log('🎅 New Toy Request Saved:', {
      requestId: toyRequest._id,
      childName: child.displayName,
      itemTitle,
      requestedAt: toyRequest.requestedAt
    });

    // Send admin notification email
    try {
      await notifyToyRequest(
        child.displayName,
        itemTitle,
        session.user?.email || '',
        toyRequest._id.toString()
      );
      console.log('📧 Admin notification sent for toy request');
    } catch (emailError) {
      console.error('❌ Failed to send admin notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Your request has been sent to Santa! 🎅',
      remainingMagicPoints: child.score365,
      pointsUsed: 1,
      requestId: toyRequest._id
    });

  } catch (error) {
    console.error('Error processing item request:', error);
    return NextResponse.json({ 
      error: 'Failed to process request' 
    }, { status: 500 });
  }
}