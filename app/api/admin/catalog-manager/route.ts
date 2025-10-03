import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { MasterCatalog } from '@/models/MasterCatalog';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function GET(request: NextRequest) {
  const password = request.headers.get('X-Admin-Password');
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  
  const totalItems = await MasterCatalog.countDocuments();
  const activeItems = await MasterCatalog.countDocuments({ isActive: true });
  
  // Get unique categories
  const categories = await MasterCatalog.distinct('category', { 
    category: { $exists: true, $nin: [null, ''] } 
  });
  
  return NextResponse.json({
    totalItems,
    activeItems,
    categories: categories.filter(Boolean)
  });
}