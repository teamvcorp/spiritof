import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();
    
    // Get the user email from the request body
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find and update the user
    const user = await User.findOneAndUpdate(
      { email: email },
      { admin: true },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${email} is now an admin`,
      user: {
        email: user.email,
        admin: user.admin
      }
    });

  } catch (error) {
    console.error("Make admin error:", error);
    return NextResponse.json(
      { error: "Failed to update user admin status" },
      { status: 500 }
    );
  }
}