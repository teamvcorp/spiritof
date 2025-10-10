// /lib/auth/ensureUser.ts
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { notifyNewUser } from "@/lib/admin-notifications";

export async function ensureUser(email: string, name?: string, image?: string) {
  await dbConnect();
  let u = await User.findOne({ email });
  if (!u) {
    // Only create new user if they don't exist
    u = await User.create({ email, name, image, isParentOnboarded: false });
    
    // Send notification for new user registration (OAuth)
    try {
      await notifyNewUser(
        name || 'Unknown',
        email,
        'google'
      );
      console.log('📧 Admin notification sent for new OAuth user');
    } catch (emailError) {
      console.error('❌ Failed to send new user notification:', emailError);
      // Don't fail user creation if email fails
    }
  } else {
    // User exists - just update name/image if provided and not already set
    console.log('✅ User already exists, preserving isParentOnboarded status:', u.isParentOnboarded);
    if (name && !u.name) {
      u.name = name;
      await u.save();
    }
    if (image && !u.image) {
      u.image = image;
      await u.save();
    }
  }
  return u;
}
