import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer';
import { allBlogs } from 'contentlayer/generated';
import { genPageMetadata } from 'app/seo';
import JsonLd from '@/components/JsonLd';
import Link from '@/components/Link';
import Reveal from '@/components/motion/Reveal';
import CaseStudyContents from '@/components/work/CaseStudyContents';
import RichText from '@/components/work/RichText';
import TraceList, { type Trace } from '@/components/writing/TraceList';
import {
  caseStudyProjects,
  findProjectBySlug,
  getCaseStudy,
  projectSlug,
} from '@/data/caseStudies';
import { getKnowledgeIndex } from '@/lib/knowledgeData';
import { knowledgeNodeHref } from '@/lib/knowledgeNodes';
import { resolveLocale } from '@/lib/seo';
import {
  buildBreadcrumbJsonLd,
  buildProjectJsonLd,
} from '@/lib/structuredData';

type Params = Promise<{ locale: string; slug: string }>;

const CHAPTERS = [
  { id: 'why', label: 'Why' },
  { id: 'problem', label: 'Problem' },
  { id: 'system', label: 'System' },
  { id: 'implementation', label: 'Implementation' },
  { id: 'decisions', label: 'Decisions' },
  { id: 'result', label: 'Result' },
  { id: 'related', label: 'Related' },
] as const;

const SAME_TERRITORY_LIMIT = 4;

const pad = (value: number) => String(value).padStart(2, '0');

export function generateStaticParams() {
  return caseStudyProjects().map((project) => ({
    slug: projectSlug(project),
  }));
}

function load(slug: string, locale: string) {
  const project = findProjectBySlug(slug);
  const entry = project && getCaseStudy(project.id);
  if (!project || !entry) return null;
  const study = entry.content[resolveLocale(locale)];
  return { project, entry, study };
}

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const loaded = load(slug, locale);
  if (!loaded) return {};
  const seo = await getTranslations({ locale, namespace: 'seo' });

  return genPageMetadata({
    title: seo('projectCaseTitle', { project: loaded.project.title }),
    description: seo('projectCaseDescription', {
      project: loaded.project.title,
      summary: loaded.study.summary,
    }),
    locale,
    path: `/projects/${slug}`,
  });
}

function Chapter({
  id,
  index,
  label,
  localLabel,
  children,
}: {
  id: string;
  index: number;
  label: string;
  localLabel: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-8">
      <header className="flex items-baseline gap-4 border-b border-gray-900/20 pb-4 dark:border-white/20">
        <span className="type-meta text-gray-400 dark:text-gray-500">
          {pad(index + 1)}
        </span>
        <h2
          id={`${id}-title`}
          className="type-meta text-gray-950 dark:text-gray-50"
        >
          {label}
        </h2>
        {localLabel && (
          <span className="type-meta text-gray-500 dark:text-gray-400">
            {localLabel}
          </span>
        )}
      </header>
      <div className="pt-10">{children}</div>
    </section>
  );
}

