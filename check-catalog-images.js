const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkCatalog() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    const catalogCount = await mongoose.connection.db.collection('mastercatalogs').countDocuments();
    console.log('Total catalog items:', catalogCount);
    
    // Check some sample items
    const sampleItems = await mongoose.connection.db.collection('mastercatalogs').find({}).limit(5).toArray();
    
    console.log('\nSample catalog items:');
    sampleItems.forEach((item, i) => {
      console.log(`Item ${i + 1}:`);
      console.log('  Title:', item.title);
      console.log('  ImageUrl:', item.imageUrl);
      console.log('  BlobUrl:', item.blobUrl);
      console.log('  OriginalImageUrl:', item.originalImageUrl);
      console.log('  ProductUrl:', item.productUrl);
      console.log('  SourceType:', item.sourceType);
      console.log();
    });
    
    // Check how many have images
    const itemsWithImages = await mongoose.connection.db.collection('mastercatalogs').countDocuments({
      $or: [
        { imageUrl: { $exists: true, $ne: null, $not: /\/images\/christmasMagic\.png$/ } },
        { blobUrl: { $exists: true, $ne: null } },
        { originalImageUrl: { $exists: true, $ne: null, $not: /\/images\/christmasMagic\.png$/ } }
      ]
    });
    
    console.log(`Items with actual images: ${itemsWithImages} out of ${catalogCount}`);
    
    // Check children's gift lists
    const children = await mongoose.connection.db.collection('children').find({}).toArray();
    console.log(`\nFound ${children.length} children`);
    
    for (const child of children.slice(0, 2)) {
      console.log(`Child: ${child.displayName}`);
      console.log(`  Gift list length: ${child.giftList ? child.giftList.length : 0}`);
      if (child.giftList && child.giftList.length > 0) {
        console.log(`  First few gift IDs: ${child.giftList.slice(0, 3).join(', ')}`);
      }
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCatalog();