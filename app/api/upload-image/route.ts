import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    // Check for admin password first (for catalog management)
    const adminPassword = request.headers.get('X-Admin-Password');
    const isAdmin = adminPassword === (process.env.ADMIN_PASSWORD || 'admin123');
    
    let userId = null;
    
    if (!isAdmin) {
      // Check authentication for regular users
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = session.user.id;
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    
    let filename: string;
    if (isAdmin) {
      // Admin uploads for catalog items
      filename = `catalog-items/${timestamp}.${fileExtension}`;
    } else {
      // User uploads for child profiles
      filename = `child-profiles/${userId}/${timestamp}.${fileExtension}`;
    }

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({ 
      url: blob.url,
      filename: filename 
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image' 
    }, { status: 500 });
  }
}