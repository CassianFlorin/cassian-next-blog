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
  /** One-sentence conclusion; becomes schema.org `abstract`. */
  tldr?: string;
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
    abstract: post.tldr,
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

/** Coerce a frontmatter value to a trimmed string, or undefined if unusable. */
function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Q&A pairs from the post's `faq` frontmatter.
 *
 * Google stopped showing FAQ rich results for most sites in 2023, so this is
 * not about SERP decoration — it hands generative engines pre-paired questions
 * and self-contained answers instead of making them infer both from prose.
 * Returns null when the post has no usable entries.
 */
export function buildFaqPageJsonLd(
  locale: Locale,
  options: { path: string; canonicalUrl?: string; faq: unknown },
): JsonLd | null {
  if (!Array.isArray(options.faq)) return null;

  const entries = options.faq
    .map((entry) => ({
      question: text((entry as Record<string, unknown>)?.q),
      answer: text((entry as Record<string, unknown>)?.a),
    }))
    .filter(
      (entry): entry is { question: string; answer: string } =>
        Boolean(entry.question) && Boolean(entry.answer),
    );

  if (entries.length === 0) return null;

  const url = options.canonicalUrl || localeUrl(locale, options.path);

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    inLanguage: hreflangByLocale[locale],
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': `${url}#article` },
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}

interface HowToStepJsonLd {
  '@type': 'HowToStep';
  name: string;
  text: string;
  url?: string;
}

/**
 * Step-by-step guides from the post's `howto` frontmatter.
 *
 * Step `url` may be a bare `#anchor`, which is resolved against the post URL so
 * an engine can cite the exact section.
 */
export function buildHowToJsonLd(
  locale: Locale,
  options: {
    path: string;
    canonicalUrl?: string;
    title: string;
    summary?: string;
    howto: unknown;
  },
): JsonLd | null {
  const howto = options.howto as Record<string, unknown> | undefined;
  if (!howto || typeof howto !== 'object' || !Array.isArray(howto.steps)) {
    return null;
  }

  const url = options.canonicalUrl || localeUrl(locale, options.path);

  const steps = howto.steps
    .map((step): HowToStepJsonLd | null => {
      const raw = step as Record<string, unknown>;
      const name = text(raw?.name);
      const stepText = text(raw?.text);
      if (!name || !stepText) return null;
      const anchor = text(raw?.url);
      return {
        '@type': 'HowToStep',
        name,
        text: stepText,
        ...(anchor
          ? { url: anchor.startsWith('#') ? `${url}${anchor}` : anchor }
          : {}),
      };
    })
    .filter((step): step is HowToStepJsonLd => step !== null);

  if (steps.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${url}#howto`,
    name: text(howto.name) || options.title,
    description: text(howto.description) || options.summary,
    // ISO 8601 duration, e.g. `PT30M`.
    totalTime: text(howto.totalTime),
    inLanguage: hreflangByLocale[locale],
    isPartOf: { '@id': WEBSITE_ID },
    step: steps,
  };
}

/**
 * The concept a "what is X" post defines, from the `definedTerm` frontmatter.
 * Gives engines an explicit term→definition edge rather than one buried in the
 * opening paragraphs.
 */
export function buildDefinedTermJsonLd(
  locale: Locale,
  options: { path: string; canonicalUrl?: string; definedTerm: unknown },
): JsonLd | null {
  const term = options.definedTerm as Record<string, unknown> | undefined;
  if (!term || typeof term !== 'object') return null;

  const name = text(term.name);
  const description = text(term.description);
  if (!name || !description) return null;

  const url = options.canonicalUrl || localeUrl(locale, options.path);
  const sameAsList = Array.isArray(term.sameAs)
    ? term.sameAs.map(text).filter((item): item is string => Boolean(item))
    : [];

  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': `${url}#term`,
    name,
    description,
    alternateName: text(term.alternateName),
    inLanguage: hreflangByLocale[locale],
    url,
    sameAs: sameAsList.length > 0 ? sameAsList : undefined,
    subjectOf: { '@id': `${url}#article` },
  };
}

/**
 * `JSON.stringify` drops `undefined` values, and `<` must be escaped so the
 * payload can never break out of the surrounding `<script>` tag.
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
