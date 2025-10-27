import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { sendVotingSMS, formatPhoneNumber } from "@/lib/sms";

/**
 * Cron job to send daily voting SMS to all parents
 * Runs every hour and checks which parents should receive SMS based on their timezone and preferred time
 */
export async function GET(req: NextRequest) {
  try {
    // Verify this is a legitimate cron request (Vercel adds this header)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('🕐 Starting daily voting SMS cron job...');

    await dbConnect();

    // Get current time in UTC
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    console.log(`Current UTC time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);

    // Find all parents with phone numbers and SMS enabled
    const parents = await Parent.find({
      phone: { $exists: true, $nin: [null, ""] },
      smsNotificationsEnabled: { $ne: false } // Default true, so include null/undefined
    }).lean();

    console.log(`📱 Found ${parents.length} parents with SMS enabled`);

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const parent of parents) {
      try {
        // Get parent's notification time (default 17:00 = 5 PM)
        const notificationTime = parent.smsNotificationTime || "17:00";
        const [targetHour, targetMinute] = notificationTime.split(':').map(Number);
        
        // Get parent's timezone (default America/New_York)
        const timezone = parent.timezone || "America/New_York";
        
        // Convert parent's local time to UTC for comparison
        const targetLocalTime = new Date();
        targetLocalTime.setHours(targetHour, targetMinute, 0, 0);
        
        // Simple timezone offset calculation (this is approximate)
        // For production, consider using a library like date-fns-tz
        const timezoneOffsets: Record<string, number> = {
          "America/New_York": -5,    // EST
          "America/Chicago": -6,     // CST
          "America/Denver": -7,      // MST
          "America/Los_Angeles": -8, // PST
          "America/Phoenix": -7,     // MST (no DST)
        };
        
        const offset = timezoneOffsets[timezone] || -5;
        const targetUTCHour = (targetHour - offset + 24) % 24;
        
        // Check if we should send SMS now (within the current hour window)
        const shouldSend = currentHour === targetUTCHour && currentMinute < 15; // Send in first 15 mins of hour
        
        if (!shouldSend) {
          skippedCount++;
          continue;
        }

        // Skip if phone is somehow missing (TypeScript guard)
        if (!parent.phone) {
          skippedCount++;
          continue;
        }

        console.log(`📤 Sending SMS to ${parent.name} (${parent.phone})`);

        // Format and send SMS
        const formattedPhone = formatPhoneNumber(parent.phone);
        const result = await sendVotingSMS({
          to: formattedPhone,
          parentId: parent._id.toString(),
          parentName: parent.name,
        });

        if (result.success) {
          sentCount++;
          console.log(`✅ Sent to ${parent.name}: ${result.messageId}`);
        } else {
          errorCount++;
          console.error(`❌ Failed to send to ${parent.name}: ${result.error}`);
        }

        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing parent ${parent._id}:`, error);
      }
    }

    const summary = {
      success: true,
      timestamp: now.toISOString(),
      totalParents: parents.length,
      sent: sentCount,
      skipped: skippedCount,
      errors: errorCount,
    };

    console.log('📊 Daily SMS Summary:', summary);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('💥 Cron job error:', error);
    return NextResponse.json(
      { 
        error: "Cron job failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
