import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment has not been completed" },
        { status: 400 }
      );
    }

    const { email, name } = paymentIntent.metadata;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Invalid payment metadata" },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);

    // Create user account using the existing signup endpoint logic
    const signupResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.toLowerCase(),
        name: name,
        password: tempPassword,
      }),
    });

    const signupData = await signupResponse.json();

    if (!signupResponse.ok) {
      // User might already exist
      if (signupResponse.status === 409) {
        return NextResponse.json({
          success: true,
          message: "You're already registered! Check your email for login details.",
        });
      }
      
      return NextResponse.json(
        { error: signupData.error || "Failed to create account" },
        { status: signupResponse.status }
      );
    }

    // Send welcome email with credentials
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: [email],
        subject: "🎅 Welcome to Spirit of Santa - Your Login Credentials",
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ea1938, #22c55e); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .credentials { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ea1938; margin: 20px 0; }
    .button { display: inline-block; background: #ea1938; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎅 Welcome to Spirit of Santa!</h1>
      <p>Your Pre-Registration is Complete</p>
    </div>
    <div class="content">
      <p>Dear ${name},</p>
      
      <p>Thank you for pre-registering for Spirit of Santa! We're excited to have you join us for our launch on <strong>January 1, 2026</strong>.</p>
      
      <p>Your payment of $5.00 has been successfully processed, and your account has been created.</p>
      
      <div class="credentials">
        <h3 style="margin-top: 0; color: #ea1938;">🔑 Your Login Credentials</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${tempPassword}</code></p>
      </div>
      
      <div class="warning">
        <strong>⚠️ Important:</strong> Save these credentials in a safe place! You'll need them to log in when we launch.
      </div>
      
      <h3>What's Next?</h3>
      <ul>
        <li>🎁 Your welcome packet is being prepared</li>
        <li>📧 Watch for updates as we approach the launch date</li>
        <li>🎄 On January 1, 2026, log in and start managing your Christmas magic!</li>
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

Thank you for pre-registering! We're launching on January 1, 2026.

Your Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

⚠️ IMPORTANT: Save these credentials! You'll need them to log in when we launch.

What's Next:
- Your welcome packet is being prepared
- Watch for updates as we approach launch
- On January 1, 2026, log in and start managing your Christmas magic!

Merry Christmas in advance!
The Spirit of Santa Team 🎅
        `
      });

      console.log(`✅ Pre-registration complete for ${email}`);
      console.log(`� Welcome email sent with credentials`);
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
      console.log(`🔑 Temporary password for ${email}: ${tempPassword}`);
    }

    return NextResponse.json({
      success: true,
      message: "Registration complete! Check your email for login credentials.",
      tempPassword: tempPassword, // Include in response as backup
    });

  } catch (error) {
    console.error("Pre-registration confirmation error:", error);
    return NextResponse.json(
      {
        error: "Failed to complete registration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
