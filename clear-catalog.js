// Clear catalog database script
const { MongoClient } = require('mongodb');

async function clearCatalog() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritof');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('catalogitems');
    
    const result = await collection.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} catalog items`);
    
    // Verify it's empty
    const count = await collection.countDocuments();
    console.log(`📊 Remaining catalog items: ${count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

clearCatalog();