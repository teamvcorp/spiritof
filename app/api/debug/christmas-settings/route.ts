import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Types } from "mongoose";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await dbConnect();

    const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Return the raw parent document for debugging
    return NextResponse.json({
      success: true,
      debug: {
        parentId: parent._id,
        hasChristmasSettings: !!parent.christmasSettings,
        christmasSettings: parent.christmasSettings,
        setupCompleted: parent.christmasSettings?.setupCompleted,
        setupCompletedAt: parent.christmasSettings?.setupCompletedAt,
        // Show the full structure for debugging
        fullChristmasSettings: JSON.stringify(parent.christmasSettings, null, 2)
      }
    });

  } catch (error) {
    console.error("Debug Christmas settings error:", error);
    return NextResponse.json(
      { 
        error: "Failed to debug Christmas settings", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}