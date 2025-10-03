// Quick test of live search functionality
const { googleReadable, bingRss, retailerSearch } = require('./lib/catalog-sourcing.ts');

async function testLiveSearch() {
  console.log('Testing live search functions...');
  
  const debug = { googleCount: 0, bingCount: 0, retailerCount: 0, notes: [] };
  
  try {
    console.log('Testing Google search...');
    const googleResults = await googleReadable('playstation kids toys children safe', debug);
    console.log('Google results:', googleResults.length);
    
    console.log('Testing Bing search...');
    const bingResults = await bingRss('playstation kids toys children safe', debug);
    console.log('Bing results:', bingResults.length);
    
    console.log('Testing retailer search...');
    const retailerResults = await retailerSearch('playstation kids toys children safe', debug);
    console.log('Retailer results:', retailerResults.length);
    
    console.log('Debug info:', debug);
    
  } catch (error) {
    console.error('Error testing live search:', error);
  }
}

testLiveSearch();