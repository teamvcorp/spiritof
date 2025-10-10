import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { MasterCatalog } from "@/models/MasterCatalog";
import { auth } from "@/auth";
import { User } from "@/models/User";

export async function GET() {
  try {
    // Check authentication and admin access
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findById(session.user.id).lean();
    
    // Check if user has admin flag set to true
    const isAdmin = user?.admin === true;
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required - user.admin must be true" },
        { status: 403 }
      );
    }
    
    // Get a sample of catalog items with their image data
    const samples = await MasterCatalog.find({ isActive: true })
      .limit(10)
      .select('title imageUrl sourceType retailer')
      .lean();

    const imageAnalysis = samples.map(item => ({
      title: item.title,
      imageUrl: item.imageUrl || null,
      sourceType: item.sourceType,
      retailer: item.retailer,
      hasImageUrl: !!item.imageUrl,
      imageUrlValid: item.imageUrl && item.imageUrl.trim() && item.imageUrl.includes('vercel-storage.com'),
      needsImageUpload: !item.imageUrl && item.sourceType === 'manual',
    }));

    return NextResponse.json({
      success: true,
      count: samples.length,
      items: imageAnalysis,
      summary: {
        totalItems: samples.length,
        withImageUrl: imageAnalysis.filter(i => i.hasImageUrl).length,
        withValidImageUrl: imageAnalysis.filter(i => i.imageUrlValid).length,
        needingImageUpload: imageAnalysis.filter(i => i.needsImageUpload).length,
      }
    });

  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}