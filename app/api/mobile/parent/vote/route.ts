// Parent voting endpoint
import { NextRequest } from 'next/server';
import { withMobileAuth, MobileApiResponse } from '@/lib/mobile-auth';
import { dbConnect } from '@/lib/db';
import { Parent } from '@/models/Parent';
import { Child } from '@/models/Child';

interface VoteRequest {
  childId: string;
  reason?: string;
  pin?: string;
}

export const POST = withMobileAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();
    
    const body: VoteRequest = await request.json();
    const { childId, reason = 'Good behavior' } = body;

    if (!childId) {
      return MobileApiResponse.error('Child ID is required', 400);
    }

    // Get parent profile
    const parent = await Parent.findOne({ userId: user.userId });
    if (!parent) {
      return MobileApiResponse.error('Parent profile not found', 404);
    }

    // Get child
    const child = await Child.findById(childId);
    if (!child || child.parentId.toString() !== parent._id.toString()) {
      return MobileApiResponse.error('Child not found or unauthorized', 404);
    }

    // Check if parent can vote today
    const today = new Date().toISOString().split('T')[0];
    if (!parent.canVoteToday(childId, today)) {
      return MobileApiResponse.error('You have already voted for this child today', 403);
    }

    // Check wallet balance (1 vote = $1.00 = 100 cents)
    const voteCostCents = 100;
    const currentBalance = parent.recomputeWalletBalance();
    if (currentBalance < voteCostCents) {
      return MobileApiResponse.error('Insufficient wallet balance', 402);
    }

    // Record the vote in parent's vote ledger
    parent.recordVote(childId, today);

    // Deduct from wallet by adding negative ledger entry
    parent.addLedgerEntry({
      type: 'ADJUSTMENT',
      amountCents: -voteCostCents,
      status: 'SUCCEEDED',
    });

    // Add magic point to child
    const previousScore = child.score365;
    child.score365 = Math.min(365, child.score365 + 1);
    
    // Save both documents
    await Promise.all([
      parent.save(),
      child.save(),
    ]);

    const response = {
      message: `Vote cast successfully! ${reason}`,
      childId: child._id.toString(),
      newMagicScore: child.score365,
      pointsAwarded: child.score365 - previousScore,
      newWalletBalance: (currentBalance - voteCostCents) / 100, // Convert to dollars
    };

    return MobileApiResponse.success(response);
  } catch (error) {
    console.error('Vote casting error:', error);
    return MobileApiResponse.error('Failed to cast vote', 500);
  }
});

export async function OPTIONS() {
  return MobileApiResponse.success({}, 200);
}