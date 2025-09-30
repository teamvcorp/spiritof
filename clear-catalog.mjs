import { dbConnect } from './lib/db.js';
import { CatalogItem } from './models/CatalogItem.js';

async function clearCatalog() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB');
    
    const result = await CatalogItem.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} catalog items`);
    
    // Verify it's empty
    const count = await CatalogItem.countDocuments();
    console.log(`📊 Remaining catalog items: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearCatalog();