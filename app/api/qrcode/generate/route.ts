import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Child } from "@/models/Child";
import { Parent } from "@/models/Parent";
import { generateQRCodeDataURL, generateShareableURL } from "@/lib/qrcode";
import { Types } from "mongoose";
import { z } from "zod";

const QRRequestSchema = z.object({
  childId: z.string().min(1),
  size: z.number().int().min(128).max(512).optional(),
  format: z.enum(['png', 'svg']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = QRRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid request", 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }

    const { childId, size = 256, format = 'png' } = parsed.data;

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

    // Generate shareable URL
    const shareableURL = generateShareableURL(child.shareSlug);
    
    // Generate QR code
    const qrCodeDataURL = await generateQRCodeDataURL(shareableURL, { 
      size,
      color: {
        dark: '#0F4A3C', // evergreen
        light: '#FFFFFF'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        qrCodeDataURL,
        shareableURL,
        childName: child.displayName,
        shareSlug: child.shareSlug,
        format,
        size,
      }
    });

  } catch (error) {
    console.error("QR Code generation error:", error);
    return NextResponse.json({ 
      error: "Failed to generate QR code" 
    }, { status: 500 });
  }
}