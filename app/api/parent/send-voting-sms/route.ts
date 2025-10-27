import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { User } from "@/models/User";
import { sendVotingSMS, formatPhoneNumber } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await dbConnect();

    // Get user's parentId
    const user = await User.findById(session.user.id).select("parentId").lean();
    if (!user?.parentId) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    const parent = await Parent.findById(user.parentId).lean();
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    if (!parent.phone) {
      return NextResponse.json({ 
        error: "No phone number on file. Please add your phone number in settings." 
      }, { status: 400 });
    }

    // Format and send SMS
    const formattedPhone = formatPhoneNumber(parent.phone);
    const result = await sendVotingSMS({
      to: formattedPhone,
      parentId: parent._id.toString(),
      parentName: parent.name,
    });

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || "Failed to send SMS" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Voting link sent to your phone!",
      messageId: result.messageId,
    });

  } catch (error) {
    console.error("Send voting SMS error:", error);
    return NextResponse.json(
      { 
        error: "Failed to send SMS",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
