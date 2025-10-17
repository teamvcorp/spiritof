import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Child } from '@/models/Child';
import { Parent } from '@/models/Parent';
import { MasterCatalog } from '@/models/MasterCatalog';
import { notifySpecialRequest } from '@/lib/admin-notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { childId, giftId, reason, requestedPoints } = await request.json();

    if (!childId || !giftId || !reason || !requestedPoints) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the child
    const child = await Child.findById(childId);
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Get the parent and check permissions
    const parent = await Parent.findById(child.parentId);
    if (!parent || parent.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to child' }, { status: 403 });
    }

    // Check if early gifts are enabled
    if (!parent.christmasSettings?.allowEarlyGifts) {
      return NextResponse.json({ error: 'Early gifts are not enabled' }, { status: 400 });
    }

    // Verify the gift exists and is in child's list
    const gift = await MasterCatalog.findById(giftId);
    if (!gift) {
      return NextResponse.json({ error: 'Gift not found in master catalog' }, { status: 404 });
    }

    // Check if the gift is in the child's gift list
    const giftInList = child.giftList.some(g => g.toString() === giftId.toString());
    if (!giftInList) {
      console.log('Gift verification failed:', {
        giftId,
        giftIdType: typeof giftId,
        childGiftList: child.giftList.map(g => ({ id: g.toString(), type: typeof g })),
        childId: child._id
      });
      return NextResponse.json({ error: 'Gift not in child\'s gift list' }, { status: 400 });
    }

    // Calculate total magic points (parent votes + neighbor donations)
    const neighborMagicPoints = Math.floor((child.neighborBalanceCents || 0) / 100);
    const totalMagicPoints = (child.score365 || 0) + neighborMagicPoints;

    // Check if child has enough magic points
    if (totalMagicPoints < requestedPoints) {
      return NextResponse.json({ 
        error: `Not enough magic points. Need ${requestedPoints}, have ${totalMagicPoints}` 
      }, { status: 400 });
    }

    // Validate gift has required fields
    if (!gift.price || !gift.imageUrl) {
      return NextResponse.json({ error: 'Gift missing required data' }, { status: 400 });
    }

    // Create early gift request - needs parent approval
    const earlyGiftRequest = {
      giftId,
      giftTitle: gift.title,
      giftPrice: gift.price,
      giftImageUrl: gift.imageUrl || "/images/christmasMagic.png",
      reason,
      requestedPoints,
      requestedAt: new Date(),
      status: 'pending' as const
    };

    // Add to child's early gift requests
    if (!child.earlyGiftRequests) {
      child.earlyGiftRequests = [];
    }
    
    console.log('🎁 Before push - earlyGiftRequests length:', child.earlyGiftRequests.length);
    child.earlyGiftRequests.push(earlyGiftRequest);
    console.log('🎁 After push - earlyGiftRequests length:', child.earlyGiftRequests.length);
    console.log('🎁 Request data:', earlyGiftRequest);

    // Don't deduct magic points yet - only deduct when parent approves the request
    // Points will be deducted during parent approval in the parent dashboard API

    // Mark the field as modified to ensure Mongoose saves it
    child.markModified('earlyGiftRequests');
    
    await child.save();
    
    console.log('✅ Child saved. Verifying save by re-fetching...');
    const verifyChild = await Child.findById(childId).lean();
    console.log('🔍 Verified earlyGiftRequests count:', verifyChild?.earlyGiftRequests?.length || 0);
    console.log('🔍 All requests:', verifyChild?.earlyGiftRequests);

    // Send admin notification for logistics
    try {
      await notifySpecialRequest(
        'early_gift',
        child.displayName,
        gift.title,
        session.user?.email || ''
      );
      console.log('📧 Admin notification sent for early gift request');
    } catch (emailError) {
      console.error('❌ Failed to send admin notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Early gift request submitted! Waiting for parent approval. Magic points will be deducted once approved.',
      remainingPoints: totalMagicPoints // Return current points (not deducted yet)
    });

  } catch (error) {
    console.error('Early gift request error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}