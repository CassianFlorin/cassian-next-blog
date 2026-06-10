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

const COLORS = {
  dark: {
    bg: '#111915',
    grid: 'rgba(148, 163, 184, 0.08)',
    tag: '#8bd7b2',
    tagGlow: '#bbf7d0',
    post: '#6ab7c8',
    postGlow: '#a7f3d0',
    focused: '#f0b35d',
    focusedGlow: '#fed7aa',
    link: 'rgba(160, 181, 170, 0.16)',
    linkHover: 'rgba(139, 215, 178, 0.62)',
    label: 'rgba(240, 247, 242, 0.88)',
    labelBg: 'rgba(17, 25, 21, 0.78)',
  },
  light: {
    bg: '#f6f8f2',
    grid: 'rgba(64, 92, 78, 0.08)',
    tag: '#2f7d5f',
    tagGlow: '#77c69d',
    post: '#2a7f95',
    postGlow: '#67c8d8',
    focused: '#b66b1f',
    focusedGlow: '#f4b46d',
    link: 'rgba(64, 92, 78, 0.18)',
    linkHover: 'rgba(47, 125, 95, 0.58)',
    label: 'rgba(31, 47, 39, 0.9)',
    labelBg: 'rgba(246, 248, 242, 0.84)',
  },
} as const;

const DIMMED_ALPHA = 0.12;
const LABEL_ZOOM_THRESHOLD = 3.1;
const NODE_SPRITE_SCALE = 4;
const NODE_GLOW_SCALE = 2.25;
const DEFAULT_GRAPH_SIZE = { width: 960, height: 660 };

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

const getHash = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = Math.imul(31, hash) + input.charCodeAt(i);
  }
  return Math.abs(hash);
};

const getSeededAngle = (id: string, index: number, total: number) => {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const jitter = (getHash(id) % 1000) / 1000;
  return index * goldenAngle + jitter * ((Math.PI * 2) / Math.max(total, 1));
};

