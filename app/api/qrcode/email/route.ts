import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Child } from "@/models/Child";
import { Parent } from "@/models/Parent";
import { generateQRCodeDataURL, generateShareableURL } from "@/lib/qrcode";
import { Resend } from 'resend';
import { Types } from "mongoose";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const EmailQRSchema = z.object({
  childId: z.string().min(1),
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1).max(100),
  message: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = EmailQRSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid email data", 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }

    const { childId, recipientEmail, recipientName, message } = parsed.data;

    if (!Types.ObjectId.isValid(childId)) {
      return NextResponse.json({ error: "Invalid child ID" }, { status: 400 });
    }

    await dbConnect();
    
    // Verify parent owns this child
    const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    const child = await Child.findOne({ 
      _id: new Types.ObjectId(childId), 
      parentId: parent._id 
    });
    
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Generate shareable URL and QR code
    const shareableURL = generateShareableURL(child.shareSlug);
    const qrCodeDataURL = await generateQRCodeDataURL(shareableURL, { 
      size: 300,
      color: {
        dark: '#0F4A3C',
        light: '#FFFFFF'
      }
    });

    // Create email HTML template
    const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Help ${child.displayName} Earn Christmas Magic!</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #EA1938, #0F4A3C); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .qr-section { text-align: center; background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #0F4A3C; }
            .cta-button { display: inline-block; background: #EA1938; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 10px; }
            .cta-button:hover { background: #d01528; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .message { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #0F4A3C; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎅 Help ${child.displayName} Earn Christmas Magic! 🎁</h1>
            <p>You've been invited to support a wonderful child this Christmas season!</p>
        </div>
        
        <div class="content">
            <p>Hello ${recipientName},</p>
            
            <p><strong>${parent.name}</strong> has shared <strong>${child.displayName}'s</strong> Christmas Magic page with you!</p>
            
            ${message ? `
            <div class="message">
                <strong>Personal message from ${parent.name}:</strong><br>
                <em>"${message}"</em>
            </div>
            ` : ''}
            
            <p>${child.displayName} is working hard to be on Santa's nice list and earn Christmas magic points. You can help by making a small donation that goes directly toward their Christmas joy!</p>
            
            <div class="qr-section">
                <h3>📱 Scan this QR Code</h3>
                <img src="${qrCodeDataURL}" alt="QR Code for ${child.displayName}" style="max-width: 300px; height: auto;">
                <p><strong>Or click the button below:</strong></p>
                <a href="${shareableURL}" class="cta-button">Help ${child.displayName} 🎄</a>
            </div>
            
            <h3>How it works:</h3>
            <ul>
                <li>🎯 Every dollar donated = 1 Christmas magic point</li>
                <li>⭐ Magic points help children reach their Christmas goals</li>
                <li>🎁 Your support brings real Christmas joy to families</li>
                <li>💝 All donations are secure and go directly to the family</li>
            </ul>
            
            <p>Thank you for spreading Christmas magic and making the holidays brighter for ${child.displayName}!</p>
        </div>
        
        <div class="footer">
            <p>Powered by <strong>Spirit of Santa</strong> 🎅</p>
            <p>Spreading Christmas magic, one child at a time</p>
            <p><a href="${shareableURL}" style="color: #0F4A3C;">Visit ${child.displayName}'s page</a></p>
        </div>
    </body>
    </html>
    `;

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: recipientEmail,
      subject: `🎅 Help ${child.displayName} earn Christmas magic!`,
      html: emailHTML,
    });

    if (emailResult.error) {
      console.error("Email sending error:", emailResult.error);
      return NextResponse.json({ 
        error: "Failed to send email" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `QR code email sent successfully to ${recipientEmail}`,
      emailId: emailResult.data?.id,
    });

  } catch (error) {
    console.error("Email QR code error:", error);
    return NextResponse.json({ 
      error: "Failed to send QR code email" 
    }, { status: 500 });
  }
}