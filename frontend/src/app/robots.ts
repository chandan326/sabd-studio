import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/'],
    },
    sitemap: 'https://sabd-studio.vercel.app/sitemap.xml',
    host: 'https://sabd-studio.vercel.app',
  };
}
