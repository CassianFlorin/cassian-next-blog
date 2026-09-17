'use client';

import Link from '@/components/Link';
import KnowledgeGraphExplorer from '@/components/KnowledgeGraphExplorer';
import { useTranslations } from 'next-intl';
import type { KnowledgeGraphData } from '@/lib/knowledgeGraph';

interface ArticleKnowledgeGraphProps {
  graphData: KnowledgeGraphData;
  currentSlug: string;
  className?: string;
}

export default function ArticleKnowledgeGraph({
  graphData,
  currentSlug,
  className = '',
}: ArticleKnowledgeGraphProps) {
  const t = useTranslations('knowledge');

  if (!graphData.nodes.length) return null;

  return (
    <section className={className}>
      <div className="mb-3">
        <h2 className="text-sm font-semibold tracking-tight text-gray-800 dark:text-gray-100">
          {t('graphLabel')}
        </h2>
        <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
          {t('exploreDesc')}
        </p>
      </div>
      <KnowledgeGraphExplorer
        graphData={graphData}
        focusedPost={currentSlug}
        compact
      />
      <Link
        href={`/knowledge?post=${encodeURIComponent(currentSlug)}`}
        className="btn btn-ghost mt-3 w-full"
      >
        {t('openFullGraph')}
      </Link>
    </section>
  );
}
