// /app/api/cron/send-weekly-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { sendVotingReminder, sendWeeklyBudgetUpdate } from "@/lib/email-reminders";

// Verify cron secret to ensure this is only called by Vercel Cron
function verifyAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // In development, allow without auth
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  return false;
}

export async function GET(req: NextRequest) {
  console.log('🔔 Weekly reminders cron job triggered');

  // Verify authentication
  if (!verifyAuth(req)) {
    console.error('❌ Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    // Get all parents with children and email preferences enabled
    const parents = await Parent.find({
      'christmasSettings.reminderEmails': true,
      children: { $exists: true, $ne: [] }
    }).lean();

    console.log(`📧 Found ${parents.length} parents with reminder emails enabled`);

    let votingEmailsSent = 0;
    let budgetEmailsSent = 0;
    let errors = 0;

    for (const parent of parents) {
      try {
        // Get children data
        const children = await Child.find({
          _id: { $in: parent.children }
        }).select('name score365').lean();

        if (children.length === 0) {
          console.log(`⏭️ Skipping parent ${parent.email} - no children found`);
          continue;
        }

        // Send voting reminder
        const voteUrl = `${process.env.NEXTAUTH_URL}/mobile/vote`;
        const votingResult = await sendVotingReminder({
          parentName: parent.name,
          parentEmail: parent.email,
          children: children.map((child: any) => ({
            name: child.name,
            score365: child.score365 || 0
          })),
          voteUrl
        });

        if (votingResult.success) {
          votingEmailsSent++;
        } else {
          errors++;
          console.error(`❌ Failed to send voting reminder to ${parent.email}`);
        }

        // Send budget update if enabled
        if (parent.christmasSettings?.weeklyBudgetUpdates) {
          // Calculate days until Christmas
          const christmas = new Date(new Date().getFullYear(), 11, 25); // December 25
          const today = new Date();
          const daysUntil = Math.ceil((christmas.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          const budgetResult = await sendWeeklyBudgetUpdate(
            parent.email,
            parent.name,
            {
              currentBalance: parent.walletBalanceCents || 0,
              monthlyGoal: parent.christmasSettings?.monthlyBudgetGoal 
                ? parent.christmasSettings.monthlyBudgetGoal * 100 
                : 20000, // Default $200
              totalSpent: 0, // TODO: Calculate actual spent amount from ledger
              childrenCount: children.length,
              daysUntilChristmas: daysUntil > 0 ? daysUntil : 0
            }
          );

          if (budgetResult.success) {
            budgetEmailsSent++;
          } else {
            errors++;
            console.error(`❌ Failed to send budget update to ${parent.email}`);
          }
        }

        // Add small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        errors++;
        console.error(`❌ Error processing parent ${parent.email}:`, error);
      }
    }

    const summary = {
      totalParents: parents.length,
      votingEmailsSent,
      budgetEmailsSent,
      errors,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Weekly reminders completed:', summary);

    return NextResponse.json({
      success: true,
      message: 'Weekly reminders sent',
      summary
    });

  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send weekly reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggering
export async function POST(req: NextRequest) {
  return GET(req);
}
