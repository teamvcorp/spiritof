const { MongoClient, ObjectId } = require('mongodb');

async function checkWallet() {
  try {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('spirit-of-santa');
    const parent = await db.collection('parents').findOne({
      _id: new ObjectId('68d373e4b1092284f3cae52b')
    });
    
    if (parent) {
      console.log('✅ Parent found');
      console.log('💰 Wallet balance (cents):', parent.walletBalanceCents);
      console.log('💰 Wallet balance (dollars):', (parent.walletBalanceCents / 100).toFixed(2));
      console.log('📝 Ledger entries:', parent.walletLedger?.length || 0);
      
      if (parent.walletLedger && parent.walletLedger.length > 0) {
        const latest = parent.walletLedger[parent.walletLedger.length - 1];
        console.log('📊 Latest entry:');
        console.log('  - Type:', latest.type);
        console.log('  - Amount:', latest.amountCents);
        console.log('  - Status:', latest.status);
        console.log('  - Session ID:', latest.stripeCheckoutSessionId);
        console.log('  - Date:', latest.createdAt);
      }
    } else {
      console.log('❌ Parent not found');
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkWallet();