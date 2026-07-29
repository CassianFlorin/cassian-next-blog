import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // API routes and build assets are never useful in an index. The query
        // variants render the same content as their clean URLs, so blocking
        // them keeps duplicates out of the index.
        disallow: ['/api/', '/_next/', '/*?page=', '/*?post='],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
