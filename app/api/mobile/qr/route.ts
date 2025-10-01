// QR code generation endpoint for child sharing
import { NextRequest } from 'next/server';
import { withMobileAuth, MobileApiResponse } from '@/lib/mobile-auth';
import { dbConnect } from '@/lib/db';
import { Child } from '@/models/Child';
import { Parent } from '@/models/Parent';
import { generateQRCodeDataURL } from '@/lib/qrcode';

export const GET = withMobileAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return MobileApiResponse.error('Child ID is required', 400);
    }

    // Get parent profile
    const parent = await Parent.findOne({ userId: user.userId });
    if (!parent) {
      return MobileApiResponse.error('Parent profile not found', 404);
    }

    // Get child and verify ownership
    const child = await Child.findById(childId);
    if (!child || child.parentId.toString() !== parent._id.toString()) {
      return MobileApiResponse.error('Child not found or unauthorized', 404);
    }

    // Generate sharing URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://spiritof.vercel.app';
    const shareUrl = `${baseUrl}/share/${child.shareSlug}`;

    // Generate QR code
    const qrCodeDataUrl = await generateQRCodeDataURL(shareUrl);

    const response = {
      childId: child._id.toString(),
      childName: child.displayName,
      shareSlug: child.shareSlug,
      shareUrl,
      qrCodeDataUrl,
      magicScore: child.score365,
      donationsEnabled: child.donationsEnabled,
    };

    return MobileApiResponse.success(response);
  } catch (error) {
    console.error('QR code generation error:', error);
    return MobileApiResponse.error('Failed to generate QR code', 500);
  }
});

export async function OPTIONS() {
  return MobileApiResponse.success({}, 200);
}