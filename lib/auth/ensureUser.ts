// /lib/auth/ensureUser.ts
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { notifyNewUser } from "@/lib/admin-notifications";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendGoogleWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [email],
      subject: "🎅 Welcome to Spirit of Santa!",
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ea1938, #22c55e); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #ea1938; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎅 Welcome to Spirit of Santa!</h1>
      <p>You're All Set!</p>
    </div>
    <div class="content">
      <p>Dear ${name},</p>
      
      <p>Thank you for signing up with Google! Your account has been successfully created.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #22c55e;">✅ You're Registered!</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Sign in method:</strong> Google OAuth</p>
      </div>
      
      <h3>What's Next?</h3>
      <ul>
        <li>🎄 We're launching on <strong>January 1, 2026</strong></li>
        <li>📧 Watch for updates as we approach the launch date</li>
        <li>🔗 You can sign in anytime using "Continue with Google"</li>
        <li>🎁 Get ready to manage your family's Christmas magic!</li>
      </ul>
      
      <p>If you have any questions, feel free to reply to this email.</p>
      
      <p>Merry Christmas in advance!<br>
      <strong>The Spirit of Santa Team</strong> 🎅</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="font-size: 12px; color: #666;">
        This is an automated email from Spirit of Santa.<br>
        If you didn't sign up for this service, please ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
      `,
      text: `
Welcome to Spirit of Santa!

Dear ${name},

Thank you for signing up with Google! Your account has been successfully created.

You're Registered!
Email: ${email}
Sign in method: Google OAuth

What's Next:
- We're launching on January 1, 2026
- Watch for updates as we approach launch
- You can sign in anytime using "Continue with Google"
- Get ready to manage your family's Christmas magic!

Merry Christmas in advance!
The Spirit of Santa Team 🎅
      `
    });

    console.log(`📧 Welcome email sent to ${email} (Google OAuth user)`);
  } catch (error) {
    console.error('❌ Failed to send Google welcome email:', error);
    // Don't fail user creation if email fails
  }
}

export async function ensureUser(email: string, name?: string, image?: string) {
  await dbConnect();
  let u = await User.findOne({ email });
  let isNewUser = false;
  
  if (!u) {
    // Only create new user if they don't exist
    u = await User.create({ email, name, image, isParentOnboarded: false });
    isNewUser = true;
    
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

    // Send welcome email to the user
    if (name && email) {
      await sendGoogleWelcomeEmail(email, name);
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
