import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Child } from '@/models/Child';
import { Parent } from '@/models/Parent';
import { MasterCatalog } from '@/models/MasterCatalog';

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

    // Create early gift request - auto-approved since parents already approved the gift
    const earlyGiftRequest = {
      giftId,
      giftTitle: gift.title,
      giftPrice: gift.price,
      giftImageUrl: gift.imageUrl || "/images/christmasMagic.png",
      reason,
      requestedPoints,
      requestedAt: new Date(),
      status: 'approved' as const,
      type: 'early_gift' as const,
      approvedAt: new Date(),
      approvedBy: 'auto-approved' // Since gift was already parent-approved in setup
    };

    // Add to child's early gift requests
    if (!child.earlyGiftRequests) {
      child.earlyGiftRequests = [];
    }
    child.earlyGiftRequests.push(earlyGiftRequest);

    // Deduct magic points (prioritize parent votes first, then neighbor donations)
    const parentVotes = child.score365 || 0;
    const neighborCents = child.neighborBalanceCents || 0;
    
    if (requestedPoints <= parentVotes) {
      // Can deduct entirely from parent votes
      child.score365 -= requestedPoints;
    } else {
      // Need to deduct from both parent votes and neighbor donations
      const remainingAfterParentVotes = requestedPoints - parentVotes;
      const neighborPointsNeeded = remainingAfterParentVotes * 100;
      
      // Ensure we don't go negative
      if (neighborCents >= neighborPointsNeeded) {
        child.score365 = 0;
        child.neighborBalanceCents -= neighborPointsNeeded;
      } else {
        // This shouldn't happen due to validation, but safety check
        throw new Error('Insufficient magic points');
      }
    }

    await child.save();

    // Calculate remaining total points for response
    const newNeighborMagicPoints = Math.floor((child.neighborBalanceCents || 0) / 100);
    const newTotalMagicPoints = (child.score365 || 0) + newNeighborMagicPoints;

    return NextResponse.json({ 
      success: true, 
      message: 'Early gift request approved! Your gift has been sent to Santa\'s workshop for processing.',
      remainingPoints: newTotalMagicPoints
    });

  } catch (error) {
    console.error('Early gift request error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}