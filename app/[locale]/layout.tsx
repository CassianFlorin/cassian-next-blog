import { Space_Grotesk } from 'next/font/google';
import { Analytics, AnalyticsConfig } from 'pliny/analytics';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { SearchProvider, SearchConfig } from 'pliny/search';
import Header from '@/components/Header';
import SectionContainer from '@/components/SectionContainer';
import Footer from '@/components/Footer';
import RouteTransitionOrchestrator from '@/components/RouteTransitionOrchestrator';
import EntryCurtain from '@/components/EntryCurtain';
import siteMetadata from '@/data/siteMetadata';
import { ThemeProviders } from '../theme-providers';
import { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { isLocale, locales } from '@/lib/i18nRouting';
import { buildSiteJsonLd } from '@/lib/structuredData';
import {
  absoluteImageList,
  buildAlternates,
  localeUrl,
  ogLocaleByLocale,
  resolveLocale,
} from '@/lib/seo';

const space_grotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'seo' });
  const title = t('siteTitle');
  const description = t('siteDescription');
  const images = absoluteImageList(siteMetadata.socialBanner);

  return {
    metadataBase: new URL(siteMetadata.siteUrl),
    title: {
      // `absolute` opts this layout's own title out of the root template,
      // which would otherwise append the site name a second time.
      absolute: title,
      template: `%s | ${title}`,
    },
    description,
    alternates: {
      ...buildAlternates(resolvedLocale, '/'),
      types: {
        'application/rss+xml': `${siteMetadata.siteUrl}/feed.xml`,
      },
    },
    openGraph: {
      title,
      description,
      url: localeUrl(resolvedLocale, '/'),
      siteName: siteMetadata.title,
      images,
      locale: ogLocaleByLocale[resolvedLocale],
      alternateLocale: locales
        .filter((item) => item !== resolvedLocale)
        .map((item) => ogLocaleByLocale[item]),
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
      images,
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // `[locale]` matches any single path segment, and middleware skips paths with
  // a dot in them — so `/favicon.ico` and friends land here with a bogus locale.
  // Without this guard the message import throws and the request 500s.
  if (!isLocale(locale)) {
    notFound();
  }
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ThemeProviders>
        <JsonLd data={buildSiteJsonLd(resolveLocale(locale))} />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('entry-curtain-played')==='1'){document.documentElement.classList.add('entry-curtain-done')}}catch(e){}`,
          }}
        />
        <EntryCurtain />
        {/* Vercel Web Analytics: same-origin script, so the strict CSP in
            next.config.js covers it without an allowlist entry. */}
        <VercelAnalytics />
        {/* Kept as the switch point for the providers still listed in
            siteMetadata.analytics; renders nothing while none is configured. */}
        <Analytics
          analyticsConfig={siteMetadata.analytics as AnalyticsConfig}
        />
        <div className="site-backdrop" aria-hidden="true">
          <div className="site-backdrop-aurora" />
          <div className="site-backdrop-grid" />
        </div>
        <SectionContainer>
          <SearchProvider searchConfig={siteMetadata.search as SearchConfig}>
            <RouteTransitionOrchestrator>
              <div data-route-section="header" className="sticky top-0 z-50">
                <Header />
              </div>
              <main className="mb-auto" data-route-section="main">
                {children}
              </main>
              <div data-route-section="footer">
                <Footer />
              </div>
            </RouteTransitionOrchestrator>
          </SearchProvider>
        </SectionContainer>
      </ThemeProviders>
    </NextIntlClientProvider>
  );
}
