// /lib/auth/ensureUser.ts
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { notifyNewUser } from "@/lib/admin-notifications";

export async function ensureUser(email: string, name?: string, image?: string) {
  await dbConnect();
  let u = await User.findOne({ email });
  if (!u) {
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
  }
  return u;
}
