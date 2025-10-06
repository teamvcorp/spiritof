import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { z } from "zod";
import { notifyNewUser } from "@/lib/admin-notifications";

const SignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    await dbConnect();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ 
        error: "User already exists with this email" 
      }, { status: 409 });
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      authProvider: "credentials",
      isParentOnboarded: false,
    });

    // Send notification for new user registration (email/password)
    try {
      await notifyNewUser(
        name,
        email,
        'credentials'
      );
      console.log('📧 Admin notification sent for new credentials user');
    } catch (emailError) {
      console.error('❌ Failed to send new user notification:', emailError);
      // Don't fail user creation if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: "Account created successfully! You can now sign in.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ 
      error: "Failed to create account" 
    }, { status: 500 });
  }
}