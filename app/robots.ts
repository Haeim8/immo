import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: [
      'https://cantorfi.tech/sitemap.xml',
      'https://cantorfi.ca/sitemap.xml',
      'https://cantorfi.fund/sitemap.xml',
    ],
    host: 'https://cantorfi.tech',
  }
}
