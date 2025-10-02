import { put } from '@vercel/blob';

/**
 * Upload an image to Vercel Blob and return the URL
 */
export async function uploadImageToBlob(
  imageUrl: string, 
  filename: string
): Promise<{ success: boolean; blobUrl?: string; error?: string }> {
  try {
    // Fetch the image from the source URL
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!imageResponse.ok) {
      return { 
        success: false, 
        error: `Failed to fetch image: ${imageResponse.status}` 
      };
    }

    // Check if it's actually an image
    const contentType = imageResponse.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return { 
        success: false, 
        error: `Invalid content type: ${contentType}` 
      };
    }

    // Get the image blob
    const imageBlob = await imageResponse.blob();

    // Generate a unique filename with proper extension
    const extension = getFileExtension(contentType);
    const uniqueFilename = `catalog/${Date.now()}-${filename.replace(/[^a-zA-Z0-9]/g, '-')}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, imageBlob, {
      access: 'public',
      contentType: contentType,
    });

    return {
      success: true,
      blobUrl: blob.url
    };

  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get file extension from content type
 */
function getFileExtension(contentType: string): string {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    case 'image/svg+xml':
      return 'svg';
    default:
      return 'jpg'; // Default fallback
  }
}

/**
 * Validate that an image URL is accessible and returns an image
 */
export async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      return contentType?.startsWith('image/') || false;
    }
    
    return false;
    
  } catch {
    return false;
  }
}