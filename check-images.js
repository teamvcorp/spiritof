const { MongoClient } = require('mongodb');

async function checkImages() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritof');
  await client.connect();
  
  const db = client.db();
  const collection = db.collection('catalogitems');
  
  const totalItems = await collection.countDocuments();
  const itemsWithImages = await collection.countDocuments({ 
    imageUrl: { $exists: true, $ne: null, $ne: '' } 
  });
  
  const sampleWithImages = await collection.find({ 
    imageUrl: { $exists: true, $ne: null, $ne: '' } 
  }).limit(5).toArray();
  
  console.log('Total items:', totalItems);
  console.log('Items with images:', itemsWithImages);
  console.log('Sample items with images:');
  sampleWithImages.forEach(item => {
    console.log(item.title + ' -> ' + item.imageUrl);
  });
  
  await client.close();
}

checkImages().catch(console.error);