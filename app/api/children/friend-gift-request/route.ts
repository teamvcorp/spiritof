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

    // Create friend gift request - needs parent approval
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
      status: 'pending' as const
    };

    // Add to child's friend gift requests
    if (!child.friendGiftRequests) {
      child.friendGiftRequests = [];
    }
    
    console.log('💝 Before push - friendGiftRequests length:', child.friendGiftRequests.length);
    child.friendGiftRequests.push(friendGiftRequest);
    console.log('💝 After push - friendGiftRequests length:', child.friendGiftRequests.length);
    console.log('💝 Request data:', friendGiftRequest);

    // Don't deduct magic points yet - only deduct when parent approves the request
    // Points will be deducted during parent approval in the parent dashboard API

    // Mark the field as modified to ensure Mongoose saves it
    child.markModified('friendGiftRequests');
    
    await child.save();
    
    console.log('✅ Child saved. Verifying save by re-fetching...');
    const verifyChild = await Child.findById(childId).lean();
    console.log('🔍 Verified friendGiftRequests count:', verifyChild?.friendGiftRequests?.length || 0);
    console.log('🔍 All requests:', verifyChild?.friendGiftRequests);

    // Send admin notification for logistics
    try {
      await notifySpecialRequest(
        'friend_gift',
        child.displayName,
        gift.title,
        session.user?.email || ''
      );
      console.log('📧 Admin notification sent for friend gift request');
    } catch (emailError) {
      console.error('❌ Failed to send admin notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Friend gift request submitted! Waiting for parent approval. Magic points will be deducted once approved.',
      remainingPoints: totalMagicPoints // Return current points (not deducted yet)
    });

  } catch (error) {
    console.error('Friend gift request error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}