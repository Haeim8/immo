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
      'https://usci.tech/sitemap.xml',
      'https://usci.ca/sitemap.xml',
      'https://usci.fund/sitemap.xml',
    ],
    host: 'https://usci.tech',
  }
}
