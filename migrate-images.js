import { MongoClient } from 'mongodb';
import { put } from '@vercel/blob';
import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

if (!BLOB_READ_WRITE_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is required');
  console.log('💡 Get this from Vercel Dashboard > Storage > Blob > Settings');
  process.exit(1);
}

/**
 * Search for real product images using multiple sources
 */
async function searchForProductImage(title) {
  console.log(`🔍 Searching for image: ${title}`);
  
  try {
    // Try to find images from specific retailers
    const imageUrl = await findImageFromRetailers(title);
    
    if (imageUrl) {
      console.log(`✅ Found image URL: ${imageUrl}`);
      return imageUrl;
    }
    
    console.log(`❌ No image found for: ${title}`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error searching for ${title}:`, error.message);
    return null;
  }
}

/**
 * Find images from major toy retailers
 */
async function findImageFromRetailers(title) {
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
        timeout: 10000
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
      console.log(`  ❌ ${retailer.name} search failed: ${error.message}`);
    }
  }
  
  return null;
}

/**
 * Validate that an image URL actually returns a valid image
 */
async function validateImageUrl(imageUrl) {
  try {
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      return contentType && contentType.startsWith('image/');
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Download image and upload to Vercel Blob
 */
async function downloadAndUploadImage(imageUrl, filename) {
  try {
    console.log(`📥 Downloading image: ${imageUrl}`);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }
    
    const imageBuffer = await response.buffer();
    console.log(`📦 Downloaded ${imageBuffer.length} bytes`);
    
    // Upload to Vercel Blob
    console.log(`☁️  Uploading to Vercel Blob: ${filename}`);
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
    });
    
    console.log(`✅ Uploaded to blob: ${blob.url}`);
    return blob.url;
    
  } catch (error) {
    console.error(`❌ Failed to download/upload image: ${error.message}`);
    return null;
  }
}

/**
 * Generate a safe filename from gift title
 */
function generateFilename(title, index) {
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
    
    // Get all gifts that need images
    console.log('📋 Fetching gifts from database...');
    const gifts = await giftsCollection.find({
      $or: [
        { imageUrl: { $exists: false } },
        { imageUrl: null },
        { imageUrl: '' },
        { imageUrl: /^https:\/\/m\.media-amazon\.com/ }, // Replace broken Amazon URLs
        { imageUrl: /^https:\/\/i5\.walmartimages\.com/ } // Replace broken Walmart URLs
      ]
    }).toArray();
    
    console.log(`📊 Found ${gifts.length} gifts that need image migration`);
    
    if (gifts.length === 0) {
      console.log('✅ No gifts need image migration!');
      return;
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
          const filename = generateFilename(gift.title, i);
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
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Failed to process ${gift.title}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${successful} gifts`);
    console.log(`❌ Failed/Placeholder: ${failed} gifts`);
    console.log(`📁 Total processed: ${gifts.length} gifts`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

/**
 * Get migration statistics
 */
async function getMigrationStats() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const giftsCollection = db.collection('gifts');
    
    const total = await giftsCollection.countDocuments();
    const withImages = await giftsCollection.countDocuments({ 
      imageUrl: { $exists: true, $ne: null, $ne: '' }
    });
    const withBlobImages = await giftsCollection.countDocuments({ 
      imageUrl: { $regex: /^https:\/\/.*\.vercel-storage\.com/ }
    });
    const withPlaceholders = await giftsCollection.countDocuments({ 
      imageUrl: '/images/christmasMagic.png'
    });
    
    console.log('📊 Current Gift Image Statistics:');
    console.log(`📁 Total gifts: ${total}`);
    console.log(`🖼️  With images: ${withImages}`);
    console.log(`☁️  With blob images: ${withBlobImages}`);
    console.log(`🎨 With placeholders: ${withPlaceholders}`);
    console.log(`❌ Without images: ${total - withImages}`);
    
  } finally {
    await client.close();
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'migrate':
    console.log('🚀 Starting gift image migration...');
    migrateGiftImages();
    break;
    
  case 'stats':
    console.log('📊 Getting migration statistics...');
    getMigrationStats();
    break;
    
  default:
    console.log('🔧 Gift Image Migration Tool');
    console.log('');
    console.log('Usage:');
    console.log('  node migrate-images.js migrate   # Start image migration');
    console.log('  node migrate-images.js stats     # Show current statistics');
    console.log('');
    console.log('Environment variables required:');
    console.log('  MONGODB_URI              # MongoDB connection string');
    console.log('  BLOB_READ_WRITE_TOKEN    # Vercel Blob storage token');
    break;
}