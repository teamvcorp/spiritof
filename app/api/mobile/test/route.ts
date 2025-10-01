// Test endpoint for mobile API connectivity
import { NextRequest } from 'next/server';
import { MobileApiResponse } from '@/lib/mobile-auth';
import { handleMobileCORS } from '@/lib/mobile-cors';

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleMobileCORS(request);
  if (corsResponse) return corsResponse;

  return MobileApiResponse.success({
    message: 'Mobile API is working!',
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
  });
}

export async function OPTIONS() {
  return MobileApiResponse.success({}, 200);
}