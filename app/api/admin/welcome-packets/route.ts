import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";

export async function GET(req: NextRequest) {
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

    console.log("📦 Admin: Fetching welcome packet orders...");

    // Find all parents with welcome packet orders (both pending and shipped)
    const parentsWithPackets = await Parent.find({
      "welcomePacketOrders": { $exists: true, $ne: [] }
    }).populate({
      path: "children",
      select: "displayName avatarUrl createdAt"
    }).lean();

    console.log(`📊 Found ${parentsWithPackets.length} parents with welcome packet orders`);

    // Transform the data for admin view
    const welcomePacketData = parentsWithPackets.map(parent => {
      // Get all welcome packet orders (both pending and completed, shipped and unshipped)
      const allOrders = parent.welcomePacketOrders?.filter(order => 
        order.status === "completed" || order.status === "pending"
      ) || [];

      return allOrders.map(order => ({
        parentId: parent._id.toString(),
        parentName: parent.name,
        parentEmail: parent.email,
        order: {
          orderId: order._id?.toString(),
          selectedItems: order.selectedItems || [],
          totalAmount: order.totalAmount || 0,
          createdAt: order.createdAt,
          status: order.status,
          shipped: order.shipped || false,
          shippedAt: order.shippedAt,
          trackingNumber: order.trackingNumber,
          shippingAddress: order.shippingAddress,
          childId: order.childId?.toString(),
          childName: order.childName,
          isForSpecificChild: !!order.childId // Flag to indicate if this is for a specific child
        },
        children: parent.children?.map((child: any) => ({
          childId: child._id.toString(),
          name: child.displayName,
          avatarUrl: child.avatarUrl,
          addedAt: child.createdAt
        })) || [],
        childrenCount: parent.children?.length || 0
      }));
    }).flat(); // Flatten the array since we now have multiple orders per parent

    // Sort by order creation date (oldest first - FIFO for pending, newest first for shipped)
    welcomePacketData.sort((a, b) => {
      // Prioritize unshipped orders
      if (!a.order.shipped && b.order.shipped) return -1;
      if (a.order.shipped && !b.order.shipped) return 1;
      
      // Within same shipping status, sort by date
      const dateA = new Date(a.order.createdAt || 0).getTime();
      const dateB = new Date(b.order.createdAt || 0).getTime();
      
      if (a.order.shipped) {
        return dateB - dateA; // Newest first for shipped
      } else {
        return dateA - dateB; // Oldest first for pending
      }
    });

    // Calculate summary statistics
    const pendingOrders = welcomePacketData.filter(item => !item.order.shipped);
    const shippedOrders = welcomePacketData.filter(item => item.order.shipped);
    const totalRevenue = welcomePacketData.reduce((sum, item) => sum + item.order.totalAmount, 0);
    const uniqueParents = new Set(welcomePacketData.map(item => item.parentId)).size;
    const oldestPendingOrder = pendingOrders.length > 0 ? pendingOrders[0]?.order.createdAt : null;
    const newestOrder = welcomePacketData.length > 0 ? 
      [...welcomePacketData]
        .filter(item => item.order.createdAt) // Filter out items without createdAt
        .sort((a, b) => new Date(b.order.createdAt!).getTime() - new Date(a.order.createdAt!).getTime())[0]?.order.createdAt : null;

    return NextResponse.json({
      success: true,
      data: welcomePacketData,
      summary: {
        totalOrders: welcomePacketData.length,
        pendingOrders: pendingOrders.length,
        shippedOrders: shippedOrders.length,
        totalRevenue,
        uniqueParents,
        oldestPendingOrder,
        newestOrder
      }
    });

  } catch (error) {
    console.error("Welcome packet admin error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch welcome packet data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// Mark welcome packet as shipped
export async function PATCH(req: NextRequest) {
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

    const { parentId, orderId, trackingNumber, carrier } = await req.json();

    if (!parentId || !orderId) {
      return NextResponse.json({ 
        error: "Parent ID and Order ID are required" 
      }, { status: 400 });
    }

    console.log(`📦 Admin: Marking welcome packet as shipped - Parent: ${parentId}, Order: ${orderId}`);

    // Find the parent and update the specific welcome packet order
    const parent = await Parent.findById(parentId);
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Find the specific order
    const orderIndex = parent.welcomePacketOrders?.findIndex(order => 
      order._id?.toString() === orderId && order.status === "completed"
    );

    if (orderIndex === -1 || orderIndex === undefined) {
      return NextResponse.json({ error: "Welcome packet order not found" }, { status: 404 });
    }

    // Update the order as shipped
    const order = parent.welcomePacketOrders![orderIndex];
    order.shipped = true;
    order.shippedAt = new Date();
    if (trackingNumber) order.trackingNumber = trackingNumber;

    await parent.save();

    console.log(`✅ Admin: Welcome packet marked as shipped for parent ${parentId}`);

    return NextResponse.json({
      success: true,
      message: "Welcome packet marked as shipped",
      details: {
        parentId,
        orderId,
        shippedAt: order.shippedAt,
        trackingNumber: order.trackingNumber
      }
    });

  } catch (error) {
    console.error("Welcome packet shipping error:", error);
    return NextResponse.json({ 
      error: "Failed to mark welcome packet as shipped",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}