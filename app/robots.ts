import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Limit crawling of API routes and duplicate query variants. Robots
        // rules do not guarantee exclusion from the index. Keep Next.js assets
        // crawlable so search engines can render pages.
        disallow: ['/api/', '/*?page=', '/*?post='],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
