import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { z } from "zod";
import { sendAdminNotification } from "@/lib/admin-notifications";
import { Resend } from "resend";

const RequestInvoiceSchema = z.object({
  amount: z.number().min(100),
  companyName: z.string().min(1),
  companyEmail: z.string().email(),
  paymentMethod: z.enum(["check"]),
});

const resend = new Resend(process.env.RESEND_API_KEY);
const CHECK_PAYABLE_TO = "The Von Der Becke Academy Corp";
const TAX_ID = "46-1005883";
const MAILING_ADDRESS = "Spirit of Santa\n503 Lake Ave\nStorm Lake, IA 50588";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📥 Big Magic check request received:', body);
    
    const parsed = RequestInvoiceSchema.safeParse(body);
    
    if (!parsed.success) {
      console.error('❌ Validation failed:', parsed.error);
      return NextResponse.json({ 
        error: "Invalid request details", 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }

    const { amount, companyName, companyEmail, paymentMethod } = parsed.data;

    await dbConnect();

    // Send payment instructions email to company
    const paymentInstructions = `
      <h3>Payment by Check or Money Order</h3>
      <p>Please make your check or money order payable to:</p>
      <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #22c55e;">
        <div style="margin-bottom: 15px;">
          <strong style="font-size: 18px; color: #ea1938;">Make Check Payable To:</strong><br/>
          <strong style="font-size: 20px; color: #22c55e;">The Von Der Becke Academy Corp</strong>
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Donation Amount:</strong> <strong style="color: #ea1938;">$${amount.toLocaleString()}</strong>
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Mail To:</strong><br/>
          <strong>Spirit of Santa</strong><br/>
          503 Lake Ave<br/>
          Storm Lake, IA 50588
        </div>
        <div style="padding-top: 10px; border-top: 1px solid #ddd; margin-top: 10px;">
          <strong>Tax ID:</strong> 46-1005883 (501(c)(3) Organization)
        </div>
      </div>
      <p><strong>Important:</strong> Please include your company name (<strong>${companyName}</strong>) in the memo line.</p>
      <p>Upon receipt, we will send you an official tax-deductible receipt and add your company to our sponsor recognition program.</p>
      <p style="background: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">
        <strong>Note:</strong> Your donation is tax-deductible. The Von Der Becke Academy Corp is a registered 501(c)(3) nonprofit organization.
      </p>
    `;

    console.log(`📧 Sending email to ${companyEmail}...`);
    
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@fyht4.com';
      const emailResult = await resend.emails.send({
        from: `Spirit of Santa <${fromEmail}>`,
        to: companyEmail,
        subject: `Big Magic Donation - Payment Instructions for ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ea1938, #22c55e); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 32px;">✨ Big Magic ✨</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Thank You for Your Generosity!</p>
              </div>
              <div class="content">
                <p>Dear ${companyName},</p>
                <p>Thank you for choosing to support Spirit of Santa through our Big Magic corporate giving program! Your donation of <strong>$${amount.toLocaleString()}</strong> will help us:</p>
                <ul>
                  <li>Match magic points earned by children doing good deeds</li>
                  <li>Fund community programs with face-to-face Santa interactions</li>
                  <li>Support hardworking families who need extra help</li>
                </ul>
                
                ${paymentInstructions}
                
                <p>If you have any questions, please don't hesitate to contact us at partnerships@spiritofsanta.com</p>
                
                <p>With gratitude,<br/>
                <strong>The Spirit of Santa Team</strong></p>
              </div>
              <div class="footer">
                <p>Spirit of Santa | 503 Lake Ave, Storm Lake, IA 50588</p>
                <p>Making Christmas magic for children and families</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log(`✅ Email sent successfully:`, emailResult);
    } catch (emailError: any) {
      console.error("❌ Failed to send payment instructions email:", emailError);
      console.error("Email error details:", emailError?.response?.body || emailError?.message);
      // Continue anyway - admin will be notified
    }

    console.log(`📢 Sending admin notification...`);
    
    // Send admin notification
    await sendAdminNotification({
      type: 'admin_action',
      title: `Big Magic Check Payment Request - ${companyName}`,
      description: `${companyName} has requested check payment instructions for a $${amount.toLocaleString()} donation. Payment instructions have been sent to ${companyEmail}.`,
      priority: 'high',
      metadata: {
        companyName,
        companyEmail,
        amount: `$${amount.toLocaleString()}`,
        paymentMethod: 'Check/Money Order',
        checkPayableTo: CHECK_PAYABLE_TO,
        taxId: TAX_ID,
        mailingAddress: MAILING_ADDRESS,
      },
    });

    console.log(`✅ Check payment request processed successfully`);
    
    return NextResponse.json({ 
      success: true,
      message: `Payment instructions have been sent to ${companyEmail}`,
    });

  } catch (error: any) {
    console.error("❌ Request invoice error:", error);
    console.error("Error stack:", error?.stack);
    return NextResponse.json({ 
      error: error?.message || "Failed to process request",
      details: error?.toString(),
    }, { status: 500 });
  }
}
