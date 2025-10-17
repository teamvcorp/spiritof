import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import {Child} from "@/models/Child";
import {Parent} from "@/models/Parent";
import {MasterCatalog} from "@/models/MasterCatalog";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.parentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const parent = await Parent.findById(session.parentId);
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Get all children for this parent
    const children = await Child.find({ parentId: parent._id });
    
    console.log('👨‍👩‍👧‍👦 Found children count:', children.length);

    // Collect all pending requests from all children
    const allRequests: any[] = [];

    for (const child of children) {
      console.log(`\n🧒 Child: ${child.displayName} (${child._id})`);
      console.log('  📦 earlyGiftRequests array:', child.earlyGiftRequests);
      console.log('  📦 earlyGiftRequests length:', child.earlyGiftRequests?.length || 0);
      console.log('  💝 friendGiftRequests array:', child.friendGiftRequests);
      console.log('  💝 friendGiftRequests length:', child.friendGiftRequests?.length || 0);
      
      // Early gift requests (pending status)
      const pendingEarlyGifts = child.earlyGiftRequests?.filter(
        (req) => req.status === 'pending'
      ) || [];
      
      console.log('  ⏳ Pending early gifts:', pendingEarlyGifts.length);

      for (const request of pendingEarlyGifts) {
        const catalogItem = await MasterCatalog.findById(request.giftId);
        
        allRequests.push({
          requestId: request._id?.toString() || '',
          childId: child._id.toString(),
          childName: child.displayName,
          type: 'early_gift',
          giftTitle: catalogItem?.title || request.giftTitle || 'Unknown Item',
          giftPrice: catalogItem?.price || request.giftPrice || 0,
          giftImageUrl: catalogItem?.imageUrl || request.giftImageUrl,
          reason: request.reason,
          requestedPoints: request.requestedPoints,
          requestedAt: request.requestedAt,
          status: request.status
        });
      }

      // Friend gift requests (pending status)
      const pendingFriendGifts = child.friendGiftRequests?.filter(
        (req) => req.status === 'pending'
      ) || [];
      
      console.log('  ⏳ Pending friend gifts:', pendingFriendGifts.length);

      for (const request of pendingFriendGifts) {
        const catalogItem = await MasterCatalog.findById(request.giftId);
        
        allRequests.push({
          requestId: request._id?.toString() || '',
          childId: child._id.toString(),
          childName: child.displayName,
          type: 'friend_gift',
          giftTitle: catalogItem?.title || request.giftTitle || 'Unknown Item',
          giftPrice: catalogItem?.price || request.giftPrice || 0,
          giftImageUrl: catalogItem?.imageUrl || request.giftImageUrl,
          friendName: request.friendName,
          friendAddress: request.friendAddress,
          message: request.message,
          requestedPoints: request.requestedPoints,
          requestedAt: request.requestedAt,
          status: request.status
        });
      }
    }

    // Sort by most recent first
    allRequests.sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
    
    console.log('\n📊 Total pending requests found:', allRequests.length);
    console.log('📋 Request types:', {
      earlyGifts: allRequests.filter(r => r.type === 'early_gift').length,
      friendGifts: allRequests.filter(r => r.type === 'friend_gift').length
    });

    return NextResponse.json({ 
      requests: allRequests,
      count: allRequests.length
    });

  } catch (error) {
    console.error("Error fetching special requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch special requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.parentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { action, childId, requestId, requestType, parentResponse } = await req.json();

    if (!action || !childId || !requestId || !requestType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const child = await Child.findById(childId);
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Verify parent owns this child
    const parent = await Parent.findById(session.parentId);
    if (!parent || child.parentId.toString() !== parent._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (requestType === 'early_gift') {
      const request = child.earlyGiftRequests?.find(r => r._id?.toString() === requestId);
      if (!request) {
        return NextResponse.json({ error: "Early gift request not found" }, { status: 404 });
      }

      if (action === 'approve') {
        request.status = 'approved';
        request.respondedAt = new Date();
        if (parentResponse) {
          request.parentResponse = parentResponse;
        }
        
        // Deduct magic points now that parent approved
        const requestedPoints = request.requestedPoints;
        const parentVotes = child.score365 || 0;
        const neighborCents = child.neighborBalanceCents || 0;
        
        if (requestedPoints <= parentVotes) {
          child.score365 -= requestedPoints;
        } else {
          const remainingAfterParentVotes = requestedPoints - parentVotes;
          const neighborPointsNeeded = remainingAfterParentVotes * 100;
          child.score365 = 0;
          child.neighborBalanceCents -= neighborPointsNeeded;
        }
      } else if (action === 'deny') {
        request.status = 'denied';
        request.respondedAt = new Date();
        if (parentResponse) {
          request.parentResponse = parentResponse;
        }
        // No need to refund - points weren't deducted yet
      }
    } else if (requestType === 'friend_gift') {
      const request = child.friendGiftRequests?.find(r => r._id?.toString() === requestId);
      if (!request) {
        return NextResponse.json({ error: "Friend gift request not found" }, { status: 404 });
      }

      if (action === 'approve') {
        request.status = 'approved';
        request.respondedAt = new Date();
        if (parentResponse) {
          request.parentResponse = parentResponse;
        }
        
        // Deduct magic points now that parent approved
        const requestedPoints = request.requestedPoints;
        const parentVotes = child.score365 || 0;
        const neighborCents = child.neighborBalanceCents || 0;
        
        if (requestedPoints <= parentVotes) {
          child.score365 -= requestedPoints;
        } else {
          const remainingAfterParentVotes = requestedPoints - parentVotes;
          const neighborPointsNeeded = remainingAfterParentVotes * 100;
          child.score365 = 0;
          child.neighborBalanceCents -= neighborPointsNeeded;
        }
      } else if (action === 'deny') {
        request.status = 'denied';
        request.respondedAt = new Date();
        if (parentResponse) {
          request.parentResponse = parentResponse;
        }
        // No need to refund - points weren't deducted yet
      }
    }

    await child.save();

    return NextResponse.json({ 
      success: true, 
      message: `Request ${action}d successfully` 
    });

  } catch (error) {
    console.error("Error processing special request action:", error);
    return NextResponse.json(
      { error: "Failed to process request action" },
      { status: 500 }
    );
  }
}