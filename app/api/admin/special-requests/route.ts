import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { Types } from "mongoose";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await dbConnect();

    // Check if user is admin
    const user = await User.findById(session.user.id).lean();
    if (!user?.admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get all children with early gift requests or friend gift requests
    const childrenWithRequests = await Child.find({
      $or: [
        { "earlyGiftRequests.0": { $exists: true } },
        { "friendGiftRequests.0": { $exists: true } }
      ]
    })
    .populate({
      path: 'parentId',
      select: 'displayName email christmasSettings',
      model: Parent
    })
    .lean();

    const requestsData = [];

    for (const child of childrenWithRequests) {
      const parent = child.parentId as any;
      
      // Process early gift requests
      if (child.earlyGiftRequests?.length) {
        for (const request of child.earlyGiftRequests) {
          if (request.status === 'pending') {
            requestsData.push({
              type: 'early_gift',
              requestId: request._id,
              childId: child._id,
              childName: child.displayName,
              parentName: parent.displayName,
              parentEmail: parent.email,
              giftTitle: request.giftTitle,
              giftPrice: request.giftPrice,
              giftImageUrl: request.giftImageUrl,
              reason: request.reason,
              requestedPoints: request.requestedPoints,
              requestedAt: request.requestedAt,
              status: request.status,
              shippingAddress: parent.christmasSettings?.shippingAddress || null
            });
          }
        }
      }

      // Process friend gift requests
      if (child.friendGiftRequests?.length) {
        for (const request of child.friendGiftRequests) {
          if (request.status === 'pending') {
            requestsData.push({
              type: 'friend_gift',
              requestId: request._id,
              childId: child._id,
              childName: child.displayName,
              parentName: parent.displayName,
              parentEmail: parent.email,
              giftTitle: request.giftTitle,
              giftPrice: request.giftPrice,
              giftImageUrl: request.giftImageUrl,
              friendName: request.friendName,
              friendAddress: request.friendAddress,
              message: request.message,
              requestedPoints: request.requestedPoints,
              requestedAt: request.requestedAt,
              status: request.status,
              shippingAddress: null // Friend gifts ship to friend's address
            });
          }
        }
      }
    }

    // Sort by request date (newest first)
    requestsData.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    const stats = {
      totalRequests: requestsData.length,
      earlyGiftRequests: requestsData.filter(r => r.type === 'early_gift').length,
      friendGiftRequests: requestsData.filter(r => r.type === 'friend_gift').length,
      totalValue: requestsData.reduce((sum, r) => sum + (r.giftPrice || 0), 0)
    };

    return NextResponse.json({
      requests: requestsData,
      stats
    });

  } catch (error) {
    console.error("❌ Special requests error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch special requests",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await dbConnect();

    // Check if user is admin
    const user = await User.findById(session.user.id).lean();
    if (!user?.admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { action, childId, requestId, requestType } = await req.json();

    if (!action || !childId || !requestId || !requestType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const child = await Child.findById(childId);
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    if (requestType === 'early_gift') {
      const request = child.earlyGiftRequests?.find(r => r._id?.toString() === requestId);
      if (!request) {
        return NextResponse.json({ error: "Early gift request not found" }, { status: 404 });
      }

      if (action === 'approve') {
        request.status = 'approved';
        request.respondedAt = new Date();
      } else if (action === 'deny') {
        request.status = 'denied';
        request.respondedAt = new Date();
        // Refund magic points
        child.score365 += request.requestedPoints;
      }
    } else if (requestType === 'friend_gift') {
      const request = child.friendGiftRequests?.find(r => r._id?.toString() === requestId);
      if (!request) {
        return NextResponse.json({ error: "Friend gift request not found" }, { status: 404 });
      }

      if (action === 'approve') {
        request.status = 'approved';
        request.respondedAt = new Date();
      } else if (action === 'deny') {
        request.status = 'denied';
        request.respondedAt = new Date();
        // Refund magic points
        child.score365 += request.requestedPoints;
      }
    }

    await child.save();

    return NextResponse.json({ 
      success: true, 
      message: `Request ${action}d successfully` 
    });

  } catch (error) {
    console.error("❌ Special requests action error:", error);
    return NextResponse.json({ 
      error: "Failed to process request action",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}