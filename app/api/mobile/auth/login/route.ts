// Mobile login endpoint
import { NextRequest } from 'next/server';
import { MobileAuthService, MobileApiResponse } from '@/lib/mobile-auth';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';
import { Parent } from '@/models/Parent';

interface LoginRequest {
  email: string;
  password?: string;
  provider?: 'google' | 'email';
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body: LoginRequest = await request.json();
    const { email } = body;

    if (!email) {
      return MobileApiResponse.error('Email is required', 400);
    }

    // For now, we'll use a simple email-based authentication
    // In production, you might want to integrate with NextAuth more directly
    const user = await User.findOne({ email });
    
    if (!user) {
      return MobileApiResponse.error('User not found', 404);
    }

    // Get parent profile if user is onboarded
    let parent = null;
    if (user.isParentOnboarded && user.parentId) {
      parent = await Parent.findById(user.parentId);
    }

    // Generate JWT tokens for mobile
    const tokens = MobileAuthService.generateTokens({
      id: user._id.toString(),
      email: user.email,
      parentId: parent?._id.toString(),
    });

    const response = {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
        isParentOnboarded: user.isParentOnboarded,
        parentId: parent?._id.toString(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    };

    return MobileApiResponse.success(response);
  } catch (error) {
    console.error('Mobile login error:', error);
    return MobileApiResponse.error('Login failed', 500);
  }
}

export async function OPTIONS() {
  return MobileApiResponse.success({}, 200);
}