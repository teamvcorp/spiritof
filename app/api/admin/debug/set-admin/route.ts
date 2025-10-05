import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Update the current user to be an admin
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { admin: true },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "User set as admin successfully",
      admin: user.admin,
      email: user.email 
    });

  } catch (error) {
    console.error("Set admin error:", error);
    return NextResponse.json(
      { error: "Failed to set admin status" },
      { status: 500 }
    );
  }
}