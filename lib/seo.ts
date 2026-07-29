import type { Metadata } from 'next';
import siteMetadata from '@/data/siteMetadata';
import {
  defaultLocale,
  isLocale,
  locales,
  type Locale,
} from '@/lib/i18nRouting';

/** Site origin without a trailing slash, e.g. `https://www.cassianflorin.com`. */
export const SITE_URL = siteMetadata.siteUrl.replace(/\/+$/, '');

/** `hreflang` value emitted for each supported locale. */
export const hreflangByLocale: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en',
};

/** `og:locale` value for each supported locale. */
export const ogLocaleByLocale: Record<Locale, string> = {
  zh: 'zh_CN',
  en: 'en_US',
};

/** `<html lang>` value for each supported locale. */
export const htmlLangByLocale: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en',
};

/** BCP-47 tag used by schema.org `inLanguage`. */
export const contentLanguage = hreflangByLocale[defaultLocale];

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

/**
 * Normalize a locale-less route into a leading-slash, no-trailing-slash path.
 * `next.config.js` sets `trailingSlash: false`, so canonical URLs must match.
 */
export function normalizePath(path = '/'): string {
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const withoutTrailing = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailing === '' ? '/' : withoutTrailing;
}

/** Prefix a locale-less path with its locale segment: `/blog` -> `/zh/blog`. */
export function localePath(locale: Locale, path = '/'): string {
  const normalized = normalizePath(path);
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}

/** Absolute URL for a path that already contains its locale segment. */
export function absoluteUrl(path = '/'): string {
  const normalized = normalizePath(path);
  return normalized === '/' ? `${SITE_URL}/` : `${SITE_URL}${normalized}`;
}

/** Absolute, locale-prefixed URL for a locale-less path. */
export function localeUrl(locale: Locale, path = '/'): string {
  return absoluteUrl(localePath(locale, path));
}

/**
 * Every language variant of a locale-less path, keyed by `hreflang`.
 * `x-default` points at the default locale so search engines have a fallback.
 */
export function languageAlternates(path = '/'): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[hreflangByLocale[locale]] = localeUrl(locale, path);
  }
  languages['x-default'] = localeUrl(defaultLocale, path);
  return languages;
}

/**
 * Canonical + hreflang block for a page.
 *
 * `canonicalOverride` supports the per-post `canonicalUrl` frontmatter field
 * (used when a post is republished from somewhere else).
 */
export function buildAlternates(
  locale: Locale,
  path = '/',
  canonicalOverride?: string,
): Metadata['alternates'] {
  return {
    canonical: canonicalOverride || localeUrl(locale, path),
    languages: languageAlternates(path),
  };
}

/** Turn a possibly-relative asset path into an absolute URL. */
export function absoluteAsset(src?: string): string {
  const image = src || siteMetadata.socialBanner;
  if (/^https?:\/\//.test(image)) return image;
  return `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
}

/** Normalize `images` frontmatter (string | string[] | undefined) to absolute URLs. */
export function absoluteImageList(images?: unknown): string[] {
  if (typeof images === 'string') return [absoluteAsset(images)];
  if (Array.isArray(images) && images.length > 0) {
    return images
      .filter((image): image is string => typeof image === 'string')
      .map(absoluteAsset);
  }
  return [absoluteAsset(siteMetadata.socialBanner)];
}
