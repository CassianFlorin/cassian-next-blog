'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, MutableRefObject } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { forceCollide } from 'd3-force-3d';
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

/* ── Obsidian-inspired color palette ── */
const COLORS = {
  dark: {
    bg: '#0f0f1a',
    tag: '#a78bfa',
    tagGlow: '#c4b5fd',
    post: '#7dd3fc',
    postGlow: '#bae6fd',
    focused: '#34d399',
    focusedGlow: '#6ee7b7',
    link: 'rgba(148,163,184,0.12)',
    linkHover: 'rgba(167,139,250,0.55)',
    label: 'rgba(226,232,240,0.85)',
  },
  light: {
    bg: '#f8fafc',
    tag: '#7c3aed',
    tagGlow: '#a78bfa',
    post: '#0284c7',
    postGlow: '#38bdf8',
    focused: '#059669',
    focusedGlow: '#34d399',
    link: 'rgba(100,116,139,0.18)',
    linkHover: 'rgba(124,58,237,0.45)',
    label: 'rgba(30,41,59,0.85)',
  },
} as const;

const DIMMED_ALPHA = 0.08;

/* ── Types ── */
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

/* ── Helpers ── */
const cloneGraphData = (g: KnowledgeGraphData): KnowledgeGraphData => ({
  nodes: g.nodes.map((n) => ({ ...n })),
  links: g.links.map((l) => ({ ...l })),
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
  const q = query.trim().toLowerCase();
  if (!q) return cloneGraphData(graphData);

  const matchIds = new Set(
    graphData.nodes.filter((n) => nodeMatchesQuery(n, q)).map((n) => n.id),
  );
  const visible = new Set(matchIds);

  graphData.links.forEach((link) => {
    const s = resolveNodeId(link.source as string | KnowledgeNode);
    const t = resolveNodeId(link.target as string | KnowledgeNode);
    if (matchIds.has(s) || matchIds.has(t)) {
      visible.add(s);
      visible.add(t);
    }
  });

  return {
    nodes: graphData.nodes
      .filter((n) => visible.has(n.id))
      .map((n) => ({ ...n })),
    links: graphData.links
      .filter((l) => {
        const s = resolveNodeId(l.source as string | KnowledgeNode);
        const t = resolveNodeId(l.target as string | KnowledgeNode);
        return visible.has(s) && visible.has(t);
      })
      .map((l) => ({ ...l })),
  };
};

/* ── Component ── */
export default function KnowledgeGraphExplorer({
  graphData,
  focusedPost,
  compact = false,
}: KnowledgeGraphExplorerProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const t = useTranslations('knowledge');
  const isDark = resolvedTheme === 'dark';
  const palette = isDark ? COLORS.dark : COLORS.light;
  const graphRef =
    useRef<ForceGraphMethods<GraphNode, KnowledgeLink>>(undefined);
  const [query, setQuery] = useState('');
  const [hoverNode, setHoverNode] = useState<KnowledgeNode | null>(null);

  /* Highlighted neighbours */
  const highlightedNodeIds = useMemo(() => {
    if (!hoverNode) return new Set<string>();
    const ids = new Set([hoverNode.id]);
    graphData.links.forEach((link) => {
      const s = resolveNodeId(link.source as string | KnowledgeNode);
      const tgt = resolveNodeId(link.target as string | KnowledgeNode);
      if (s === hoverNode.id) ids.add(tgt);
      if (tgt === hoverNode.id) ids.add(s);
    });
    return ids;
  }, [graphData.links, hoverNode]);

  /* Filtered + focused graph data */
  const displayGraphData = useMemo(() => {
    const filtered = filterGraphData(graphData, query);
    if (!focusedPost) return filtered;
    const focusId = `post:${focusedPost}`;
    return {
      nodes: filtered.nodes.map((n) => ({
        ...n,
        fx: n.id === focusId && compact ? 0 : undefined,
        fy: n.id === focusId && compact ? 0 : undefined,
      })),
      links: filtered.links,
    };
  }, [compact, focusedPost, graphData, query]);

  /* Node degree map for dynamic sizing */
  const nodeDegreeMap = useMemo(() => {
    const map = new Map<string, number>();
    displayGraphData.links.forEach((link) => {
      const s = resolveNodeId(link.source as string | KnowledgeNode);
      const tgt = resolveNodeId(link.target as string | KnowledgeNode);
      map.set(s, (map.get(s) || 0) + 1);
      map.set(tgt, (map.get(tgt) || 0) + 1);
    });
    return map;
  }, [displayGraphData.links]);

  const getNodeRadius = useCallback(
    (node: GraphNode) => {
      const degree = nodeDegreeMap.get(node.id) || 1;
      const base = node.type === 'tag' ? 5 : 3.5;
      const scale = compact ? 0.7 : 1;
      return (base + Math.log2(degree + 1) * 2.5) * scale;
    },
    [nodeDegreeMap, compact],
  );

  const stats = useMemo(
    () => ({
      posts: displayGraphData.nodes.filter((n) => n.type === 'post').length,
      tags: displayGraphData.nodes.filter((n) => n.type === 'tag').length,
    }),
    [displayGraphData.nodes],
  );

  /* Configure d3 forces */
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;
    fg.d3Force('charge')?.strength(compact ? -200 : -500);
    fg.d3Force('link')?.distance(compact ? 60 : 120);
    fg.d3Force('center')?.strength(0.03);
    fg.d3Force(
      'collision',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      forceCollide((node: any) => getNodeRadius(node as GraphNode) + 18) as any,
    );
  }, [displayGraphData, compact, getNodeRadius]);

  /* Auto-center on engine stop */
  const handleEngineStop = () => {
    const fg = graphRef.current;
    if (!fg) return;
    if (focusedPost) {
      const focusNode = displayGraphData.nodes.find(
        (n) => n.id === `post:${focusedPost}`,
      ) as GraphNode | undefined;
      if (focusNode?.x !== undefined && focusNode?.y !== undefined) {
        fg.centerAt(focusNode.x, focusNode.y, 700);
        fg.zoom(compact ? 4 : 2.4, 700);
      }
    } else {
      fg.zoomToFit(400, compact ? 30 : 60);
    }
  };

  return (
    <div
      className={
        compact
          ? 'overflow-hidden rounded-lg border border-gray-200/70 bg-[#f8fafc] dark:border-gray-800/50 dark:bg-[#0f0f1a]'
          : 'overflow-hidden rounded-lg border border-gray-200/70 bg-[#f8fafc] shadow-sm dark:border-gray-800/50 dark:bg-[#0f0f1a]'
      }
    >
      <div className="flex flex-col gap-3 border-b border-gray-200/70 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800/50 dark:bg-[#0f0f1a]/80">
        <div>
          <p className="text-xs font-medium tracking-wide text-violet-600 uppercase dark:text-violet-400">
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200/80 transition focus:ring-2 focus:ring-violet-500/50 dark:bg-gray-950 dark:text-gray-200 dark:ring-gray-800 dark:focus:ring-violet-400/50"
            />
          </label>
        )}
      </div>

      <div className={compact ? 'h-[240px]' : 'h-[620px]'}>
        <ForceGraph2D
          ref={graphRef}
          graphData={displayGraphData}
          backgroundColor={palette.bg}
          nodeRelSize={1}
          linkCurvature={0.15}
          linkColor={(link: LinkObject<GraphNode, KnowledgeLink>) => {
            const s = resolveNodeId(link.source as string | KnowledgeNode);
            const tgt = resolveNodeId(link.target as string | KnowledgeNode);
            if (hoverNode && (s === hoverNode.id || tgt === hoverNode.id)) {
              return palette.linkHover;
            }
            return palette.link;
          }}
          linkWidth={(link: LinkObject<GraphNode, KnowledgeLink>) => {
            const s = resolveNodeId(link.source as string | KnowledgeNode);
            const tgt = resolveNodeId(link.target as string | KnowledgeNode);
            return hoverNode && (s === hoverNode.id || tgt === hoverNode.id)
              ? 1.5
              : 0.5;
          }}
          linkDirectionalParticles={0}
          d3AlphaDecay={0.015}
          d3VelocityDecay={0.25}
          warmupTicks={compact ? 80 : 150}
          cooldownTicks={300}
          minZoom={0.5}
          maxZoom={8}
          onEngineStop={handleEngineStop}
          onNodeHover={setHoverNode}
          onNodeClick={(node: KnowledgeNode) => router.push(node.href)}
          nodeCanvasObject={(
            node: NodeObject<GraphNode>,
            ctx: CanvasRenderingContext2D,
            globalScale: number,
          ) => {
            const isTag = node.type === 'tag';
            const isFocused = !!(
              focusedPost && node.id === `post:${focusedPost}`
            );
            const isHighlighted =
              highlightedNodeIds.size === 0 || highlightedNodeIds.has(node.id);
            const radius = getNodeRadius(node as GraphNode);
            const x = node.x || 0;
            const y = node.y || 0;

            const nodeColor = isFocused
              ? palette.focused
              : isTag
                ? palette.tag
                : palette.post;
            const glowColor = isFocused
              ? palette.focusedGlow
              : isTag
                ? palette.tagGlow
                : palette.postGlow;

            ctx.globalAlpha = isHighlighted ? 1 : DIMMED_ALPHA;

            // Layer 1: outer glow
            const glowR = radius * 3;
            const grd = ctx.createRadialGradient(
              x,
              y,
              radius * 0.5,
              x,
              y,
              glowR,
            );
            grd.addColorStop(0, glowColor + '40');
            grd.addColorStop(0.5, glowColor + '15');
            grd.addColorStop(1, glowColor + '00');
            ctx.beginPath();
            ctx.arc(x, y, glowR, 0, 2 * Math.PI);
            ctx.fillStyle = grd;
            ctx.fill();

            // Layer 2: core node
            const core = ctx.createRadialGradient(x, y, 0, x, y, radius);
            core.addColorStop(0, glowColor);
            core.addColorStop(1, nodeColor);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = core;
            ctx.fill();

            // Layer 3: label
            ctx.globalAlpha = isHighlighted ? 0.85 : DIMMED_ALPHA;
            const showLabel =
              globalScale > 1.2 ||
              isTag ||
              (hoverNode && hoverNode.id === node.id);
            if (showLabel && !(compact && !isTag)) {
              const fontSize = Math.min(14, Math.max(10, 12 / globalScale));
              ctx.font = `${fontSize}px Inter, -apple-system, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillStyle = palette.label;
              ctx.fillText(node.label, x, y + radius + 3);
            }

            ctx.globalAlpha = 1;
          }}
          nodePointerAreaPaint={(
            node: NodeObject<GraphNode>,
            color: string,
            ctx: CanvasRenderingContext2D,
          ) => {
            const radius = getNodeRadius(node as GraphNode);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, radius + 6, 0, 2 * Math.PI);
            ctx.fill();
          }}
        />
      </div>
    </div>
  );
}
