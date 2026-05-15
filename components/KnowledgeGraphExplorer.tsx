'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, MutableRefObject } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { forceCollide, forceRadial } from 'd3-force-3d';
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
const LABEL_ZOOM_THRESHOLD = 1.2;
const NODE_SPRITE_SCALE = 4;
const NODE_GLOW_SCALE = 2.8;

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

const addAdjacentNode = (
  map: Map<string, Set<string>>,
  source: string,
  target: string,
) => {
  const adjacent = map.get(source);
  if (adjacent) {
    adjacent.add(target);
  } else {
    map.set(source, new Set([target]));
  }
};

const nodeMatchesQuery = (node: KnowledgeNode, query: string) => {
  const text = [node.label, node.summary, node.slug, ...(node.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes(query);
};

const getSpriteColorKey = (color: string) => color.replace('#', '');

const createNodeSprite = (
  radius: number,
  nodeColor: string,
  glowColor: string,
) => {
  const size = Math.ceil(radius * NODE_GLOW_SCALE * 2 * NODE_SPRITE_SCALE);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const center = size / 2;
  const scaledRadius = radius * NODE_SPRITE_SCALE;
  const glowRadius = scaledRadius * NODE_GLOW_SCALE;

  const glow = ctx.createRadialGradient(
    center,
    center,
    scaledRadius * 0.45,
    center,
    center,
    glowRadius,
  );
  glow.addColorStop(0, `${glowColor}55`);
  glow.addColorStop(0.45, `${glowColor}22`);
  glow.addColorStop(1, `${glowColor}00`);
  ctx.beginPath();
  ctx.arc(center, center, glowRadius, 0, 2 * Math.PI);
  ctx.fillStyle = glow;
  ctx.fill();

  const core = ctx.createRadialGradient(
    center,
    center,
    0,
    center,
    center,
    scaledRadius,
  );
  core.addColorStop(0, glowColor);
  core.addColorStop(1, nodeColor);
  ctx.beginPath();
  ctx.arc(center, center, scaledRadius, 0, 2 * Math.PI);
  ctx.fillStyle = core;
  ctx.fill();

  return canvas;
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
  const nodeSpriteCache = useRef(new Map<string, HTMLCanvasElement>());
  const [query, setQuery] = useState('');
  const [hoverNode, setHoverNode] = useState<KnowledgeNode | null>(null);

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

  const graphTopology = useMemo(() => {
    const degreeMap = new Map<string, number>();
    const adjacencyMap = new Map<string, Set<string>>();

    displayGraphData.links.forEach((link) => {
      const s = resolveNodeId(link.source as string | KnowledgeNode);
      const tgt = resolveNodeId(link.target as string | KnowledgeNode);
      degreeMap.set(s, (degreeMap.get(s) || 0) + 1);
      degreeMap.set(tgt, (degreeMap.get(tgt) || 0) + 1);
      addAdjacentNode(adjacencyMap, s, tgt);
      addAdjacentNode(adjacencyMap, tgt, s);
    });

    return { adjacencyMap, degreeMap };
  }, [displayGraphData.links]);

  /* Highlighted neighbours */
  const highlightedNodeIds = useMemo(() => {
    if (!hoverNode) return new Set<string>();
    return new Set([
      hoverNode.id,
      ...(graphTopology.adjacencyMap.get(hoverNode.id) || []),
    ]);
  }, [graphTopology.adjacencyMap, hoverNode]);

  const getNodeRadius = useCallback(
    (node: GraphNode) => {
      const degree = graphTopology.degreeMap.get(node.id) || 1;
      const base = node.type === 'tag' ? 4 : 3;
      const scale = compact ? 0.7 : 1;
      return (base + Math.log2(degree + 1) * 2) * scale;
    },
    [graphTopology.degreeMap, compact],
  );

  const handleNodeHover = useCallback((node: KnowledgeNode | null) => {
    setHoverNode((current) => {
      if (current?.id === node?.id) return current;
      return node;
    });
  }, []);

  const stats = useMemo(
    () => ({
      posts: displayGraphData.nodes.filter((n) => n.type === 'post').length,
      tags: displayGraphData.nodes.filter((n) => n.type === 'tag').length,
    }),
    [displayGraphData.nodes],
  );

  const getNodeSprite = useCallback(
    (radius: number, nodeColor: string, glowColor: string) => {
      const radiusKey = Math.round(radius * 10) / 10;
      const key = `${radiusKey}:${getSpriteColorKey(nodeColor)}:${getSpriteColorKey(glowColor)}`;
      const cached = nodeSpriteCache.current.get(key);
      if (cached) return cached;

      const sprite = createNodeSprite(radiusKey, nodeColor, glowColor);
      nodeSpriteCache.current.set(key, sprite);
      return sprite;
    },
    [],
  );

  /* Configure forces: radial layout (tags center, posts outer) + collision */
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;
    const outerRadius = compact ? 120 : 280;
    fg.d3Force('charge')?.strength(compact ? -80 : -200);
    fg.d3Force('link')?.distance(compact ? 50 : 100);
    fg.d3Force('center')?.strength(0.01);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    fg.d3Force(
      'radial',
      forceRadial((node: any) => {
        const n = node as GraphNode;
        return n.type === 'tag' ? 0 : outerRadius;
      }).strength(0.3) as any,
    );
    fg.d3Force(
      'collision',
      forceCollide((node: any) => {
        const n = node as GraphNode;
        const r = getNodeRadius(n);
        const labelW = n.label.length * 5;
        return Math.max(r + 6, labelW) + 2;
      })
        .strength(0.8)
        .iterations(2) as any,
    );
    /* eslint-enable @typescript-eslint/no-explicit-any */
    fg.d3ReheatSimulation();
  }, [displayGraphData, compact, getNodeRadius]);

  /* Auto-center on engine stop */
  const handleEngineStop = () => {
    const fg = graphRef.current;
    if (!fg) return;
    hasFitted.current = true;
    if (focusedPost) {
      const focusNode = displayGraphData.nodes.find(
        (n) => n.id === `post:${focusedPost}`,
      ) as GraphNode | undefined;
      if (focusNode?.x !== undefined && focusNode?.y !== undefined) {
        fg.centerAt(focusNode.x, focusNode.y, 700);
        fg.zoom(compact ? 4 : 2.4, 700);
      }
    } else {
      fg.zoomToFit(600, compact ? 10 : 20);
    }
  };

  /* Fallback: ensure graph is visible after mount */
  const hasFitted = useRef(false);
  useEffect(() => {
    if (hasFitted.current) return;
    const timer = setTimeout(() => {
      const fg = graphRef.current;
      if (!fg || hasFitted.current) return;
      hasFitted.current = true;
      if (focusedPost) {
        const focusNode = displayGraphData.nodes.find(
          (n) => n.id === `post:${focusedPost}`,
        ) as GraphNode | undefined;
        if (focusNode?.x !== undefined && focusNode?.y !== undefined) {
          fg.centerAt(focusNode.x, focusNode.y, 700);
          fg.zoom(compact ? 4 : 2.4, 700);
        }
      } else {
        fg.zoomToFit(600, compact ? 10 : 20);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [displayGraphData, focusedPost, compact]);

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
          linkCurvature={0.2}
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
          warmupTicks={compact ? 80 : 150}
          cooldownTicks={300}
          minZoom={0.3}
          maxZoom={8}
          onEngineStop={handleEngineStop}
          onNodeHover={handleNodeHover}
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

            const sprite = getNodeSprite(radius, nodeColor, glowColor);
            const spriteSize = sprite.width / NODE_SPRITE_SCALE;
            ctx.drawImage(
              sprite,
              x - spriteSize / 2,
              y - spriteSize / 2,
              spriteSize,
              spriteSize,
            );

            ctx.globalAlpha = isHighlighted ? 0.85 : DIMMED_ALPHA;
            const showLabel =
              globalScale > LABEL_ZOOM_THRESHOLD ||
              isTag ||
              (hoverNode && hoverNode.id === node.id);
            if (showLabel && !(compact && !isTag)) {
              const fontSize = Math.min(12, Math.max(9, 11 / globalScale));
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
