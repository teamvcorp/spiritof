// JWT Authentication utilities for mobile endpoints
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from './mobile-cors';

interface JWTPayload {
  userId: string;
  email: string;
  parentId?: string;
  iat?: number;
  exp?: number;
}

interface TokenPair {
  token: string;
  refreshToken: string;
}

export class MobileAuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.AUTH_SECRET + '_refresh';
  private static readonly TOKEN_EXPIRY = '1h';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  /**
   * Generate JWT token pair for mobile authentication
   */
  static generateTokens(user: { id: string; email: string; parentId?: string }): TokenPair {
    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      parentId: user.parentId,
    };

    const token = jwt.sign(payload, this.JWT_SECRET, { 
      expiresIn: this.TOKEN_EXPIRY 
    });
    
    const refreshToken = jwt.sign(
      { userId: user.id }, 
      this.JWT_REFRESH_SECRET!, 
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );
    
    return { token, refreshToken };
  }

  /**
   * Verify JWT token and extract user info
   */
  static verifyToken(token: string): JWTPayload {
    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(refreshToken: string): { userId: string } {
    if (!this.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }

    try {
      return jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as { userId: string };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

/**
 * Middleware to authenticate mobile API requests
 */
export function withMobileAuth(handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }

      // Extract and verify token
      const token = MobileAuthService.extractTokenFromHeader(request);
      if (!token) {
        return MobileApiResponse.error('Access token required', 401);
      }

      const user = MobileAuthService.verifyToken(token);
      
      // Call the protected handler
      const response = await handler(request, user);
      
      // Add CORS headers to response
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
    } catch (error) {
      console.error('Mobile auth error:', error);
      return MobileApiResponse.error(
        error instanceof Error ? error.message : 'Authentication failed',
        403
      );
    }
  };
}

/**
 * Standard mobile API response format
 */
export class MobileApiResponse {
  static success(data: Record<string, unknown> = {}, status: number = 200): NextResponse {
    return NextResponse.json(
      { success: true, ...data },
      { 
        status,
        headers: corsHeaders()
      }
    );
  }

  static error(message: string, status: number = 500, code?: string): NextResponse {
    return NextResponse.json(
      { 
        success: false, 
        message,
        ...(code && { code })
      },
      { 
        status,
        headers: corsHeaders()
      }
    );
  }
}