// Token refresh endpoint
import { NextRequest } from 'next/server';
import { MobileAuthService, MobileApiResponse } from '@/lib/mobile-auth';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';
import { Parent } from '@/models/Parent';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Extract refresh token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return MobileApiResponse.error('Refresh token required', 401);
    }
    
    const refreshToken = authHeader.substring(7);
    
    // Verify refresh token
    const payload = MobileAuthService.verifyRefreshToken(refreshToken);
    
    // Get updated user data
    const user = await User.findById(payload.userId);
    if (!user) {
      return MobileApiResponse.error('User not found', 404);
    }

    // Get parent profile if user is onboarded
    let parent = null;
    if (user.isParentOnboarded && user.parentId) {
      parent = await Parent.findById(user.parentId);
    }

    // Generate new token pair
    const tokens = MobileAuthService.generateTokens({
      id: user._id.toString(),
      email: user.email,
      parentId: parent?._id.toString(),
    });

    return MobileApiResponse.success({
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return MobileApiResponse.error('Token refresh failed', 403);
  }
}

export async function OPTIONS() {
  return MobileApiResponse.success({}, 200);
}