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

    const { childId, giftId, friendName, friendAddress, message, requestedPoints } = await request.json();

    if (!childId || !giftId || !friendName || !friendAddress || !message || !requestedPoints) {
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

    // Check if friend gifts are enabled
    if (!parent.christmasSettings?.allowFriendGifts) {
      return NextResponse.json({ error: 'Friend gifts are not enabled' }, { status: 400 });
    }

    // Verify the gift exists
    const gift = await MasterCatalog.findById(giftId);
    if (!gift) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    // Validate gift has required fields
    if (!gift.price || !gift.imageUrl) {
      return NextResponse.json({ error: 'Gift missing required data' }, { status: 400 });
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

    // Validate gift price doesn't exceed friend gift limit
    const maxFriendGiftPrice = parent.christmasSettings?.maxFriendGiftValue || 50;
    if (gift.price > maxFriendGiftPrice) {
      return NextResponse.json({ 
        error: `Gift price $${gift.price} exceeds friend gift limit of $${maxFriendGiftPrice}` 
      }, { status: 400 });
    }

    // Create friend gift request - auto-approved since parents enabled friend gifts
    const friendGiftRequest = {
      giftId,
      giftTitle: gift.title,
      giftPrice: gift.price,
      giftImageUrl: gift.imageUrl || "/images/christmasMagic.png",
      friendName,
      friendAddress,
      message,
      requestedPoints,
      requestedAt: new Date(),
      status: 'approved' as const,
      type: 'friend_gift' as const,
      approvedAt: new Date(),
      approvedBy: 'auto-approved' // Since friend gifts are parent-enabled
    };

    // Add to child's friend gift requests
    if (!child.friendGiftRequests) {
      child.friendGiftRequests = [];
    }
    child.friendGiftRequests.push(friendGiftRequest);

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
      message: 'Friend gift approved! Santa\'s workshop will send it to your friend soon.',
      remainingPoints: newTotalMagicPoints
    });

  } catch (error) {
    console.error('Friend gift request error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}