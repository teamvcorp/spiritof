// Child sharing endpoint - get child by share slug
import { NextRequest } from 'next/server';
import { MobileApiResponse } from '@/lib/mobile-auth';
import { dbConnect } from '@/lib/db';
import { Child } from '@/models/Child';
import { Parent } from '@/models/Parent';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const shareSlug = searchParams.get('shareSlug');

    if (!shareSlug) {
      return MobileApiResponse.error('Share slug is required', 400);
    }

    // Find child by share slug
    const child = await Child.findOne({ shareSlug });
    if (!child) {
      return MobileApiResponse.error('Child not found', 404);
    }

    // Get parent information for display
    const parent = await Parent.findById(child.parentId);
    if (!parent) {
      return MobileApiResponse.error('Parent not found', 404);
    }

    const response = {
      childId: child._id.toString(),
      name: child.displayName,
      magicScore: child.score365,
      shareSlug: child.shareSlug,
      neighborDonations: child.neighborLedger.reduce((total, entry) => 
        total + (entry.amountCents || 0), 0) / 100, // Convert to dollars
      parentName: parent.name,
      isActive: true, // Could add active status to model
    };

    return MobileApiResponse.success(response);
  } catch (error) {
    console.error('Child sharing fetch error:', error);
    return MobileApiResponse.error('Failed to fetch child information', 500);
  }
}

export async function OPTIONS() {
  return MobileApiResponse.success({}, 200);
}