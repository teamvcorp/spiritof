import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    console.log('📞 Update phone API called');
    
    const session = await auth();
    if (!session?.user?.id) {
      console.log('❌ No session');
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.log('✅ User authenticated:', session.user.id);

    const { phone, smsNotificationTime, smsNotificationsEnabled, timezone } = await req.json();
    console.log('📝 Request data:', { phone, smsNotificationTime, smsNotificationsEnabled, timezone });

    if (!phone || typeof phone !== 'string') {
      console.log('❌ Invalid phone');
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    await dbConnect();
    console.log('✅ DB connected');

    // Get user's parentId
    const user = await User.findById(session.user.id).select("parentId").lean();
    if (!user?.parentId) {
      console.log('❌ No parent found for user');
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }
    console.log('✅ Parent ID found:', user.parentId);

    // Prepare update object
    const updateData: any = { 
      phone: phone.trim() 
    };
    
    if (smsNotificationTime) {
      updateData.smsNotificationTime = smsNotificationTime;
    }
    
    if (typeof smsNotificationsEnabled === 'boolean') {
      updateData.smsNotificationsEnabled = smsNotificationsEnabled;
    }
    
    if (timezone) {
      updateData.timezone = timezone;
    }

    console.log('💾 Updating parent with:', updateData);

    // Update parent using $set to ensure fields are updated
    await Parent.findByIdAndUpdate(
      user.parentId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Fetch the updated parent fresh from DB to verify
    const parent = await Parent.findById(user.parentId).select('phone smsNotificationTime smsNotificationsEnabled timezone').lean();

    if (!parent) {
      console.log('❌ Parent not found after update');
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    console.log('✅ Parent updated successfully (fresh fetch):', {
      _id: user.parentId,
      phone: parent.phone,
      smsNotificationTime: parent.smsNotificationTime,
      smsNotificationsEnabled: parent.smsNotificationsEnabled,
      timezone: parent.timezone
    });

    return NextResponse.json({
      success: true,
      message: "SMS settings updated successfully",
      phone: parent.phone,
      smsNotificationTime: parent.smsNotificationTime,
      smsNotificationsEnabled: parent.smsNotificationsEnabled,
      timezone: parent.timezone,
    });

  } catch (error) {
    console.error("Update phone error:", error);
    return NextResponse.json(
      { 
        error: "Failed to update phone number",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
