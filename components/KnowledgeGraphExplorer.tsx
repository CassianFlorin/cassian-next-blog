'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, MutableRefObject } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { forceCollide, forceX, forceY } from 'd3-force-3d';
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
import {
  buildKnowledgeMapModel,
  getKnowledgeCategory,
  type KnowledgeMapLink,
  type KnowledgeMapNode,
} from '@/lib/knowledgeGraphMapModel';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
      <span className="animate-pulse">...</span>
    </div>
  ),
}) as unknown as ComponentType<
  ForceGraphProps<GraphNode, GraphLink> & {
    ref?: MutableRefObject<ForceGraphMethods<GraphNode, GraphLink> | undefined>;
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
    card: 'rgba(23, 34, 28, 0.84)',
    cardSoft: 'rgba(240, 247, 242, 0.08)',
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
    card: 'rgba(255, 255, 255, 0.9)',
    cardSoft: 'rgba(255, 255, 255, 0.64)',
  },
} as const;

const DIMMED_ALPHA = 0.12;
const LABEL_ZOOM_THRESHOLD = 3.1;
const DEFAULT_GRAPH_SIZE = { width: 960, height: 660 };

interface KnowledgeGraphExplorerProps {
  graphData: KnowledgeGraphData;
  focusedPost?: string;
  compact?: boolean;
}

type GraphNode = KnowledgeMapNode & {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
};

type GraphLink = KnowledgeMapLink;

const cloneGraphData = (g: KnowledgeGraphData): KnowledgeGraphData => ({
  nodes: g.nodes.map((n) => ({ ...n })),
  links: g.links.map((l) => ({ ...l })),
});

const resolveNodeId = (node: string | { id: string }) =>
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

