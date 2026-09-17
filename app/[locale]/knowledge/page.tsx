import KnowledgeGraphExplorer from '@/components/KnowledgeGraphExplorer';
import Link from '@/components/Link';
import KnowledgeModeBar from '@/components/knowledge/KnowledgeModeBar';
import {
  buildKnowledgeGraph,
  mergeKnowledgeGraphs,
} from '@/lib/knowledgeGraph';
import { getKnowledgeIndex } from '@/lib/knowledgeData';
import { isKnowledgeNodeKey, knowledgeNodeHref } from '@/lib/knowledgeNodes';
import { allBlogs } from 'contentlayer/generated';
import { genPageMetadata } from 'app/seo';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import obsidianGraph from '@/generated/obsidian-graph.json';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return genPageMetadata({
    title: t('knowledgeTitle'),
    description: t('knowledgeDescription'),
    locale,
    path: '/knowledge',
  });
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Explore mode: the whole graph, plus the territory index for Focus mode. */
export default async function KnowledgePage({
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ post?: string; territory?: string }>;
}) {
  const [{ post, territory }, t] = await Promise.all([
    searchParams,
    getTranslations('knowledge'),
  ]);
  const graphData = mergeKnowledgeGraphs(
    buildKnowledgeGraph(allBlogs),
    obsidianGraph,
  );
  const index = getKnowledgeIndex();

  return (
    <div className="bleed">
      <div className="container-atelier pb-8">
        <header className="space-y-12 pt-6 md:pt-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <p className="type-meta text-gray-500 dark:text-gray-400">
              CF / 02
            </p>
            <KnowledgeModeBar mode="explore" />
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
            <div className="space-y-6">
              <h1 className="type-section text-gray-950 dark:text-gray-50">
                {t('title')}
              </h1>
              <p className="type-editorial text-2xl text-gray-600 italic sm:text-3xl dark:text-gray-300">
                {t('lede')}
              </p>
            </div>
            <p className="text-base leading-7 text-gray-600 lg:pb-2 dark:text-gray-400">
              {t('mapDescription')}
            </p>
          </div>
        </header>

        <div className="mt-14">
          <KnowledgeGraphExplorer
            graphData={graphData}
            focusedPost={post}
            initialTerritory={
              isKnowledgeNodeKey(territory) ? territory : undefined
            }
          />
        </div>

        <section
          id="territories"
          aria-labelledby="territories-title"
          className="mt-24 scroll-mt-8"
        >
          <div className="flex items-baseline justify-between gap-6 border-b border-gray-900/20 pb-4 dark:border-white/20">
            <h2
              id="territories-title"
              className="type-meta text-gray-950 dark:text-gray-50"
            >
              {t('modeFocus')} · {t('territories')}
            </h2>
            <span className="type-meta text-gray-500 dark:text-gray-400">
              {pad(index.nodes.length)}
            </span>
          </div>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4">
            {index.nodes.map((node, i) => (
              <li
                key={node.key}
                className="border-b border-gray-900/10 sm:odd:border-r lg:border-r lg:odd:border-r dark:border-white/10 lg:[&:nth-child(4n)]:border-r-0"
              >
                <Link
                  href={knowledgeNodeHref(node.key)}
                  className="group flex h-full flex-col gap-4 py-7 transition-colors duration-500 hover:bg-gray-900/[0.025] sm:px-5 dark:hover:bg-white/[0.03]"
                >
                  <span className="type-meta flex items-center justify-between text-gray-500 dark:text-gray-400">
                    {pad(i + 1)}
                    <span
                      aria-hidden="true"
                      className="text-gray-950 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-gray-50"
                    >
                      →
                    </span>
                  </span>
                  <span className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
                    {t(`nodes.${node.key}.label`)}
                  </span>
                  <span className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                    {t(`nodes.${node.key}.description`)}
                  </span>
                  <span className="type-meta mt-auto text-gray-500 dark:text-gray-400">
                    {t('articles', { count: node.articles.length })} ·{' '}
                    {t('topics', { count: node.topics.length })}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
