import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { Types } from "mongoose";
import { z } from "zod";

const VoteSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  magicPointsToAdd: z.number().int().min(1).max(100, "Can add 1-100 magic points per vote"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = VoteSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        issues: parsed.error.flatten() 
      }, { status: 400 });
    }

    const { childId, magicPointsToAdd } = parsed.data;

    if (!Types.ObjectId.isValid(childId)) {
      return NextResponse.json({ error: "Invalid child ID" }, { status: 400 });
    }

    await dbConnect();

    // Find parent
    const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Check wallet balance (1 magic point = 1 dollar = 100 cents)
    const costInCents = magicPointsToAdd * 100;
    if (parent.walletBalanceCents < costInCents) {
      return NextResponse.json({ 
        error: `Insufficient wallet balance. Need $${(costInCents / 100).toFixed(2)}, have $${(parent.walletBalanceCents / 100).toFixed(2)}` 
      }, { status: 400 });
    }

    // Check if can vote today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const parentDoc = parent as unknown as { 
      canVoteToday: (childId: string) => boolean; 
      recordVote: (childId: string, amount: number) => Promise<void>; 
      recomputeWalletBalance: () => Promise<void>;
      addLedgerEntry: (entry: { type: string; amountCents: number; description?: string }) => void;
    }; // Cast to access methods
    if (!parentDoc.canVoteToday(childId)) {
      return NextResponse.json({ 
        error: "Already voted for this child today. Try again tomorrow!" 
      }, { status: 400 });
    }

    // Find child
    const child = await Child.findOne({ 
      _id: new Types.ObjectId(childId), 
      parentId: parent._id 
    });
    
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Perform the vote transaction
    await Parent.findByIdAndUpdate(parent._id, {
      $inc: { walletBalanceCents: -costInCents },
      $set: { [`voteLedger.${childId}`]: today }
    });

    await Child.findByIdAndUpdate(child._id, {
      $inc: { score365: magicPointsToAdd }
    });

    // Record vote in parent's ledger for audit trail
    parentDoc.addLedgerEntry({
      type: "ADJUSTMENT",
      amountCents: -costInCents,
      // Add custom field for vote tracking
    });
    await parent.save();

    return NextResponse.json({ 
      success: true, 
      message: `Added ${magicPointsToAdd} magic points to ${child.displayName}!`,
      newScore: Math.min(365, child.score365 + magicPointsToAdd),
      remainingBalance: parent.walletBalanceCents - costInCents
    });

  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}