const clampLabel = (
  node: Pick<GraphNode, 'displayLabel' | 'visualType'>,
  compact: boolean,
) => {
  const limit =
    node.visualType === 'category'
      ? compact
        ? 14
        : 24
      : node.visualType === 'tag'
        ? compact
          ? 12
          : 18
        : compact
          ? 16
          : 28;
  const label = node.displayLabel;
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

const getNodeDimensions = (node: GraphNode, compact: boolean) => {
  const labelLength = clampLabel(node, compact).length;
  if (node.visualType === 'category') {
    return {
      width: Math.min(
        compact ? 132 : 190,
        Math.max(compact ? 104 : 138, labelLength * (compact ? 7.4 : 8.4) + 34),
      ),
      height: compact ? 32 : 42,
      radius: compact ? 10 : 13,
      fontSize: compact ? 10.5 : 13.5,
      fontWeight: 750,
    };
  }

  if (node.visualType === 'tag') {
    const emphasized = node.weight >= 8.8;
    return {
      width: Math.min(
        emphasized ? (compact ? 112 : 150) : compact ? 72 : 92,
        Math.max(
          emphasized ? (compact ? 58 : 74) : compact ? 42 : 54,
          labelLength * (compact ? 6.4 : 7.2) + (emphasized ? 26 : 14),
        ),
      ),
      height: emphasized ? (compact ? 25 : 30) : compact ? 20 : 23,
      radius: compact ? 8 : 10,
      fontSize: emphasized ? (compact ? 9.6 : 11.4) : compact ? 8.5 : 9.6,
      fontWeight: 700,
    };
  }

  return {
    width: Math.min(
      compact ? 72 : 92,
      Math.max(compact ? 40 : 52, labelLength * (compact ? 2.2 : 2.8) + 28),
    ),
    height: compact ? 18 : 22,
    radius: compact ? 6 : 7,
    fontSize: compact ? 8.6 : 9.8,
    fontWeight: 600,
  };
};

const getNodeFootprintRadius = (node: GraphNode, compact: boolean) => {
  const { width, height } = getNodeDimensions(node, compact);
  return Math.sqrt(width * width + height * height) / 2 + (compact ? 12 : 26);
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
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>(undefined);
  const graphShellRef = useRef<HTMLDivElement>(null);
  const hasFitted = useRef(false);
  const [query, setQuery] = useState('');
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [graphSize, setGraphSize] = useState(DEFAULT_GRAPH_SIZE);
  const visualCompact = compact || graphSize.width < 560;

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayGraphData = useMemo(() => {
    const filtered = filterGraphData(graphData, query);
    return filtered;
  }, [graphData, query]);

  const graphLayoutData = useMemo(
    () =>
      buildKnowledgeMapModel(displayGraphData, {
        width: graphSize.width,
        height: graphSize.height,
        compact: visualCompact,
        focusedPost,
      }),
    [
      displayGraphData,
      focusedPost,
      graphSize.height,
      graphSize.width,
      visualCompact,
    ],
  );

  const graphTopology = useMemo(() => {
    const degreeMap = new Map<string, number>();
    const adjacencyMap = new Map<string, Set<string>>();

    graphLayoutData.links.forEach((link) => {
      const s = resolveNodeId(link.source as string | GraphNode);
      const tgt = resolveNodeId(link.target as string | GraphNode);
      degreeMap.set(s, (degreeMap.get(s) || 0) + 1);
      degreeMap.set(tgt, (degreeMap.get(tgt) || 0) + 1);
      addAdjacentNode(adjacencyMap, s, tgt);
      addAdjacentNode(adjacencyMap, tgt, s);
    });

    return { adjacencyMap, degreeMap };
  }, [graphLayoutData.links]);

  const categoryAnchors = useMemo(() => {
    const anchors = new Map<
      GraphNode['categoryKey'],
      { x: number; y: number }
    >();
    graphLayoutData.nodes.forEach((node) => {
      if (node.visualType === 'category') {
        anchors.set(node.categoryKey, { x: node.x || 0, y: node.y || 0 });
      }
    });
    return anchors;
  }, [graphLayoutData.nodes]);

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
      const focused = graphLayoutData.nodes.find(
        (n) => n.id === `post:${focusedPost}`,
      );
      if (focused) return focused;
    }
    return [...graphLayoutData.nodes].sort(
      (a, b) =>
        b.weight - a.weight ||
        (graphTopology.degreeMap.get(b.id) || 0) -
          (graphTopology.degreeMap.get(a.id) || 0),
    )[0];
  }, [focusedPost, graphLayoutData.nodes, graphTopology.degreeMap, hoverNode]);

  const shouldShowDetailCard =
    !compact && !!activeNode && (!!hoverNode || !!focusedPost);

  const activeConnectionCount = activeNode
    ? graphTopology.degreeMap.get(activeNode.id) || 0
    : 0;

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoverNode((current) => {
      if (current?.id === node?.id) return current;
      return node;
    });
  }, []);

  const stats = useMemo(
    () => ({
      posts: displayGraphData.nodes.filter((n) => n.type === 'post').length,
      tags: displayGraphData.nodes.filter((n) => n.type === 'tag').length,
      categories: graphLayoutData.categoryStats.length,
    }),
    [displayGraphData.nodes, graphLayoutData.categoryStats.length],
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
  }, [graphLayoutData.nodes.length, graphLayoutData.links.length, query]);

  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;
    fg.d3Force('charge')?.strength((node: GraphNode) => {
      const base =
        node.visualType === 'category'
          ? -480
          : node.visualType === 'tag'
            ? -180
            : -120;
      return (
        (base - Math.min(node.weight, 14) * 8) * (visualCompact ? 0.44 : 1)
      );
    });
    fg.d3Force('link')?.distance((link: GraphLink) => {
      const source = resolveNodeId(link.source as string | GraphNode);
      const target = resolveNodeId(link.target as string | GraphNode);
      const degree = Math.max(
        graphTopology.degreeMap.get(source) || 1,
        graphTopology.degreeMap.get(target) || 1,
      );
      if (link.type === 'category-tag') {
        return (visualCompact ? 58 : 112) + Math.min(degree, 8) * 2;
      }
      return (
        (visualCompact ? 76 : 156) +
        Math.min(degree, 8) * (visualCompact ? 3 : 6)
      );
    });
    fg.d3Force('center')?.strength(0.006);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    fg.d3Force(
      'semantic-x',
      forceX((node: any) => {
        const n = node as GraphNode;
        return categoryAnchors.get(n.categoryKey)?.x || 0;
      }).strength((node: any) => {
        const n = node as GraphNode;
        if (n.visualType === 'category') return 0.75;
        if (n.visualType === 'tag') return visualCompact ? 0.14 : 0.08;
        return visualCompact ? 0.08 : 0.04;
      }) as any,
    );
    fg.d3Force(
      'semantic-y',
      forceY((node: any) => {
        const n = node as GraphNode;
        return categoryAnchors.get(n.categoryKey)?.y || 0;
      }).strength((node: any) => {
        const n = node as GraphNode;
        if (n.visualType === 'category') return 0.75;
        if (n.visualType === 'tag') return visualCompact ? 0.14 : 0.08;
        return visualCompact ? 0.08 : 0.04;
      }) as any,
    );
    fg.d3Force(
      'collision',
      forceCollide((node: any) => {
        const n = node as GraphNode;
        return getNodeFootprintRadius(n, visualCompact);
      })
        .strength(1)
        .iterations(visualCompact ? 5 : 8) as any,
    );
    /* eslint-enable @typescript-eslint/no-explicit-any */
    fg.d3ReheatSimulation();
  }, [
    categoryAnchors,
    graphLayoutData,
    graphTopology.degreeMap,
    visualCompact,
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
          fg.zoom(compact ? 4 : visualCompact ? 1.55 : 2.35, duration);
          return;
        }
      }
      if (visualCompact && !compact) {
        fg.centerAt(0, 0, duration);
        fg.zoom(0.82, duration);
        return;
      }
      fg.zoomToFit(duration, compact ? 42 : 124);
    },
    [compact, focusedPost, graphLayoutData.nodes, visualCompact],
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
  }, [graphLayoutData, fitGraph, focusedPost, compact]);

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
              {t('stats', {
                categories: stats.categories,
                posts: stats.posts,
                tags: stats.tags,
              })}
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
            linkColor={(link: LinkObject<GraphNode, GraphLink>) => {
              const s = resolveNodeId(link.source as string | GraphNode);
              const tgt = resolveNodeId(link.target as string | GraphNode);
              if (hoverNode && (s === hoverNode.id || tgt === hoverNode.id)) {
                return palette.linkHover;
              }
              if (link.type === 'category-tag') {
                return isDark
                  ? 'rgba(240, 247, 242, 0.18)'
                  : 'rgba(64, 92, 78, 0.22)';
              }
              return palette.link;
            }}
            linkWidth={(link: LinkObject<GraphNode, GraphLink>) => {
              const s = resolveNodeId(link.source as string | GraphNode);
              const tgt = resolveNodeId(link.target as string | GraphNode);
              if (hoverNode && (s === hoverNode.id || tgt === hoverNode.id)) {
                return 1.8;
              }
              return link.type === 'category-tag' ? 1 : 0.45;
            }}
            linkDirectionalParticles={0}
            warmupTicks={visualCompact ? 160 : 300}
            cooldownTicks={visualCompact ? 130 : 210}
            d3AlphaDecay={0.06}
            d3VelocityDecay={0.62}
            minZoom={0.35}
            maxZoom={8}
            onEngineStop={handleEngineStop}
            onNodeHover={handleNodeHover}
            onNodeClick={(node: GraphNode) => {
              if (node.visualType === 'category') {
                graphRef.current?.centerAt(node.x || 0, node.y || 0, 500);
                graphRef.current?.zoom(compact ? 3.2 : 1.85, 500);
                return;
              }
              router.push(node.href);
            }}
            nodeCanvasObject={(
              node: NodeObject<GraphNode>,
              ctx: CanvasRenderingContext2D,
              globalScale: number,
            ) => {
              const isFocused = !!(
                focusedPost && node.id === `post:${focusedPost}`
              );
              const isHovered = hoverNode?.id === node.id;
              const isHighlighted =
                highlightedNodeIds.size === 0 ||
                highlightedNodeIds.has(node.id);
              const graphNode = node as GraphNode;
              const category = getKnowledgeCategory(graphNode.categoryKey);
              const dimensions = getNodeDimensions(graphNode, visualCompact);
              const zoomDamp = Math.max(1, Math.min(globalScale, 2.35));
              const width = dimensions.width / zoomDamp;
              const height = dimensions.height / zoomDamp;
              const radius = dimensions.radius / zoomDamp;
              const fontSize = dimensions.fontSize / zoomDamp;
              const x = node.x || 0;
              const y = node.y || 0;

              ctx.globalAlpha = isHighlighted ? 1 : DIMMED_ALPHA;
              ctx.shadowColor = isFocused ? palette.focusedGlow : category.glow;
              ctx.shadowBlur =
                graphNode.visualType === 'category' && isHighlighted
                  ? 16 / zoomDamp
                  : isHovered || isFocused
                    ? 12 / zoomDamp
                    : 0;

              drawRoundedRect(
                ctx,
                x - width / 2,
                y - height / 2,
                width,
                height,
                radius,
              );

              if (graphNode.visualType === 'category') {
                ctx.fillStyle = isDark
                  ? `${category.color}66`
                  : `${category.glow}55`;
              } else if (graphNode.visualType === 'tag') {
                ctx.fillStyle = isDark ? `${category.color}3D` : palette.card;
              } else {
                ctx.fillStyle = isDark
                  ? 'rgba(17,25,21,0.72)'
                  : palette.cardSoft;
              }
              ctx.fill();

              ctx.shadowBlur = 0;
              ctx.strokeStyle = isFocused
                ? palette.focused
                : graphNode.visualType === 'post'
                  ? isDark
                    ? 'rgba(240,247,242,0.24)'
                    : 'rgba(64,92,78,0.2)'
                  : category.color;
              ctx.lineWidth =
                (graphNode.visualType === 'category' ? 1.55 : 1.05) / zoomDamp;
              ctx.stroke();

              const showText =
                graphNode.visualType === 'category' ||
                (graphNode.visualType === 'tag' &&
                  (graphNode.weight >= 8.8 ||
                    isHovered ||
                    globalScale > LABEL_ZOOM_THRESHOLD - 0.6)) ||
                isFocused ||
                isHovered ||
                globalScale > LABEL_ZOOM_THRESHOLD + 0.8;
              if (showText) {
                const label = clampLabel(graphNode, visualCompact);
                ctx.font = `${dimensions.fontWeight} ${fontSize}px Space Grotesk, Inter, -apple-system, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle =
                  graphNode.visualType === 'category'
                    ? isDark
                      ? '#f7fff9'
                      : '#173127'
                    : palette.label;
                ctx.fillText(label, x, y + 0.5 / zoomDamp);
              }

              ctx.globalAlpha = 1;
            }}
            nodePointerAreaPaint={(
              node: NodeObject<GraphNode>,
              color: string,
              ctx: CanvasRenderingContext2D,
            ) => {
              const dimensions = getNodeDimensions(
                node as GraphNode,
                visualCompact,
              );
              ctx.fillStyle = color;
              drawRoundedRect(
                ctx,
                (node.x || 0) - dimensions.width / 2,
                (node.y || 0) - dimensions.height / 2,
                dimensions.width,
                dimensions.height,
                dimensions.radius,
              );
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
                  {activeNode.visualType === 'category'
                    ? t('categoryNode')
                    : activeNode.visualType === 'post'
                      ? t('postNode')
                      : t('tagNode')}
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
              {activeNode.href && (
                <button
                  type="button"
                  onClick={() => router.push(activeNode.href)}
                  className="bg-primary-800 hover:bg-primary-900 dark:bg-primary-300 dark:text-primary-950 dark:hover:bg-primary-200 mt-4 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white transition active:translate-y-px"
                >
                  {t('openNode')}
                </button>
              )}
            </div>
          </aside>
        )}

        {!compact && (
          <div className="border-primary-900/10 pointer-events-none absolute right-4 bottom-4 hidden rounded-full border bg-white/78 px-3 py-2 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-md sm:flex sm:items-center sm:gap-3 dark:border-white/10 dark:bg-[#17221c]/78 dark:text-gray-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-5 rounded-md border border-[#7c5cce] bg-[#c4b5fd]/50" />
              {t('legendCategories')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-md bg-[#2a7f95]/70" />
              {t('legendPosts')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-md border border-[#2f7d5f] bg-[#8bd7b2]" />
              {t('legendTags')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