export default async function ProjectCaseStudyPage(props: { params: Params }) {
  const { locale, slug } = await props.params;
  const loaded = load(slug, locale);
  if (!loaded) notFound();
  const { project, entry, study } = loaded;
  const lang = resolveLocale(locale);

  const t = await getTranslations('projects');
  const tk = await getTranslations('knowledge');
  const ordered = caseStudyProjects();
  const position = ordered.findIndex((item) => item.id === project.id);
  const previous = ordered[position - 1];
  const next = ordered[position + 1];

  // Related writing: posts explicitly about the project first, then the most
  // recent articles from the territories the project belongs to.
  const posts = allCoreContent(sortPosts(allBlogs));
  const explicit: Trace[] = (entry.relatedPostSlugs || [])
    .map((postSlug) => posts.find((post) => post.slug === postSlug))
    .filter((post) => post !== undefined)
    .map((post) => ({
      key: post.slug,
      href: `/${post.path}`,
      title: post.title,
      date: post.date,
      tags: post.tags || [],
    }));

  const index = getKnowledgeIndex();
  const territories = (project.knowledgeNodes || [])
    .map((key) => index.byKey.get(key))
    .filter((node) => node !== undefined);
  const explicitHrefs = new Set(explicit.map((trace) => trace.href));
  const scored = new Map<string, { trace: Trace; score: number }>();
  territories.forEach((node) =>
    node.articles.forEach((article) => {
      if (explicitHrefs.has(article.href)) return;
      const current = scored.get(article.href);
      scored.set(article.href, {
        score: (current?.score || 0) + 1,
        trace: {
          key: article.href,
          href: article.href,
          title: article.title,
          date: article.date,
          tags: article.tags,
        },
      });
    }),
  );
  const sameTerritory = [...scored.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.trace.date || '').localeCompare(a.trace.date || ''),
    )
    .slice(0, SAME_TERRITORY_LIMIT)
    .map(({ trace }) => trace)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const tagline = t(`items.${project.id}.tagline`);
  const source = entry.links.find((link) => link.kind === 'source');
  const site = entry.links.find((link) => link.kind === 'site');
  const chapterLabel = (id: (typeof CHAPTERS)[number]['id']) =>
    t(`caseStudy.chapters.${id}`);

  const meta = [
    { label: t('caseStudy.status'), value: t(`items.${project.id}.status`) },
    ...(entry.started
      ? [{ label: t('caseStudy.started'), value: entry.started }]
      : []),
    {
      label: t('caseStudy.stack'),
      value: project.techStack.slice(0, 4).join(' · '),
    },
  ];

  return (
    <div className="bleed">
      <JsonLd
        data={buildProjectJsonLd(lang, {
          name: project.title,
          description: study.summary,
          path: `/projects/${slug}`,
          keywords: project.techStack,
          codeRepository: source?.href,
          productUrl: site?.href,
          operatingSystem:
            project.category === 'app' ? 'iOS, Android' : undefined,
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd(lang, [
          { name: t('caseStudy.work'), path: '/projects' },
          { name: project.title },
        ])}
      />

      <article className="container-atelier pb-8">
        <header className="pt-6 md:pt-10">
          <div className="type-meta flex flex-wrap items-center justify-between gap-4">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 text-gray-500 dark:text-gray-400">
                <li>
                  <Link
                    href="/projects"
                    className="transition-colors hover:text-gray-950 dark:hover:text-gray-50"
                  >
                    CF / 01 · {t('caseStudy.work')}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li
                  aria-current="page"
                  className="text-gray-950 dark:text-gray-50"
                >
                  {project.title}
                </li>
              </ol>
            </nav>
            <span className="text-gray-500 dark:text-gray-400">
              CF / PROJECT {pad(position + 1)}
            </span>
          </div>

          <h1 className="type-hero mt-14 text-gray-950 normal-case md:mt-20 dark:text-gray-50">
            {project.title}
          </h1>
          <p className="type-editorial mt-8 max-w-4xl text-3xl leading-tight text-gray-800 sm:text-4xl lg:text-5xl dark:text-gray-200">
            {tagline}
          </p>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-400">
            {study.summary}
          </p>

          <dl className="mt-14 grid border-y border-gray-900/15 sm:grid-cols-2 lg:grid-cols-4 dark:border-white/15">
            {meta.map((item) => (
              <div
                key={item.label}
                className="space-y-2 border-b border-gray-900/10 py-5 last:border-b-0 sm:pr-6 lg:border-r lg:border-b-0 lg:pl-6 lg:first:pl-0 dark:border-white/10"
              >
                <dt className="type-meta text-gray-500 dark:text-gray-400">
                  {item.label}
                </dt>
                <dd className="text-gray-950 dark:text-gray-50">
                  {item.value}
                </dd>
              </div>
            ))}
            <div className="space-y-2 py-5 lg:pl-6">
              <dt className="type-meta text-gray-500 dark:text-gray-400">
                {t('caseStudy.links')}
              </dt>
              <dd>
                <ul className="space-y-1">
                  {entry.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1.5 text-gray-950 underline-offset-4 hover:underline dark:text-gray-50"
                      >
                        {link.label[lang]}
                        <span aria-hidden="true" className="text-gray-400">
                          ↗
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </header>

        <div className="mt-20 grid gap-14 md:mt-28 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-16 xl:gap-24">
          <aside className="hidden lg:block">
            <CaseStudyContents
              title={t('caseStudy.contents')}
              chapters={CHAPTERS.map((chapter) => ({
                id: chapter.id,
                label: chapter.label,
              }))}
            />
          </aside>

          <div className="min-w-0 space-y-24 md:space-y-32">
            <Chapter
              id="why"
              index={0}
              label="Why"
              localLabel={chapterLabel('why')}
            >
              <div className="max-w-3xl space-y-6">
                {study.why.map((paragraph, i) => (
                  <p
                    key={i}
                    className={
                      i === 0
                        ? 'type-editorial text-2xl leading-snug text-gray-950 md:text-3xl dark:text-gray-50'
                        : 'text-lg leading-8 text-gray-700 dark:text-gray-300'
                    }
                  >
                    <RichText text={paragraph} />
                  </p>
                ))}
              </div>
            </Chapter>

            <Chapter
              id="problem"
              index={1}
              label="Problem"
              localLabel={chapterLabel('problem')}
            >
              <ol className="max-w-3xl divide-y divide-gray-900/10 dark:divide-white/10">
                {study.problem.map((item, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 py-5 first:pt-0"
                  >
                    <span className="type-meta pt-1.5 text-gray-400 dark:text-gray-500">
                      {pad(i + 1)}
                    </span>
                    <p className="text-lg leading-8 text-gray-800 dark:text-gray-200">
                      <RichText text={item} />
                    </p>
                  </li>
                ))}
              </ol>
            </Chapter>

            <Chapter
              id="system"
              index={2}
              label="System"
              localLabel={chapterLabel('system')}
            >
              <p className="type-editorial max-w-3xl text-2xl leading-snug text-gray-950 md:text-3xl dark:text-gray-50">
                <RichText text={study.system.intro} />
              </p>
              <Reveal variant="rise" className="mt-12">
                <ol
                  aria-label={t('caseStudy.systemLabel', {
                    project: project.title,
                  })}
                  className="max-w-3xl"
                >
                  {study.system.layers.map((layer, i) => (
                    <li key={layer.title}>
                      {i > 0 && (
                        <span
                          aria-hidden="true"
                          className="ml-8 block h-8 w-px bg-gray-900/25 dark:bg-white/25"
                        />
                      )}
                      <div className="grid gap-3 border border-gray-900/20 bg-gray-50 p-6 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8 dark:border-white/20 dark:bg-white/[0.02]">
                        <p className="space-y-1">
                          <span className="type-meta block text-gray-400 dark:text-gray-500">
                            L{i + 1}
                          </span>
                          <span className="block font-semibold tracking-tight text-gray-950 dark:text-gray-50">
                            {layer.title}
                          </span>
                        </p>
                        <p className="leading-7 text-gray-700 dark:text-gray-300">
                          <RichText text={layer.body} />
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </Chapter>

            <Chapter
              id="implementation"
              index={3}
              label="Implementation"
              localLabel={chapterLabel('implementation')}
            >
              <ul className="grid gap-x-12 gap-y-10 md:grid-cols-2">
                {study.implementation.map((item) => (
                  <li key={item.title} className="space-y-3">
                    <h3 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
                      {item.title}
                    </h3>
                    <p className="leading-7 text-gray-600 dark:text-gray-400">
                      <RichText text={item.body} />
                    </p>
                  </li>
                ))}
              </ul>
            </Chapter>

            <Chapter
              id="decisions"
              index={4}
              label="Decisions"
              localLabel={chapterLabel('decisions')}
            >
              <ol className="max-w-3xl space-y-12">
                {study.decisions.map((decision, i) => (
                  <li
                    key={decision.title}
                    className="grid gap-3 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-6"
                  >
                    <span className="type-editorial text-3xl text-gray-400 italic dark:text-gray-500">
                      D{i + 1}
                    </span>
                    <div className="space-y-3">
                      <h3 className="text-2xl leading-snug font-semibold tracking-tight text-gray-950 dark:text-gray-50">
                        {decision.title}
                      </h3>
                      <p className="text-lg leading-8 text-gray-700 dark:text-gray-300">
                        <RichText text={decision.body} />
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Chapter>

            <Chapter
              id="result"
              index={5}
              label="Result"
              localLabel={chapterLabel('result')}
            >
              <dl className="grid border-y border-gray-900/15 sm:grid-cols-3 dark:border-white/15">
                {study.result.facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="space-y-2 border-b border-gray-900/10 py-6 last:border-b-0 sm:border-r sm:border-b-0 sm:px-6 sm:first:pl-0 sm:last:border-r-0 dark:border-white/10"
                  >
                    <dt className="type-meta text-gray-500 dark:text-gray-400">
                      {fact.label}
                    </dt>
                    <dd className="text-xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-10 max-w-3xl space-y-5">
                {study.result.notes.map((note, i) => (
                  <p
                    key={i}
                    className="text-lg leading-8 text-gray-700 dark:text-gray-300"
                  >
                    <RichText text={note} />
                  </p>
                ))}
              </div>
            </Chapter>

            <Chapter
              id="related"
              index={6}
              label="Related"
              localLabel={chapterLabel('related')}
            >
              <div className="grid gap-14 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-16">
                {territories.length > 0 && (
                  <div>
                    <h3 className="type-meta text-gray-500 dark:text-gray-400">
                      {t('caseStudy.relatedNodes')}
                    </h3>
                    <ul className="mt-4">
                      {territories.map((node) => (
                        <li key={node.key}>
                          <Link
                            href={knowledgeNodeHref(node.key)}
                            className="group flex items-baseline justify-between gap-4 border-b border-gray-900/10 py-3 dark:border-white/10"
                          >
                            <span className="group-hover:text-primary-700 dark:group-hover:text-primary-300 text-gray-950 transition-colors dark:text-gray-50">
                              {tk(`nodes.${node.key}.label`)}
                            </span>
                            <span className="font-mono text-xs text-gray-400 tabular-nums">
                              {pad(node.articles.length)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="min-w-0 space-y-12">
                  {explicit.length > 0 && (
                    <div>
                      <h3 className="type-meta mb-2 text-gray-500 dark:text-gray-400">
                        {t('caseStudy.relatedArticles')}
                      </h3>
                      <TraceList traces={explicit} size="compact" />
                    </div>
                  )}
                  {sameTerritory.length > 0 && (
                    <div>
                      <h3 className="type-meta mb-2 text-gray-500 dark:text-gray-400">
                        {t('caseStudy.sameTerritory')}
                      </h3>
                      <TraceList traces={sameTerritory} size="compact" />
                    </div>
                  )}
                </div>
              </div>
            </Chapter>

            {source && (
              <Link
                href={source.href}
                className="group flex items-center justify-between gap-6 border-y border-gray-900/20 py-10 dark:border-white/20"
              >
                <span className="text-3xl font-semibold tracking-tight text-gray-950 md:text-5xl dark:text-gray-50">
                  GitHub
                </span>
                <span
                  aria-hidden="true"
                  className="ease-atelier text-3xl text-gray-400 transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-gray-950 md:text-5xl dark:group-hover:text-gray-50"
                >
                  ↗
                </span>
              </Link>
            )}
          </div>
        </div>

        {(previous || next) && (
          <nav
            aria-label={t('caseStudy.work')}
            className="mt-28 grid border-t border-gray-900/20 sm:grid-cols-2 dark:border-white/20"
          >
            {[previous, next].map((item, i) =>
              item ? (
                <Link
                  key={item.id}
                  href={`/projects/${projectSlug(item)}`}
                  className={`group block space-y-3 py-8 ${
                    i === 1
                      ? 'border-t border-gray-900/10 sm:border-t-0 sm:border-l sm:pl-8 sm:text-right dark:border-white/10'
                      : 'sm:pr-8'
                  }`}
                >
                  <span className="type-meta block text-gray-500 dark:text-gray-400">
                    {i === 0
                      ? `← ${t('caseStudy.previous')}`
                      : `${t('caseStudy.next')} →`}
                  </span>
                  <span className="block text-3xl font-semibold tracking-tight text-gray-950 transition-colors group-hover:text-gray-600 dark:text-gray-50 dark:group-hover:text-gray-300">
                    {item.title}
                  </span>
                </Link>
              ) : (
                <span key={i} aria-hidden="true" />
              ),
            )}
          </nav>
        )}
      </article>
    </div>
  );
}
