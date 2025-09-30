import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

/**
 * Sync CatalogItem collection with updated Gift images
 */
async function syncCatalogWithGiftImages() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db();
    const giftsCollection = db.collection('gifts');
    const catalogCollection = db.collection('catalogitems');
    
    console.log('📋 Finding gifts with updated blob images...');
    
    // Get all gifts that have Vercel Blob URLs
    const giftsWithBlobImages = await giftsCollection.find({
      'ids.imageUrl': { $regex: /^https:\/\/.*\.vercel-storage\.com/ }
    }).toArray();
    
    console.log(`📊 Found ${giftsWithBlobImages.length} gifts with blob images`);
    
    if (giftsWithBlobImages.length === 0) {
      console.log('✅ No gifts with blob images to sync!');
      return;
    }
    
    let syncCount = 0;
    
    for (const gift of giftsWithBlobImages) {
      try {
        // Find matching catalog items by title (case-insensitive)
        const matchingCatalogItems = await catalogCollection.find({
          title: { $regex: new RegExp(`^${gift.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        }).toArray();
        
        if (matchingCatalogItems.length > 0) {
          console.log(`🔄 Syncing "${gift.title}" -> ${matchingCatalogItems.length} catalog items`);
          
          // Update all matching catalog items with the blob image URL
          const updateResult = await catalogCollection.updateMany(
            { title: { $regex: new RegExp(`^${gift.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
            { 
              $set: { 
                imageUrl: gift.ids.imageUrl,
                syncedFromGift: true,
                syncedAt: new Date()
              }
            }
          );
          
          syncCount += updateResult.modifiedCount;
          console.log(`  ✅ Updated ${updateResult.modifiedCount} catalog items`);
        } else {
          console.log(`  ⚠️ No matching catalog items found for: "${gift.title}"`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to sync ${gift.title}:`, error.message);
      }
    }
    
    console.log(`\n📊 Sync Summary:`);
    console.log(`✅ Total catalog items updated: ${syncCount}`);
    console.log(`📁 Gifts processed: ${giftsWithBlobImages.length}`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

/**
 * Get sync statistics
 */
async function getSyncStats() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const catalogCollection = db.collection('catalogitems');
    
    const totalCatalog = await catalogCollection.countDocuments();
    const withBlobImages = await catalogCollection.countDocuments({ 
      imageUrl: { $regex: /^https:\/\/.*\.vercel-storage\.com/ }
    });
    const syncedFromGift = await catalogCollection.countDocuments({ 
      syncedFromGift: true
    });
    const withPlaceholders = await catalogCollection.countDocuments({ 
      imageUrl: { $regex: /^\/images\// }
    });
    const withFakeUrls = await catalogCollection.countDocuments({ 
      $or: [
        { imageUrl: { $regex: /^https:\/\/m\.media-amazon\.com/ } },
        { imageUrl: { $regex: /^https:\/\/i5\.walmartimages\.com/ } }
      ]
    });
    
    console.log('📊 Catalog Image Sync Statistics:');
    console.log(`📁 Total catalog items: ${totalCatalog}`);
    console.log(`☁️  With blob images: ${withBlobImages}`);
    console.log(`🔄 Synced from gifts: ${syncedFromGift}`);
    console.log(`🎨 With placeholders: ${withPlaceholders}`);
    console.log(`❌ With fake URLs: ${withFakeUrls}`);
    
  } finally {
    await client.close();
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'sync':
    console.log('🔄 Starting catalog sync with gift images...');
    syncCatalogWithGiftImages();
    break;
    
  case 'stats':
    console.log('📊 Getting sync statistics...');
    getSyncStats();
    break;
    
  default:
    console.log('🔄 Catalog-Gift Image Sync Tool');
    console.log('');
    console.log('Usage:');
    console.log('  node sync-catalog-images.js sync     # Sync catalog with gift images');
    console.log('  node sync-catalog-images.js stats    # Show sync statistics');
    console.log('');
    console.log('This tool copies Vercel Blob image URLs from Gift collection');
    console.log('to matching CatalogItem records by title.');
    break;
}