import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { MasterCatalog } from '@/models/MasterCatalog';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const password = request.headers.get('X-Admin-Password');
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const data = await request.json();
  const { id } = await params;
  
  try {
    const item = await MasterCatalog.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update item' 
    }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const password = request.headers.get('X-Admin-Password');
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  
  try {
    const item = await MasterCatalog.findByIdAndDelete(id);
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete item' 
    }, { status: 400 });
  }
}