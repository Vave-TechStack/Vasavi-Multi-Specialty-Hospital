import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/about', '/services', '/doctors', '/testimonials', '/contact', '/appointment'].map(path => ({ url: `https://vasavihospital.com${path}`, lastModified: new Date(), changeFrequency: path ? 'monthly' : 'weekly', priority: path ? .8 : 1 }));
}