const clampLabel = (label: string, compact: boolean) => {
  const limit = compact ? 16 : 28;
  return label.length > limit ? `${label.slice(0, limit - 1)}...` : label;
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

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

export default function KnowledgeGraphExplorer({
  graphData,
  focusedPost,
  compact = false,
}: KnowledgeGraphExplorerProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const t = useTranslations('knowledge');
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && resolvedTheme === 'dark';
  const palette = isDark ? COLORS.dark : COLORS.light;
  const graphRef =
    useRef<ForceGraphMethods<GraphNode, KnowledgeLink>>(undefined);
  const nodeSpriteCache = useRef(new Map<string, HTMLCanvasElement>());
  const graphShellRef = useRef<HTMLDivElement>(null);
  const hasFitted = useRef(false);
  const [query, setQuery] = useState('');
  const [hoverNode, setHoverNode] = useState<KnowledgeNode | null>(null);
  const [graphSize, setGraphSize] = useState(DEFAULT_GRAPH_SIZE);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const getRingRadius = useCallback(
    (node: KnowledgeNode) => {
      const outerRadius = compact
        ? 116
        : Math.min(graphSize.width, graphSize.height, 760) * 0.42;
      const degree = graphTopology.degreeMap.get(node.id) || 1;

      if (node.type === 'post') return outerRadius;
      if (degree >= 6) return outerRadius * 0.44;
      if (degree >= 3) return outerRadius * 0.66;
      return outerRadius * 0.84;
    },
    [compact, graphSize.height, graphSize.width, graphTopology.degreeMap],
  );

  const graphLayoutData = useMemo(() => {
    const total = Math.max(displayGraphData.nodes.length, 1);
    return {
      nodes: displayGraphData.nodes.map((node, index) => {
        const angle = getSeededAngle(node.id, index, total);
        const ringRadius = getRingRadius(node);
        return {
          ...node,
          x: Math.cos(angle) * ringRadius,
          y: Math.sin(angle) * ringRadius,
        };
      }),
      links: displayGraphData.links,
    };
  }, [displayGraphData.links, displayGraphData.nodes, getRingRadius]);

  const highlightedNodeIds = useMemo(() => {
    if (!hoverNode) return new Set<string>();
    return new Set([
      hoverNode.id,
      ...(graphTopology.adjacencyMap.get(hoverNode.id) || []),
    ]);
  }, [graphTopology.adjacencyMap, hoverNode]);

  const activeNode = useMemo(() => {
    if (hoverNode) return hoverNode;
    if (focusedPost) {
      const focused = displayGraphData.nodes.find(
        (n) => n.id === `post:${focusedPost}`,
      );
      if (focused) return focused;
    }
    return [...displayGraphData.nodes].sort(
      (a, b) =>
        (graphTopology.degreeMap.get(b.id) || 0) -
        (graphTopology.degreeMap.get(a.id) || 0),
    )[0];
  }, [displayGraphData.nodes, focusedPost, graphTopology.degreeMap, hoverNode]);

  const shouldShowDetailCard =
    !compact && !!activeNode && (!!hoverNode || !!focusedPost);

  const activeConnectionCount = activeNode
    ? graphTopology.degreeMap.get(activeNode.id) || 0
    : 0;

  const getNodeRadius = useCallback(
    (node: GraphNode) => {
      const degree = graphTopology.degreeMap.get(node.id) || 1;
      const base = node.type === 'tag' ? 3.6 : 3;
      const scale = compact ? 0.72 : 1;
      return (base + Math.log2(degree + 1) * 1.45) * scale;
    },
    [compact, graphTopology.degreeMap],
  );

  const getNodeFootprintRadius = useCallback(
    (node: GraphNode) => {
      const radius = getNodeRadius(node);
      const glowRoom = radius * (node.type === 'tag' ? 2.45 : 2.15);
      return glowRoom + (compact ? 7 : 15);
    },
    [compact, getNodeRadius],
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

  useEffect(() => {
    const shell = graphShellRef.current;
    if (!shell || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setGraphSize({
        width: Math.max(320, Math.round(width)),
        height: Math.max(compact ? 220 : 460, Math.round(height)),
      });
    });

    observer.observe(shell);
    return () => observer.disconnect();
  }, [compact]);

  useEffect(() => {
    hasFitted.current = false;
  }, [displayGraphData.nodes.length, displayGraphData.links.length, query]);

  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;
    fg.d3Force('charge')?.strength((node: GraphNode) => {
      const degree = graphTopology.degreeMap.get(node.id) || 1;
      const base = node.type === 'tag' ? -180 : -130;
      return (base - Math.min(degree, 8) * 14) * (compact ? 0.45 : 1);
    });
    fg.d3Force('link')?.distance((link: KnowledgeLink) => {
      const source = resolveNodeId(link.source as string | KnowledgeNode);
      const target = resolveNodeId(link.target as string | KnowledgeNode);
      const degree = Math.max(
        graphTopology.degreeMap.get(source) || 1,
        graphTopology.degreeMap.get(target) || 1,
      );
      return (compact ? 52 : 112) + Math.min(degree, 8) * (compact ? 3 : 7);
    });
    fg.d3Force('center')?.strength(0.018);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    fg.d3Force(
      'radial',
      forceRadial((node: any) => {
        const n = node as GraphNode;
        return getRingRadius(n);
      }).strength(compact ? 0.18 : 0.12) as any,
    );
    fg.d3Force(
      'collision',
      forceCollide((node: any) => {
        const n = node as GraphNode;
        return getNodeFootprintRadius(n);
      })
        .strength(1)
        .iterations(compact ? 3 : 5) as any,
    );
    /* eslint-enable @typescript-eslint/no-explicit-any */
    fg.d3ReheatSimulation();
  }, [
    compact,
    getNodeFootprintRadius,
    getRingRadius,
    graphLayoutData,
    graphTopology.degreeMap,
  ]);

  const fitGraph = useCallback(
    (duration = 700) => {
      const fg = graphRef.current;
      if (!fg) return;
      hasFitted.current = true;
      if (focusedPost) {
        const focusNode = graphLayoutData.nodes.find(
          (n) => n.id === `post:${focusedPost}`,
        ) as GraphNode | undefined;
        if (focusNode?.x !== undefined && focusNode?.y !== undefined) {
          fg.centerAt(focusNode.x, focusNode.y, duration);
          fg.zoom(compact ? 4 : 2.35, duration);
          return;
        }
      }
      fg.zoomToFit(duration, compact ? 18 : 24);
    },
    [compact, focusedPost, graphLayoutData.nodes],
  );

  const handleEngineStop = useCallback(() => {
    fitGraph();
  }, [fitGraph]);

  useEffect(() => {
    if (hasFitted.current) return;
    const timer = setTimeout(() => {
      if (!hasFitted.current) fitGraph();
    }, 1200);
    return () => clearTimeout(timer);
  }, [displayGraphData, fitGraph, focusedPost, compact]);

  return (
    <div
      className={
        compact
          ? 'border-primary-900/10 overflow-hidden rounded-xl border bg-[#f6f8f2] dark:border-white/10 dark:bg-[#111915]'
          : 'border-primary-900/10 overflow-hidden rounded-xl border bg-[#f6f8f2] shadow-[0_22px_80px_rgba(34,58,44,0.12)] dark:border-white/10 dark:bg-[#111915] dark:shadow-[0_22px_80px_rgba(0,0,0,0.28)]'
      }
    >
      <div className="border-primary-900/10 flex flex-col gap-4 border-b bg-white/62 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between dark:border-white/10 dark:bg-white/[0.04]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('graphLabel')}
            </p>
            <p className="border-primary-700/15 bg-primary-50 text-primary-800 dark:border-primary-200/15 dark:bg-primary-300/10 dark:text-primary-100 rounded-full border px-3 py-1 text-xs font-medium">
              {t('stats', { posts: stats.posts, tags: stats.tags })}
            </p>
          </div>
          {!compact && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
              {t('mapHint')}
            </p>
          )}
        </div>
        {!compact && (
          <label className="w-full max-w-md">
            <span className="sr-only">{t('searchGraph')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="ring-primary-900/10 focus:ring-primary-600/35 dark:focus:ring-primary-300/35 block w-full rounded-full border-0 bg-white px-4 py-2.5 text-sm text-gray-800 ring-1 transition placeholder:text-gray-400 focus:ring-2 dark:bg-[#17221c] dark:text-gray-100 dark:ring-white/10 dark:placeholder:text-gray-500"
            />
          </label>
        )}
      </div>

      <div
        ref={graphShellRef}
        className={
          compact
            ? 'relative h-[250px]'
            : 'relative h-[560px] sm:h-[620px] lg:h-[700px]'
        }
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${palette.grid} 1px, transparent 1px), linear-gradient(90deg, ${palette.grid} 1px, transparent 1px)`,
            backgroundSize: compact ? '42px 42px' : '56px 56px',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_52%_44%,rgba(119,198,157,0.2),transparent_32%),radial-gradient(circle_at_78%_72%,rgba(106,183,200,0.16),transparent_28%)] dark:bg-[radial-gradient(circle_at_52%_44%,rgba(139,215,178,0.12),transparent_32%),radial-gradient(circle_at_78%_72%,rgba(106,183,200,0.1),transparent_28%)]" />

        {displayGraphData.nodes.length ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphLayoutData}
            width={graphSize.width}
            height={graphSize.height}
            backgroundColor="rgba(0,0,0,0)"
            nodeRelSize={1}
            linkCurvature={0.14}
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
                ? 1.6
                : 0.55;
            }}
            linkDirectionalParticles={0}
            warmupTicks={compact ? 140 : 260}
            cooldownTicks={compact ? 120 : 180}
            d3AlphaDecay={0.055}
            d3VelocityDecay={0.58}
            minZoom={0.35}
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
                highlightedNodeIds.size === 0 ||
                highlightedNodeIds.has(node.id);
              const radius = getNodeRadius(node as GraphNode);
              const renderRadius =
                radius / Math.max(1, Math.min(globalScale, 2.6));
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

              const sprite = getNodeSprite(renderRadius, nodeColor, glowColor);
              const spriteSize = sprite.width / NODE_SPRITE_SCALE;
              ctx.drawImage(
                sprite,
                x - spriteSize / 2,
                y - spriteSize / 2,
                spriteSize,
                spriteSize,
              );

              if (isTag || isFocused) {
                ctx.beginPath();
                ctx.arc(x, y, renderRadius + 2.5 / globalScale, 0, 2 * Math.PI);
                ctx.strokeStyle = glowColor;
                ctx.lineWidth = Math.max(1, 1.4 / globalScale);
                ctx.stroke();
              }

              const degree = graphTopology.degreeMap.get(node.id) || 0;
              const showLabel =
                globalScale > LABEL_ZOOM_THRESHOLD ||
                (isTag && degree >= 7 && globalScale > 1.8) ||
                (hoverNode && hoverNode.id === node.id);
              if (showLabel && !(compact && !isTag)) {
                const fontSize = Math.min(
                  12.5,
                  Math.max(9.5, 11 / globalScale),
                );
                const label = clampLabel(node.label, compact);
                ctx.font = `600 ${fontSize}px Space Grotesk, Inter, -apple-system, sans-serif`;
                const labelWidth = ctx.measureText(label).width;
                const labelHeight = fontSize + 7;
                const labelX = x - labelWidth / 2 - 7;
                const labelY = y + renderRadius + 5 / globalScale;

                ctx.globalAlpha = isHighlighted ? 0.92 : DIMMED_ALPHA;
                ctx.fillStyle = palette.labelBg;
                drawRoundedRect(
                  ctx,
                  labelX,
                  labelY,
                  labelWidth + 14,
                  labelHeight,
                  7,
                );
                ctx.fill();

                ctx.globalAlpha = isHighlighted ? 0.96 : DIMMED_ALPHA;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = palette.label;
                ctx.fillText(label, x, labelY + labelHeight / 2 + 0.5);
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
              ctx.arc(node.x || 0, node.y || 0, radius + 9, 0, 2 * Math.PI);
              ctx.fill();
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <div className="border-primary-900/10 max-w-sm rounded-xl border bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-[#17221c]/85">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t('noMatches')}
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                {t('searchHint')}
              </p>
            </div>
          </div>
        )}

        {shouldShowDetailCard && activeNode && (
          <aside className="pointer-events-none absolute right-4 bottom-4 left-4 hidden sm:right-auto sm:block sm:w-80">
            <div className="border-primary-900/10 pointer-events-auto rounded-xl border bg-white/86 p-4 shadow-[0_18px_54px_rgba(34,58,44,0.16)] backdrop-blur-md dark:border-white/10 dark:bg-[#17221c]/88 dark:shadow-[0_18px_54px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-primary-700 dark:text-primary-200 text-xs font-medium">
                  {activeNode.type === 'post' ? t('postNode') : t('tagNode')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('connections', { count: activeConnectionCount })}
                </p>
              </div>
              <h2 className="mt-2 line-clamp-2 text-base leading-6 font-semibold text-gray-900 dark:text-gray-100">
                {activeNode.label}
              </h2>
              {activeNode.summary && (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {activeNode.summary}
                </p>
              )}
              {!!activeNode.tags?.length && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {activeNode.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="bg-primary-50 text-primary-800 dark:bg-primary-300/10 dark:text-primary-100 rounded-full px-2 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => router.push(activeNode.href)}
                className="bg-primary-800 hover:bg-primary-900 dark:bg-primary-300 dark:text-primary-950 dark:hover:bg-primary-200 mt-4 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white transition active:translate-y-px"
              >
                {t('openNode')}
              </button>
            </div>
          </aside>
        )}

        {!compact && (
          <div className="border-primary-900/10 pointer-events-none absolute right-4 bottom-4 hidden rounded-full border bg-white/78 px-3 py-2 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-md sm:flex sm:items-center sm:gap-3 dark:border-white/10 dark:bg-[#17221c]/78 dark:text-gray-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2a7f95]" />
              {t('legendPosts')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-[#2f7d5f] bg-[#8bd7b2]" />
              {t('legendTags')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
