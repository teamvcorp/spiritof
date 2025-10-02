import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { MasterCatalog } from '@/models/MasterCatalog';

export async function GET() {
  try {
    await dbConnect();
    
    const catalogCount = await MasterCatalog.countDocuments();
    const sampleItems = await MasterCatalog.find({}).limit(5).lean();
    
    // Check how many have actual images
    const itemsWithImages = await MasterCatalog.countDocuments({
      $or: [
        { imageUrl: { $exists: true, $ne: null, $not: /\/images\/christmasMagic\.png$/ } },
        { blobUrl: { $exists: true, $ne: null } }
      ]
    });
    
    return NextResponse.json({
      success: true,
      catalogCount,
      itemsWithImages,
      sampleItems: sampleItems.map(item => ({
        title: item.title,
        imageUrl: item.imageUrl,
        blobUrl: item.blobUrl,
        productUrl: item.productUrl,
        sourceType: item.sourceType
      }))
    });
    
  } catch (error) {
    console.error('Error checking catalog:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}