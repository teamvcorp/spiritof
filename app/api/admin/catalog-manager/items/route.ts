import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { MasterCatalog } from '@/models/MasterCatalog';
import { FilterQuery } from 'mongoose';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function GET(request: NextRequest) {
  const password = request.headers.get('X-Admin-Password');
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const url = new URL(request.url);
  const search = url.searchParams.get('search');
  const gender = url.searchParams.get('gender');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  const query: FilterQuery<any> = {};
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  
  if (gender && gender !== 'all') {
    query.gender = gender;
  }

  const items = await MasterCatalog.find(query)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const password = request.headers.get('X-Admin-Password');
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const data = await request.json();
  
  try {
    // Check if item with this productUrl already exists
    const existing = await MasterCatalog.findOne({ productUrl: data.productUrl });
    if (existing) {
      return NextResponse.json({ 
        error: `This product URL already exists in the catalog. Item: "${existing.title}"` 
      }, { status: 400 });
    }
    
    const item = new MasterCatalog(data);
    await item.save();
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Error creating item:', error);
    
    // Handle duplicate key error specifically
    if (error instanceof Error && error.message.includes('E11000')) {
      return NextResponse.json({ 
        error: 'This product URL already exists in the catalog. Please use a different URL or edit the existing item.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create item' 
    }, { status: 400 });
  }
}