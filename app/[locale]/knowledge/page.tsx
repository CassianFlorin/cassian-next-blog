import KnowledgeGraphExplorer from '@/components/KnowledgeGraphExplorer';
import { buildKnowledgeGraph } from '@/lib/knowledgeGraph';
import { allBlogs } from 'contentlayer/generated';
import { genPageMetadata } from 'app/seo';
import { getTranslations } from 'next-intl/server';

export const metadata = genPageMetadata({
  title: 'Knowledge Graph',
  description: 'Explore blog posts and tags as a connected knowledge graph.',
});

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ post?: string }>;
}) {
  const [{ post }, t] = await Promise.all([
    searchParams,
    getTranslations('knowledge'),
  ]);
  const graphData = buildKnowledgeGraph(allBlogs);

  return (
    <div className="space-y-6 pt-6 pb-12">
      <div className="max-w-3xl space-y-3">
        <h1 className="text-3xl leading-9 font-bold tracking-tight text-gray-800 sm:text-4xl sm:leading-10 dark:text-gray-100">
          {t('title')}
        </h1>
        <p className="text-base leading-7 text-gray-500 dark:text-gray-400">
          {t('description')}
        </p>
      </div>
      <KnowledgeGraphExplorer graphData={graphData} focusedPost={post} />
    </div>
  );
}
