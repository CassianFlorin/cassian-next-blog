import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { genPageMetadata } from 'app/seo';
import JsonLd from '@/components/JsonLd';
import Link from '@/components/Link';
import KnowledgeModeBar from '@/components/knowledge/KnowledgeModeBar';
import LocalKnowledgeGraph from '@/components/knowledge/LocalKnowledgeGraph';
import TraceList from '@/components/writing/TraceList';
import { projectHref } from '@/data/caseStudies';
import projectsData from '@/data/projectsData';
import { getKnowledgeIndex } from '@/lib/knowledgeData';
import { buildLocalGraph } from '@/lib/knowledgeLocalGraph';
import {
  isKnowledgeNodeKey,
  KNOWLEDGE_NODE_KEYS,
  knowledgeNodeHref,
  type NodeEntry,
} from '@/lib/knowledgeNodes';
import { resolveLocale } from '@/lib/seo';
import { buildCollectionPageJsonLd } from '@/lib/structuredData';

type Params = Promise<{ locale: string; node: string }>;

export function generateStaticParams() {
  return KNOWLEDGE_NODE_KEYS.map((node) => ({ node }));
}

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const { locale, node } = await props.params;
  if (!isKnowledgeNodeKey(node)) return {};
  const summary = getKnowledgeIndex().byKey.get(node);
  if (!summary) return {};

  const t = await getTranslations({ locale, namespace: 'knowledge' });
  const seo = await getTranslations({ locale, namespace: 'seo' });
  const label = t(`nodes.${node}.label`);

  return genPageMetadata({
    title: seo('knowledgeNodeTitle', { node: label }),
    description: seo('knowledgeNodeDescription', {
      node: label,
      description: t(`nodes.${node}.description`),
      articles: summary.articles.length,
      topics: summary.topics.length,
    }),
    locale,
    path: knowledgeNodeHref(node),
    image: `/og/knowledge/${node}.png`,
  });
}

const toTraces = (entries: NodeEntry[]) =>
  entries.map((entry) => ({
    key: entry.href,
    href: entry.href,
    title: entry.title,
    date: entry.date,
    tags: entry.tags,
  }));

