import siteMetadata from '@/data/siteMetadata';
import type { Locale } from '@/lib/i18nRouting';
import {
  SITE_URL,
  absoluteAsset,
  absoluteImageList,
  hreflangByLocale,
  localeUrl,
} from '@/lib/seo';

type JsonLd = Record<string, unknown>;

/** Stable @id values so the graph nodes can reference each other. */
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** Public profiles used for schema.org `sameAs`. */
function sameAs(): string[] {
  return [
    siteMetadata.github,
    siteMetadata.x,
    siteMetadata.linkedin,
    siteMetadata.mastodon,
    siteMetadata.bluesky,
    siteMetadata.youtube,
    siteMetadata.medium,
  ].filter((url): url is string => Boolean(url));
}

/** The site owner — also used as the publisher of every post. */
export function buildPersonJsonLd(): JsonLd {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: siteMetadata.author,
    url: SITE_URL,
    email: siteMetadata.email,
    image: absoluteAsset('/static/images/avatar.png'),
    sameAs: sameAs(),
  };
}

export function buildWebSiteJsonLd(locale: Locale): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: localeUrl(locale, '/'),
    name: siteMetadata.title,
    description: siteMetadata.description,
    inLanguage: hreflangByLocale[locale],
    publisher: { '@id': PERSON_ID },
    author: { '@id': PERSON_ID },
  };
}

/** Sitewide graph rendered once per page from the locale layout. */
export function buildSiteJsonLd(locale: Locale): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [buildPersonJsonLd(), buildWebSiteJsonLd(locale)],
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Locale-less path, e.g. `/blog`. Omit for the current (last) crumb. */
  path?: string;
}

export function buildBreadcrumbJsonLd(
  locale: Locale,
  items: BreadcrumbItem[],
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: localeUrl(locale, item.path) } : {}),
    })),
  };
}

export interface BlogPostingInput {
  title: string;
  summary?: string;
  date: string;
  lastmod?: string;
  tags?: string[];
  images?: unknown;
  /** Locale-less path, e.g. `/blog/my-post`. */
  path: string;
  /** Frontmatter `canonicalUrl`, when the post lives elsewhere first. */
  canonicalUrl?: string;
  authors: { name: string }[];
  readingTimeWords?: number;
}

export function buildBlogPostingJsonLd(
  locale: Locale,
  post: BlogPostingInput,
): JsonLd {
  const url = post.canonicalUrl || localeUrl(locale, post.path);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: post.title,
    name: post.title,
    description: post.summary,
    inLanguage: hreflangByLocale[locale],
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.lastmod || post.date).toISOString(),
    image: absoluteImageList(post.images),
    keywords: post.tags?.length ? post.tags.join(', ') : undefined,
    articleSection: post.tags?.[0],
    wordCount: post.readingTimeWords,
    author:
      post.authors.length > 0
        ? post.authors.map((author) => ({
            '@type': 'Person',
            name: author.name,
          }))
        : [{ '@type': 'Person', name: siteMetadata.author }],
    publisher: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

/** Listing pages (blog index, tag pages) as a CollectionPage. */
export function buildCollectionPageJsonLd(
  locale: Locale,
  options: {
    name: string;
    description?: string;
    path: string;
    items: { title: string; path: string }[];
  },
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${localeUrl(locale, options.path)}#collection`,
    url: localeUrl(locale, options.path),
    name: options.name,
    description: options.description,
    inLanguage: hreflangByLocale[locale],
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: options.items.length,
      itemListElement: options.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        url: localeUrl(locale, item.path),
      })),
    },
  };
}

/**
 * `JSON.stringify` drops `undefined` values, and `<` must be escaped so the
 * payload can never break out of the surrounding `<script>` tag.
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
