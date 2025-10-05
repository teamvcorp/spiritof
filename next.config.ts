import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      { protocol: "https", hostname: "**.vercel-storage.com" }, // Vercel Blob storage
      
      // Major retailers
      { protocol: "https", hostname: "i5.walmartimages.com" }, // Walmart images
      { protocol: "https", hostname: "target.scene7.com" }, // Target images
      { protocol: "https", hostname: "m.media-amazon.com" }, // Amazon images
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" }, // Amazon images
      { protocol: "https", hostname: "**.amazon.com" }, // Amazon subdomains
      { protocol: "https", hostname: "**.walmart.com" }, // Walmart subdomains
      { protocol: "https", hostname: "**.target.com" }, // Target subdomains
      { protocol: "https", hostname: "**.walmartimages.com" }, // Walmart images
      { protocol: "https", hostname: "**.scene7.com" }, // Target's image CDN
      
      // Additional common domains
      { protocol: "https", hostname: "**.ebay.com" }, // eBay
      { protocol: "https", hostname: "**.bestbuy.com" }, // Best Buy
      { protocol: "https", hostname: "**.toysrus.com" }, // Toys R Us
      { protocol: "https", hostname: "**.mattel.com" }, // Mattel
      { protocol: "https", hostname: "**.hasbro.com" }, // Hasbro
      { protocol: "https", hostname: "**.lego.com" }, // LEGO
      { protocol: "https", hostname: "**.barbie.com" }, // Barbie
      { protocol: "https", hostname: "**.fisher-price.com" }, // Fisher Price
      { protocol: "https", hostname: "**.shopify.com" }, // Shopify stores
      { protocol: "https", hostname: "**.squarespace.com" }, // Squarespace stores
      { protocol: "https", hostname: "**.wix.com" }, // Wix stores
      { protocol: "https", hostname: "**.cloudfront.net" }, // AWS CloudFront CDN
      { protocol: "https", hostname: "**.googleapis.com" }, // Google APIs
      { protocol: "https", hostname: "**.googleusercontent.com" }, // Google content
      
      // Image services and CDNs
    
    ],
  },
};

export default nextConfig;
