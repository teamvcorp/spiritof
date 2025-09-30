import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { put } from '@vercel/blob';

const MONGODB_URI = process.env.MONGODB_URI!;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

// Validate auth header for cron job security
function validateCronAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET || 'fallback-secret';
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return false;
  }
  return true;
}

/**
 * Search for real product images using multiple sources
 */
async function searchForProductImage(title: string): Promise<string | null> {
  console.log(`🔍 Searching for image: ${title}`);
  
  try {
    const imageUrl = await findImageFromRetailers(title);
    
    if (imageUrl) {
      console.log(`✅ Found image URL: ${imageUrl}`);
      return imageUrl;
    }
    
    console.log(`❌ No image found for: ${title}`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error searching for ${title}:`, (error as Error).message);
    return null;
  }
}

/**
 * Find images from major toy retailers
 */
async function findImageFromRetailers(title: string): Promise<string | null> {
  const retailers = [
    {
      name: 'Amazon',
      searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=toys-and-games`,
      imagePattern: /https:\/\/m\.media-amazon\.com\/images\/I\/[A-Z0-9]+\._[A-Z0-9_]+_\.jpg/g
    },
    {
      name: 'Target',
      searchUrl: `https://www.target.com/s?searchTerm=${encodeURIComponent(title)}&category=5xt1a`,
      imagePattern: /https:\/\/target\.scene7\.com\/is\/image\/Target\/[A-Z0-9_-]+/g
    },
    {
      name: 'Walmart',
      searchUrl: `https://www.walmart.com/search?q=${encodeURIComponent(title)}&cat_id=4171`,
      imagePattern: /https:\/\/i5\.walmartimages\.com\/[a-zA-Z0-9\/._-]+\.(jpg|jpeg|png)/g
    }
  ];
  
  for (const retailer of retailers) {
    try {
      console.log(`  🛍️  Searching ${retailer.name}...`);
      
      const response = await fetch(retailer.searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const html = await response.text();
        const matches = html.match(retailer.imagePattern);
        
        if (matches && matches.length > 0) {
          // Try to validate the first few image URLs
          for (const imageUrl of matches.slice(0, 3)) {
            if (await validateImageUrl(imageUrl)) {
              console.log(`  ✅ Found valid image from ${retailer.name}: ${imageUrl}`);
              return imageUrl;
            }
          }
        }
      }
    } catch (error) {
      console.log(`  ❌ ${retailer.name} search failed: ${(error as Error).message}`);
    }
  }
  
  return null;
}

/**
 * Validate that an image URL actually returns a valid image
 */
async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      return contentType !== null && contentType.startsWith('image/');
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Download image and upload to Vercel Blob
 */
async function downloadAndUploadImage(imageUrl: string, filename: string): Promise<string | null> {
  try {
    console.log(`📥 Downloading image: ${imageUrl}`);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }
    
    const imageArrayBuffer = await response.arrayBuffer();
    console.log(`📦 Downloaded ${imageArrayBuffer.byteLength} bytes`);
    
    // Upload to Vercel Blob
    console.log(`☁️  Uploading to Vercel Blob: ${filename}`);
    const blob = await put(filename, imageArrayBuffer, {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
    });
    
    console.log(`✅ Uploaded to blob: ${blob.url}`);
    return blob.url;
    
  } catch (error) {
    console.error(`❌ Failed to download/upload image: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Generate a safe filename from gift title
 */
function generateFilename(title: string, index: number): string {
  const safe = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  return `gifts/${safe}-${index}.jpg`;
}

/**
 * Main migration function
 */
async function migrateGiftImages() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db();
    const giftsCollection = db.collection('gifts');
    
    // Get gifts that need images (limit to 50 per run to avoid timeouts)
    console.log('📋 Fetching gifts from database...');
    const gifts = await giftsCollection.find({
      $or: [
        { imageUrl: { $exists: false } },
        { imageUrl: null },
        { imageUrl: '' },
        { imageUrl: /^https:\/\/m\.media-amazon\.com/ }, // Replace broken Amazon URLs
        { imageUrl: /^https:\/\/i5\.walmartimages\.com/ } // Replace broken Walmart URLs
      ]
    }).limit(50).toArray();
    
    console.log(`📊 Found ${gifts.length} gifts that need image migration`);
    
    if (gifts.length === 0) {
      return { success: true, message: 'No gifts need image migration', processed: 0 };
    }
    
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < gifts.length; i++) {
      const gift = gifts[i];
      console.log(`\n🎁 Processing gift ${i + 1}/${gifts.length}: ${gift.title}`);
      
      try {
        // Search for a real product image
        const imageUrl = await searchForProductImage(gift.title);
        
        if (imageUrl) {
          // Download and upload to Vercel Blob
          const filename = generateFilename(gift.title, Date.now() + i);
          const blobUrl = await downloadAndUploadImage(imageUrl, filename);
          
          if (blobUrl) {
            // Update the gift in the database
            await giftsCollection.updateOne(
              { _id: gift._id },
              { 
                $set: { 
                  imageUrl: blobUrl,
                  originalImageUrl: imageUrl,
                  imageUpdatedAt: new Date()
                }
              }
            );
            
            console.log(`✅ Successfully updated gift: ${gift.title}`);
            successful++;
          } else {
            failed++;
          }
        } else {
          // Set a placeholder image
          const placeholderUrl = '/images/christmasMagic.png';
          await giftsCollection.updateOne(
            { _id: gift._id },
            { 
              $set: { 
                imageUrl: placeholderUrl,
                imageUpdatedAt: new Date()
              }
            }
          );
          console.log(`📝 Set placeholder for: ${gift.title}`);
          failed++;
        }
        
        // Add a small delay to be respectful to servers
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to process ${gift.title}:`, (error as Error).message);
        failed++;
      }
    }
    
    const summary = {
      success: true,
      message: `Migration completed: ${successful} successful, ${failed} failed/placeholder`,
      processed: gifts.length,
      successful,
      failed
    };
    
    console.log(`\n📊 Migration Summary:`, summary);
    return summary;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { 
      success: false, 
      message: `Migration failed: ${(error as Error).message}`,
      processed: 0
    };
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate cron authentication
    if (!validateCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🚀 Starting automated gift image migration...');
    const result = await migrateGiftImages();
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Cron job failed: ${(error as Error).message}` 
      }, 
      { status: 500 }
    );
  }
}