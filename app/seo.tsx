import { Metadata } from 'next';
import siteMetadata from '@/data/siteMetadata';
import { defaultLocale, type Locale } from '@/lib/i18nRouting';
import {
  absoluteImageList,
  buildAlternates,
  localeUrl,
  ogLocaleByLocale,
  resolveLocale,
} from '@/lib/seo';

interface PageSEOProps {
  title: string;
  description?: string;
  image?: string;
  /** Locale of the page being rendered. Defaults to the site default. */
  locale?: Locale | string;
  /**
   * Locale-less path of the page, e.g. `/blog`. Drives the canonical URL and
   * the hreflang alternates, so it should be set on every page.
   */
  path?: string;
  /** Set to false on paginated/filtered pages that should not be indexed. */
  index?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export function genPageMetadata({
  title,
  description,
  image,
  locale,
  path = '/',
  index = true,
  ...rest
}: PageSEOProps): Metadata {
  const resolvedLocale = resolveLocale(locale ?? defaultLocale);
  const resolvedDescription = description || siteMetadata.description;
  const images = absoluteImageList(image);

  return {
    title,
    description: resolvedDescription,
    alternates: buildAlternates(resolvedLocale, path),
    ...(index ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title: `${title} | ${siteMetadata.title}`,
      description: resolvedDescription,
      url: localeUrl(resolvedLocale, path),
      siteName: siteMetadata.title,
      images,
      locale: ogLocaleByLocale[resolvedLocale],
      type: 'website',
    },
    twitter: {
      title: `${title} | ${siteMetadata.title}`,
      description: resolvedDescription,
      card: 'summary_large_image',
      images,
    },
    ...rest,
  };
}
