'use client';

import Link from '@/components/Link';
import KnowledgeGraphExplorer from '@/components/KnowledgeGraphExplorer';
import KnowledgeUniverse from '@/components/knowledge/KnowledgeUniverse';
import { useTranslations } from 'next-intl';
import type { KnowledgeGraphData } from '@/lib/knowledgeGraph';
import type { UniverseData } from '@/lib/knowledgeUniverse';

interface ArticleKnowledgeGraphProps {
  /** The whole knowledge universe; the stage circles this article's star. */
  universe: UniverseData;
  /** Local 2D graph, only rendered when WebGL is unavailable. */
  graphData: KnowledgeGraphData;
  currentSlug: string;
  className?: string;
}

export default function ArticleKnowledgeGraph({
  universe,
  graphData,
  currentSlug,
  className = '',
}: ArticleKnowledgeGraphProps) {
  const t = useTranslations('knowledge');

  if (!graphData.nodes.length) return null;

  return (
    <section className={className}>
      <p className="mb-3 text-xs leading-5 text-gray-500 dark:text-gray-400">
        {t('exploreDesc')}
      </p>
      <KnowledgeUniverse
        data={universe}
        mode="article"
        focusedPost={currentSlug}
        fallback={
          <KnowledgeGraphExplorer
            graphData={graphData}
            focusedPost={currentSlug}
            compact
          />
        }
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
