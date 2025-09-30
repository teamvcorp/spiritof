import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      { protocol: "https", hostname: "**.vercel-storage.com" }, // Vercel Blob storage
      { protocol: "https", hostname: "i5.walmartimages.com" }, // Walmart images
      { protocol: "https", hostname: "target.scene7.com" }, // Target images
      { protocol: "https", hostname: "m.media-amazon.com" }, // Amazon images
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" }, // Amazon images
      { protocol: "https", hostname: "**.amazon.com" }, // Amazon subdomains
      { protocol: "https", hostname: "**.walmart.com" }, // Walmart subdomains
      { protocol: "https", hostname: "**.target.com" }, // Target subdomains
      { protocol: "https", hostname: "**.walmartimages.com" }, // Walmart images
      { protocol: "https", hostname: "**.scene7.com" }, // Target's image CDN
      { protocol: "https", hostname: "images.unsplash.com" }, // Unsplash for fallbacks
      { protocol: "https", hostname: "via.placeholder.com" }, // Placeholder images
    ],
  },
};

export default nextConfig;
