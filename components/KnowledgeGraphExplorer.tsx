'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import type { ComponentType, MutableRefObject } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import type {
  ForceGraphMethods,
  ForceGraphProps,
  LinkObject,
  NodeObject,
} from 'react-force-graph-2d';
import type {
  KnowledgeGraphData,
  KnowledgeLink,
  KnowledgeNode,
} from '@/lib/knowledgeGraph';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
      <span className="animate-pulse">...</span>
    </div>
  ),
}) as unknown as ComponentType<
  ForceGraphProps<GraphNode, KnowledgeLink> & {
    ref?: MutableRefObject<
      ForceGraphMethods<GraphNode, KnowledgeLink> | undefined
    >;
  }
>;

interface KnowledgeGraphExplorerProps {
  graphData: KnowledgeGraphData;
  focusedPost?: string;
  compact?: boolean;
}

type GraphNode = KnowledgeNode & {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
};

const cloneGraphData = (graphData: KnowledgeGraphData): KnowledgeGraphData => ({
  nodes: graphData.nodes.map((node) => ({ ...node })),
  links: graphData.links.map((link) => ({ ...link })),
});

const resolveNodeId = (node: string | KnowledgeNode) =>
  typeof node === 'string' ? node : node.id;

const nodeMatchesQuery = (node: KnowledgeNode, query: string) => {
  const text = [node.label, node.summary, node.slug, ...(node.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes(query);
};

const filterGraphData = (
  graphData: KnowledgeGraphData,
  query: string,
): KnowledgeGraphData => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return cloneGraphData(graphData);

  const matchingNodeIds = new Set(
    graphData.nodes
      .filter((node) => nodeMatchesQuery(node, normalizedQuery))
      .map((node) => node.id),
  );
  const visibleNodeIds = new Set(matchingNodeIds);

  graphData.links.forEach((link) => {
    const source = resolveNodeId(link.source as string | KnowledgeNode);
    const target = resolveNodeId(link.target as string | KnowledgeNode);
    if (matchingNodeIds.has(source) || matchingNodeIds.has(target)) {
      visibleNodeIds.add(source);
      visibleNodeIds.add(target);
    }
  });

  return {
    nodes: graphData.nodes
      .filter((node) => visibleNodeIds.has(node.id))
      .map((node) => ({ ...node })),
    links: graphData.links
      .filter((link) => {
        const source = resolveNodeId(link.source as string | KnowledgeNode);
        const target = resolveNodeId(link.target as string | KnowledgeNode);
        return visibleNodeIds.has(source) && visibleNodeIds.has(target);
      })
      .map((link) => ({ ...link })),
  };
};

export default function KnowledgeGraphExplorer({
  graphData,
  focusedPost,
  compact = false,
}: KnowledgeGraphExplorerProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const t = useTranslations('knowledge');
  const isDark = resolvedTheme === 'dark';
  const graphRef =
    useRef<ForceGraphMethods<GraphNode, KnowledgeLink>>(undefined);
  const [query, setQuery] = useState('');
  const [hoverNode, setHoverNode] = useState<KnowledgeNode | null>(null);

  const highlightedNodeIds = useMemo(() => {
    if (!hoverNode) return new Set<string>();
    const ids = new Set([hoverNode.id]);
    graphData.links.forEach((link) => {
      const source = resolveNodeId(link.source as string | KnowledgeNode);
      const target = resolveNodeId(link.target as string | KnowledgeNode);
      if (source === hoverNode.id) ids.add(target);
      if (target === hoverNode.id) ids.add(source);
    });
    return ids;
  }, [graphData.links, hoverNode]);

  const displayGraphData = useMemo(() => {
    const filtered = filterGraphData(graphData, query);
    if (!focusedPost) return filtered;

    const focusId = `post:${focusedPost}`;
    return {
      nodes: filtered.nodes.map((node) => ({
        ...node,
        fx: node.id === focusId && compact ? 0 : undefined,
        fy: node.id === focusId && compact ? 0 : undefined,
      })),
      links: filtered.links,
    };
  }, [compact, focusedPost, graphData, query]);

  const stats = useMemo(
    () => ({
      posts: displayGraphData.nodes.filter((node) => node.type === 'post')
        .length,
      tags: displayGraphData.nodes.filter((node) => node.type === 'tag').length,
    }),
    [displayGraphData.nodes],
  );

  const handleEngineStop = () => {
    if (!focusedPost || !graphRef.current) return;
    const focusNode = displayGraphData.nodes.find(
      (node) => node.id === `post:${focusedPost}`,
    ) as GraphNode | undefined;
    if (focusNode?.x !== undefined && focusNode?.y !== undefined) {
      graphRef.current.centerAt(focusNode.x, focusNode.y, 700);
      graphRef.current.zoom(compact ? 4 : 2.4, 700);
    }
  };

  return (
    <div
      className={
        compact
          ? 'overflow-hidden rounded-lg border border-gray-200/70 bg-[#fcfcfb] dark:border-gray-800/80 dark:bg-gray-950/30'
          : 'overflow-hidden rounded-lg border border-gray-200/70 bg-[#fcfcfb] shadow-sm dark:border-gray-800/80 dark:bg-gray-950/30'
      }
    >
      <div className="flex flex-col gap-3 border-b border-gray-200/70 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800/80 dark:bg-gray-900/50">
        <div>
          <p className="text-xs font-medium tracking-wide text-teal-700 uppercase dark:text-teal-300">
            {t('graphLabel')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('stats', { posts: stats.posts, tags: stats.tags })}
          </p>
        </div>
        {!compact && (
          <label className="w-full max-w-sm">
            <span className="sr-only">{t('searchGraph')}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="focus:ring-primary-500/50 dark:focus:ring-primary-400/50 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200/80 transition focus:ring-2 dark:bg-gray-950 dark:text-gray-200 dark:ring-gray-800"
            />
          </label>
        )}
      </div>

      <div className={compact ? 'h-[240px]' : 'h-[620px]'}>
        <ForceGraph2D
          ref={graphRef}
          graphData={displayGraphData}
          backgroundColor="rgba(0,0,0,0)"
          nodeRelSize={compact ? 5 : 7}
          linkColor={(link: LinkObject<GraphNode, KnowledgeLink>) => {
            const source = resolveNodeId(link.source as string | KnowledgeNode);
            const target = resolveNodeId(link.target as string | KnowledgeNode);
            if (
              hoverNode &&
              (source === hoverNode.id || target === hoverNode.id)
            ) {
              return isDark ? '#2dd4bf' : '#0f766e';
            }
            return isDark ? '#475569' : '#94a3b8';
          }}
          linkWidth={(link: LinkObject<GraphNode, KnowledgeLink>) => {
            const source = resolveNodeId(link.source as string | KnowledgeNode);
            const target = resolveNodeId(link.target as string | KnowledgeNode);
            return hoverNode &&
              (source === hoverNode.id || target === hoverNode.id)
              ? 2
              : 1.2;
          }}
          linkDirectionalParticles={compact ? 0 : 1}
          linkDirectionalParticleWidth={1.4}
          cooldownTicks={80}
          onEngineStop={handleEngineStop}
          onNodeHover={setHoverNode}
          onNodeClick={(node: KnowledgeNode) => router.push(node.href)}
          nodeCanvasObject={(
            node: NodeObject<GraphNode>,
            ctx: CanvasRenderingContext2D,
            globalScale: number,
          ) => {
            const isTag = node.type === 'tag';
            const isHighlighted =
              highlightedNodeIds.size === 0 || highlightedNodeIds.has(node.id);
            const radius = isTag ? (compact ? 8 : 13) : compact ? 6 : 9;
            const label = node.label;
            const fontSize = compact ? 9 : 12;

            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = isTag ? '#0f766e' : isDark ? '#64748b' : '#334155';
            ctx.globalAlpha = isHighlighted ? 1 : 0.28;
            ctx.fill();

            ctx.lineWidth = 1.5;
            ctx.strokeStyle = isTag
              ? '#99f6e4'
              : isDark
                ? '#94a3b8'
                : '#cbd5e1';
            ctx.stroke();
            ctx.globalAlpha = 1;

            if (compact && !isTag) return;

            ctx.font = `${fontSize / globalScale}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isDark ? '#e2e8f0' : '#334155';
            ctx.fillText(label, node.x || 0, (node.y || 0) + radius + 8);
          }}
          nodePointerAreaPaint={(
            node: NodeObject<GraphNode>,
            color: string,
            ctx: CanvasRenderingContext2D,
          ) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(
              node.x || 0,
              node.y || 0,
              node.type === 'tag' ? 18 : 14,
              0,
              2 * Math.PI,
            );
            ctx.fill();
          }}
        />
      </div>
    </div>
  );
}