export default async function KnowledgeNodePage(props: { params: Params }) {
  const { locale, node } = await props.params;
  if (!isKnowledgeNodeKey(node)) notFound();

  const index = getKnowledgeIndex();
  const summary = index.byKey.get(node);
  const graph = buildLocalGraph(index, node);
  if (!summary || !graph) notFound();

  const t = await getTranslations('knowledge');
  const tp = await getTranslations('projects');
  const label = (key: string) => t(`nodes.${key}.label`);
  const nodeLabel = label(node);
  const projects = summary.projects
    .map((id) => projectsData.find((project) => project.id === id))
    .filter((project) => project !== undefined);

  const stats = [
    {
      value: summary.articles.length + summary.notes.length,
      label: t('sectionArticles'),
    },
    { value: summary.topics.length, label: t('sectionTopics') },
    { value: projects.length, label: t('sectionProjects') },
    { value: summary.related.length, label: t('statConnections') },
  ];

  const sectionTitle =
    'type-meta border-b border-gray-900/20 pb-4 text-gray-500 dark:border-white/20 dark:text-gray-400';

  return (
    <div className="bleed">
      <JsonLd
        data={buildCollectionPageJsonLd(resolveLocale(locale), {
          name: nodeLabel,
          description: t(`nodes.${node}.description`),
          path: knowledgeNodeHref(node),
          items: summary.articles.map((article) => ({
            title: article.title,
            path: article.href,
          })),
        })}
      />

      <div className="container-atelier pb-8">
        <header className="space-y-12 pt-6 md:pt-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <nav aria-label="Breadcrumb" className="type-meta">
              <ol className="flex flex-wrap items-center gap-2 text-gray-500 dark:text-gray-400">
                <li>
                  <Link
                    href="/knowledge"
                    className="transition-colors hover:text-gray-950 dark:hover:text-gray-50"
                  >
                    CF / 02 · {t('title')}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li
                  aria-current="page"
                  className="text-gray-950 dark:text-gray-50"
                >
                  {nodeLabel}
                </li>
              </ol>
            </nav>
            <KnowledgeModeBar mode="focus" />
          </div>

          <div className="max-w-4xl">
            <p className="type-meta text-gray-500 dark:text-gray-400">
              {t('nodeLabel')}
            </p>
            <h1 className="type-section mt-6 text-gray-950 dark:text-gray-50">
              {nodeLabel}
            </h1>
            <p className="type-editorial mt-6 text-2xl text-gray-600 italic sm:text-3xl dark:text-gray-300">
              {t(`nodes.${node}.description`)}
            </p>
          </div>

          <dl className="grid grid-cols-2 border-y border-gray-900/15 md:grid-cols-4 dark:border-white/15">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col-reverse gap-2 py-6 ${
                  i % 2 === 1 ? 'pl-6' : ''
                } ${i > 0 ? 'md:border-l md:border-gray-900/15 md:pl-6 md:dark:border-white/15' : ''} ${
                  i < 2
                    ? 'border-b border-gray-900/15 md:border-b-0 dark:border-white/15'
                    : ''
                }`}
              >
                <dt className="type-meta text-gray-500 dark:text-gray-400">
                  {stat.label}
                </dt>
                <dd className="text-4xl font-semibold tracking-tight text-gray-950 tabular-nums md:text-5xl dark:text-gray-50">
                  {String(stat.value).padStart(2, '0')}
                </dd>
              </div>
            ))}
          </dl>
        </header>

        <section
          aria-label={t('localGraphLabel', { node: nodeLabel })}
          className="surface-grid bleed mt-16 border-y border-gray-900/10 dark:border-white/10"
        >
          <div className="container-atelier py-12 md:py-16">
            <LocalKnowledgeGraph graph={graph} />
          </div>
        </section>

        <div className="mt-20 grid gap-20 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16 xl:gap-24">
          <div className="min-w-0 space-y-20">
            {projects.length > 0 && (
              <section aria-labelledby="node-projects">
                <h2 id="node-projects" className={sectionTitle}>
                  {t('sectionProjects')} ·{' '}
                  {String(projects.length).padStart(2, '0')}
                </h2>
                <ul className="divide-y divide-gray-900/10 dark:divide-white/10">
                  {projects.map((project) => {
                    const href = projectHref(project);
                    const external = !href.startsWith('/');
                    const tagline = tp.has(`items.${project.id}.tagline`)
                      ? tp(`items.${project.id}.tagline`)
                      : tp(`items.${project.id}.description`);
                    return (
                      <li key={project.id}>
                        <Link
                          href={href}
                          className="group grid gap-2 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-baseline md:gap-8"
                        >
                          <span className="space-y-2">
                            <span className="block text-2xl font-semibold tracking-tight text-gray-950 md:text-3xl dark:text-gray-50">
                              {project.title}
                            </span>
                            <span className="type-meta block text-gray-600 dark:text-gray-300">
                              {tagline}
                            </span>
                          </span>
                          <span className="type-meta flex items-center gap-3 text-gray-500 transition-colors group-hover:text-gray-950 dark:text-gray-400 dark:group-hover:text-gray-50">
                            {project.techStack.slice(0, 3).join(' · ')}
                            <span aria-hidden="true">
                              {external ? '↗' : '→'}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section aria-labelledby="node-articles">
              <h2 id="node-articles" className={`${sectionTitle} mb-8`}>
                {t('sectionArticles')} ·{' '}
                {String(summary.articles.length).padStart(2, '0')}
              </h2>
              {summary.articles.length ? (
                <TraceList traces={toTraces(summary.articles)} size="compact" />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  {t('noArticles')}
                </p>
              )}
            </section>

            {summary.notes.length > 0 && (
              <section aria-labelledby="node-notes">
                <h2 id="node-notes" className={`${sectionTitle} mb-8`}>
                  {t('sectionNotes')} ·{' '}
                  {String(summary.notes.length).padStart(2, '0')}
                </h2>
                <TraceList traces={toTraces(summary.notes)} size="compact" />
              </section>
            )}
          </div>

          <aside className="space-y-16 lg:sticky lg:top-8 lg:self-start">
            {summary.topics.length > 0 && (
              <section aria-labelledby="node-topics">
                <h2 id="node-topics" className={sectionTitle}>
                  {t('sectionTopics')}
                </h2>
                <ul className="mt-2">
                  {summary.topics.map((topic) => (
                    <li key={topic.slug}>
                      <Link
                        href={`/tags/${topic.slug}`}
                        className="flex items-baseline justify-between gap-4 py-2 text-gray-700 transition-colors hover:text-gray-950 dark:text-gray-300 dark:hover:text-gray-50"
                      >
                        <span>{topic.label}</span>
                        <span className="font-mono text-xs text-gray-500 tabular-nums">
                          {String(topic.count).padStart(2, '0')}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {summary.related.length > 0 && (
              <section aria-labelledby="node-related">
                <h2 id="node-related" className={sectionTitle}>
                  {t('sectionRelated')}
                </h2>
                <ul className="mt-2">
                  {summary.related.map((relation) => (
                    <li key={relation.key}>
                      <Link
                        href={knowledgeNodeHref(relation.key)}
                        className="group flex items-baseline justify-between gap-4 py-2.5"
                      >
                        <span className="group-hover:text-primary-700 dark:group-hover:text-primary-300 text-gray-950 transition-colors dark:text-gray-50">
                          {label(relation.key)}
                        </span>
                        <span className="type-meta shrink-0 text-gray-500">
                          {t('shared', { count: relation.weight })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>

        <nav
          aria-label={t('otherTerritories')}
          className="mt-28 border-t border-gray-900/20 pt-8 dark:border-white/20"
        >
          <p className="type-meta text-gray-500 dark:text-gray-400">
            {t('otherTerritories')}
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {index.nodes
              .filter((other) => other.key !== node)
              .map((other) => (
                <li key={other.key}>
                  <Link
                    href={knowledgeNodeHref(other.key)}
                    className="text-lg text-gray-600 transition-colors hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-50"
                  >
                    {label(other.key)}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
