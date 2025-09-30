import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config();
const MONGODB_URI = process.env.MONGODB_URI;

async function debugCollections() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Database Collections Debug:');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Available collections:');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  ${col.name}: ${count} documents`);
    }
    
    // Check gifts collection
    console.log('\n🎁 Gifts with images:');
    const gifts = await db.collection('gifts').find({
      'ids.imageUrl': { $exists: true, $ne: null, $ne: '' }
    }).limit(5).toArray();
    
    for (const gift of gifts) {
      console.log(`  "${gift.title}": ${gift.ids?.imageUrl || 'no imageUrl'}`);
    }
    
    // Check catalogitems variations
    const catalogItemsNames = ['catalogitems', 'catalogItems', 'CatalogItems', 'catalog_items'];
    for (const name of catalogItemsNames) {
      try {
        const count = await db.collection(name).countDocuments();
        if (count > 0) {
          console.log(`\n📦 ${name} collection: ${count} items`);
          const sample = await db.collection(name).findOne();
          console.log('  Sample item:', sample?.title || 'No title');
        }
      } catch (error) {
        // Collection doesn't exist
      }
    }
    
  } finally {
    await client.close();
  }
}

debugCollections();