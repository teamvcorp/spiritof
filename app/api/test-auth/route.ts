import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    
    // Find all credentials users
    const credentialsUsers = await User.find({ 
      authProvider: "credentials" 
    }).select("email name authProvider createdAt");
    
    return NextResponse.json({
      count: credentialsUsers.length,
      users: credentialsUsers
    });
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    await dbConnect();
    
    // Test user lookup and password verification
    const user = await User.findOne({ 
      email,
      authProvider: "credentials"
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const isValid = await user.comparePassword(password);
    
    return NextResponse.json({
      userFound: true,
      hasPassword: !!user.password,
      passwordValid: isValid,
      userId: user._id
    });
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json({ error: "Test failed" }, { status: 500 });
  }
}