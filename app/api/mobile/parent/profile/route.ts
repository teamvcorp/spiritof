// Get parent profile with children
import { NextRequest } from 'next/server';
import { withMobileAuth, MobileApiResponse } from '@/lib/mobile-auth';
import { handleMobileCORS } from '@/lib/mobile-cors';
import { dbConnect } from '@/lib/db';
import { Parent } from '@/models/Parent';
import { Child } from '@/models/Child';
import { Gift } from '@/models/Gift';

export const GET = withMobileAuth(async (request: NextRequest, user) => {
  // Handle CORS preflight
  const corsResponse = handleMobileCORS(request);
  if (corsResponse) return corsResponse;

  try {
    await dbConnect();
    
    // Get parent profile
    const parent = await Parent.findOne({ userId: user.userId });
    if (!parent) {
      return MobileApiResponse.error('Parent profile not found', 404);
    }

    // Get all children for this parent
    const children = await Child.find({ parentId: parent._id });
    
    // Get wish list for each child
    const childrenWithWishLists = await Promise.all(
      children.map(async (child) => {
        const wishList = await Gift.find({ childId: child._id });
        
        return {
          id: child._id.toString(),
          parentId: child.parentId.toString(),
          name: child.displayName,
          age: calculateAge(child.createdAt), // Estimate age from creation date for demo
          score365: child.score365,
          shareSlug: child.shareSlug,
          avatar: child.avatarUrl || getDefaultAvatar(),
          wishList: wishList.map(gift => ({
            id: gift._id.toString(),
            name: gift.title || 'Unnamed Gift',
            description: gift.notes || '',
            category: 'General',
            status: 'REQUESTED',
            createdAt: gift.createdAt,
            updatedAt: gift.updatedAt,
          })),
          neighborLedger: child.neighborLedger?.map(entry => ({
            id: entry._id?.toString(),
            donorName: entry.fromName,
            amount: entry.amountCents / 100, // Convert cents to dollars
            message: entry.message,
            timestamp: entry.createdAt,
          })) || [],
          createdAt: child.createdAt,
          updatedAt: child.updatedAt,
        };
      })
    );

    // Calculate wallet balance from ledger
    const walletBalance = parent.recomputeWalletBalance();
    
    // Check if parent has voted today
    const today = new Date().toISOString().split('T')[0];
    const voteLedger = parent.voteLedger || {};
    const hasVotedToday = Object.values(voteLedger).some(
      (voteDate: string) => voteDate === today
    );

    const response = {
      parent: {
        id: parent._id.toString(),
        userId: parent.userId.toString(),
        name: parent.name,
        walletBalance: walletBalance / 100, // Convert cents to dollars
        walletLedger: parent.walletLedger.map(entry => ({
          id: entry._id?.toString(),
          type: entry.type,
          amount: entry.amountCents / 100, // Convert cents to dollars
          description: getTransactionDescription(entry.type),
          timestamp: entry.createdAt,
          status: entry.status,
        })),
        hasVotedToday,
        todaysVotes: voteLedger,
        createdAt: parent.createdAt,
        updatedAt: parent.updatedAt,
      },
      children: childrenWithWishLists,
    };

    return MobileApiResponse.success(response);
  } catch (error) {
    console.error('Get parent profile error:', error);
    return MobileApiResponse.error('Failed to get parent profile', 500);
  }
});

function getDefaultAvatar(): string {
  return '🧒';
}

function calculateAge(createdAt?: Date): number {
  // Simple age estimation for demo - in real app you'd store actual age
  if (!createdAt) return 8;
  const monthsOld = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));
  return Math.max(5, Math.min(12, 8 + Math.floor(monthsOld / 12)));
}

function getTransactionDescription(type: string): string {
  switch (type) {
    case 'TOP_UP': return 'Wallet top-up';
    case 'REFUND': return 'Refund';
    case 'ADJUSTMENT': return 'Balance adjustment';
    default: return 'Transaction';
  }
}

export async function OPTIONS() {
  return MobileApiResponse.success({}, 200);
}