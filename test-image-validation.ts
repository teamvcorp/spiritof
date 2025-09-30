// Test image validation script
export async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(imageUrl, {
      method: 'HEAD', // Only check headers, don't download the image
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    // Check if response is successful and content type is an image
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const isImage = contentType?.startsWith('image/') || false;
      console.log(`🖼️  Image validation: ${imageUrl} -> ${response.status} ${contentType} ${isImage ? '✅' : '❌'}`);
      return isImage;
    }
    
    console.log(`❌ Image validation failed: ${imageUrl} -> ${response.status}`);
    return false;
    
  } catch (error) {
    console.log(`❌ Image validation error: ${imageUrl} -> ${error}`);
    return false;
  }
}

// Test some URLs
async function testImageValidation() {
  console.log('Testing image URL validation...');
  
  const testUrls = [
    'https://m.media-amazon.com/images/I/81y3z9R1D3L._AC_SL1500_.jpg', // Known bad URL
    'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png', // Known good URL
    'https://invalid-domain-that-does-not-exist.com/image.jpg', // Invalid domain
    'https://httpstat.us/404/image.jpg', // 404 response
  ];
  
  for (const url of testUrls) {
    console.log(`\nTesting: ${url}`);
    const isValid = await validateImageUrl(url);
    console.log(`Result: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  }
}

testImageValidation().catch(console.error);