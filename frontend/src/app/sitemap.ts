import type { MetadataRoute } from 'next';

const baseUrl = 'https://sabd-studio.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/login`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/register`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
