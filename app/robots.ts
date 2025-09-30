import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/privacy', '/terms'],
      disallow: ['/api/', '/admin/', '/parent/', '/children/', '/onboarding/'],
    },
    sitemap: 'https://www.spiritofsanta.club/sitemap.xml',
  }
}