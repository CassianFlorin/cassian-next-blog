import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { genPageMetadata } from 'app/seo';
import Link from '@/components/Link';
import siteMetadata from '@/data/siteMetadata';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return genPageMetadata({
    title: t('privacyTitle'),
    description: t('privacyDescription'),
    locale,
    path: '/privacy',
  });
}

type Section = {
  heading: string;
  body: string[];
  links: { label: string; href: string }[];
  /** Render the site's contact address under this section. */
  email?: boolean;
};

/**
 * Privacy policy. AdSense requires one that discloses third-party ad cookies
 * and how to opt out, so keep the advertising section in sync with
 * `data/adsenseConfig.ts` and whatever else the site loads.
 */
export default async function PrivacyPage() {
  const t = await getTranslations('privacy');
  const sections = t.raw('sections') as Section[];

  return (
    <div className="bleed">
      <div className="container-atelier pb-8">
        <header className="grid gap-8 pt-6 md:pt-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="min-w-0 space-y-6">
            <p className="type-meta text-gray-500 dark:text-gray-400">
              {t('updated')}
            </p>
            <h1 className="type-section break-words text-gray-950 dark:text-gray-50">
              {t('title')}
            </h1>
          </div>
          <p className="text-base leading-7 text-gray-600 lg:pb-2 dark:text-gray-400">
            {t('intro')}
          </p>
        </header>

        <div className="mt-16 max-w-3xl space-y-12">
          {sections.map((section, i) => (
            <section
              key={section.heading}
              aria-labelledby={`privacy-${i}`}
              className="grid gap-4 border-t border-gray-900/15 pt-5 sm:grid-cols-[3rem_minmax(0,1fr)] dark:border-white/15"
            >
              <p className="type-meta text-gray-500 tabular-nums dark:text-gray-400">
                {String(i + 1).padStart(2, '0')}
              </p>
              <div className="min-w-0 space-y-4">
                <h2
                  id={`privacy-${i}`}
                  className="text-xl font-semibold tracking-tight text-gray-950 dark:text-gray-50"
                >
                  {section.heading}
                </h2>
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="leading-8 text-gray-700 dark:text-gray-300"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.email && (
                  <p>
                    <Link
                      href={`mailto:${siteMetadata.email}`}
                      className="type-meta text-gray-950 underline underline-offset-4 dark:text-gray-50"
                    >
                      {siteMetadata.email}
                    </Link>
                  </p>
                )}
                {section.links.length > 0 && (
                  <ul className="flex flex-wrap gap-x-6 gap-y-2">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="type-meta inline-flex items-center gap-1.5 text-gray-950 underline-offset-4 hover:underline dark:text-gray-50"
                        >
                          {link.label}
                          <span aria-hidden="true" className="text-gray-500">
                            ↗
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
