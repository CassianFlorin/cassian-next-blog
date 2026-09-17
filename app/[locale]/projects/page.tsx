import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { genPageMetadata } from 'app/seo';
import JsonLd from '@/components/JsonLd';
import Link from '@/components/Link';
import Reveal from '@/components/motion/Reveal';
import {
  caseStudyProjects,
  getCaseStudy,
  projectHref,
} from '@/data/caseStudies';
import projectsData from '@/data/projectsData';
import { resolveLocale } from '@/lib/seo';
import { buildCollectionPageJsonLd } from '@/lib/structuredData';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return genPageMetadata({
    title: t('projectsTitle'),
    description: t('projectsDescription'),
    locale,
    path: '/projects',
  });
}

const pad = (value: number) => String(value).padStart(2, '0');

/** CF / 01 · Work — case studies first, then ecosystem and open-source work. */
export default async function ProjectsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const lang = resolveLocale(locale);
  const t = await getTranslations('projects');
  const seo = await getTranslations({ locale, namespace: 'seo' });

  const featured = caseStudyProjects();
  const others = projectsData.filter((project) => !getCaseStudy(project.id));

  return (
    <div className="bleed">
      <JsonLd
        data={buildCollectionPageJsonLd(lang, {
          name: seo('projectsTitle'),
          description: seo('projectsDescription'),
          path: '/projects',
          items: featured.map((project) => ({
            title: project.title,
            path: projectHref(project),
          })),
        })}
      />

      <div className="container-atelier pb-8">
        <header className="grid gap-8 pt-6 md:pt-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="space-y-6">
            <p className="type-meta text-gray-500 dark:text-gray-400">
              CF / 01
            </p>
            <h1 className="type-section text-gray-950 dark:text-gray-50">
              {t('index.title')}
            </h1>
            <p className="type-editorial text-2xl text-gray-600 italic sm:text-3xl dark:text-gray-300">
              {t('index.lede')}
            </p>
          </div>
          <p className="text-base leading-7 text-gray-600 lg:pb-2 dark:text-gray-400">
            {t('index.description')}
          </p>
        </header>

        <section aria-labelledby="case-studies" className="mt-20 md:mt-28">
          <h2
            id="case-studies"
            className="type-meta flex items-baseline justify-between border-b border-gray-900/20 pb-4 text-gray-950 dark:border-white/20 dark:text-gray-50"
          >
            {t('index.caseStudies')}
            <span className="text-gray-500 dark:text-gray-400">
              {pad(featured.length)}
            </span>
          </h2>
          <Reveal variant="drift" as="ol">
            {featured.map((project, i) => (
              <li
                key={project.id}
                className="border-b border-gray-900/15 dark:border-white/15"
              >
                <Link
                  href={projectHref(project)}
                  className="group grid gap-6 py-10 transition-colors duration-500 hover:bg-gray-900/[0.02] md:grid-cols-[4rem_minmax(0,1fr)_15rem] md:gap-8 md:px-4 md:py-14 dark:hover:bg-white/[0.02]"
                >
                  <span className="type-meta text-gray-500 md:pt-4 dark:text-gray-400">
                    {pad(i + 1)}
                  </span>
                  <span className="min-w-0 space-y-5">
                    <span className="block text-5xl leading-none font-semibold tracking-[-0.04em] text-gray-950 md:text-7xl dark:text-gray-50">
                      {project.title}
                    </span>
                    <span className="type-meta block text-gray-700 dark:text-gray-300">
                      {t(`items.${project.id}.tagline`)}
                    </span>
                    <span className="block max-w-2xl text-lg leading-8 text-gray-600 transition-colors duration-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100">
                      {t(`items.${project.id}.why`)}
                    </span>
                  </span>
                  <span className="flex flex-col justify-between gap-6 md:items-end md:pt-4 md:text-right">
                    <span className="space-y-2">
                      <span className="type-meta block text-gray-500 dark:text-gray-400">
                        {t(`items.${project.id}.status`)}
                      </span>
                      <span className="type-meta block text-gray-400 dark:text-gray-500">
                        {project.techStack.slice(0, 3).join(' · ')}
                      </span>
                    </span>
                    <span className="type-meta inline-flex items-center gap-2 text-gray-950 dark:text-gray-50">
                      {t('index.readCaseStudy')}
                      <span
                        aria-hidden="true"
                        className="ease-atelier transition-transform duration-200 group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </Reveal>
        </section>

        {others.length > 0 && (
          <section aria-labelledby="ecosystem" className="mt-24">
            <h2
              id="ecosystem"
              className="type-meta border-b border-gray-900/20 pb-4 text-gray-950 dark:border-white/20 dark:text-gray-50"
            >
              {t('index.ecosystem')}
            </h2>
            <ul className="divide-y divide-gray-900/10 dark:divide-white/10">
              {others.map((project) => {
                const href = projectHref(project);
                return (
                  <li key={project.id}>
                    <Link
                      href={href}
                      className="group grid gap-3 py-7 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_auto] md:items-baseline md:gap-8"
                    >
                      <span className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
                        {project.title}
                      </span>
                      <span className="space-y-2">
                        <span className="block leading-7 text-gray-600 dark:text-gray-400">
                          {t(`items.${project.id}.description`)}
                        </span>
                        <span className="type-meta block text-gray-400 dark:text-gray-500">
                          {t(`items.${project.id}.status`)} ·{' '}
                          {project.techStack.slice(0, 3).join(' · ')}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-gray-400 transition-colors group-hover:text-gray-950 dark:group-hover:text-gray-50"
                      >
                        {href.startsWith('/') ? '→' : '↗'}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
