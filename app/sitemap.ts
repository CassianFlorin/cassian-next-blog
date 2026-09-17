import { MetadataRoute } from 'next';
import { allBlogs } from 'contentlayer/generated';
import tagData from 'app/tag-data.json';
import { defaultLocale, locales } from '@/lib/i18nRouting';
import { caseStudyProjects, projectSlug } from '@/data/caseStudies';
import { getKnowledgeIndex } from '@/lib/knowledgeData';
import { knowledgeNodeHref } from '@/lib/knowledgeNodes';
import { languageAlternates, localeUrl } from '@/lib/seo';

export const dynamic = 'force-static';

type Entry = MetadataRoute.Sitemap[number];

/**
 * Emit one entry per locale for a locale-less path, each carrying the full
 * hreflang set. Middleware redirects unprefixed URLs, so the sitemap must list
 * the prefixed ones or every crawl hits a redirect.
 */
function localizedEntries(
  path: string,
  options: {
    lastModified: string | Date;
    changeFrequency?: Entry['changeFrequency'];
    priority?: number;
  },
): MetadataRoute.Sitemap {
  const languages = languageAlternates(path);
  return locales.map((locale) => ({
    url: localeUrl(locale, path),
    lastModified: options.lastModified,
    changeFrequency: options.changeFrequency,
    // Secondary locales rank below the default one.
    priority:
      locale === defaultLocale
        ? options.priority
        : Math.max(0.1, (options.priority ?? 0.5) - 0.1),
    alternates: { languages },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allBlogs.filter((post) => !post.draft);
  const today = new Date().toISOString().split('T')[0];

  // Most recent post drives the freshness of the listing pages.
  const latestPostDate =
    posts
      .map((post) => new Date(post.lastmod || post.date).getTime())
      .sort((a, b) => b - a)[0] ?? Date.now();
  const blogLastModified = new Date(latestPostDate).toISOString();

  const staticEntries = [
    { path: '/', changeFrequency: 'daily' as const, priority: 1 },
    { path: '/blog', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/projects', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/knowledge', changeFrequency: 'weekly' as const, priority: 0.7 },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/tags', changeFrequency: 'weekly' as const, priority: 0.6 },
  ].flatMap(({ path, changeFrequency, priority }) =>
    localizedEntries(path, {
      lastModified: path === '/' || path === '/blog' ? blogLastModified : today,
      changeFrequency,
      priority,
    }),
  );

  const postEntries = posts.flatMap((post) =>
    localizedEntries(`/${post.path}`, {
      lastModified: new Date(post.lastmod || post.date).toISOString(),
      changeFrequency: 'monthly',
      priority: 0.8,
    }),
  );

  const projectEntries = caseStudyProjects().flatMap((project) =>
    localizedEntries(`/projects/${projectSlug(project)}`, {
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.7,
    }),
  );

  // Knowledge focus pages change whenever writing is filed under them.
  const knowledgeNodeEntries = getKnowledgeIndex().nodes.flatMap((node) =>
    localizedEntries(knowledgeNodeHref(node.key), {
      lastModified: blogLastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    }),
  );

  const tagCounts = tagData as Record<string, number>;
  const tagEntries = Object.keys(tagCounts).flatMap((tag) =>
    localizedEntries(`/tags/${encodeURI(tag)}`, {
      lastModified: blogLastModified,
      changeFrequency: 'weekly',
      priority: 0.5,
    }),
  );

  return [
    ...staticEntries,
    ...postEntries,
    ...projectEntries,
    ...knowledgeNodeEntries,
    ...tagEntries,
  ];
}
