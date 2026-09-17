'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, MutableRefObject } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  classifyKnowledgeNode,
  type KnowledgeCategoryKey,
  type KnowledgeMapLink,
  type KnowledgeMapNode,
} from '@/lib/knowledgeGraphMapModel';
import {
  getNodesForTags,
  KNOWLEDGE_NODE_KEYS,
  knowledgeNodeHref,
} from '@/lib/knowledgeNodes';

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

// V2 palette: warm ink on paper, one mineral-green accent for what you are
// looking at. Territories are told apart by position and label, not hue.
const COLORS = {
  dark: {
    ink: 'rgba(240, 238, 233, 0.94)',
    muted: 'rgba(240, 238, 233, 0.58)',
    faint: 'rgba(240, 238, 233, 0.22)',
    surface: '#1d1c1a',
    post: 'rgba(240, 238, 233, 0.42)',
    accent: '#8fbfa6',
    accentSoft: 'rgba(143, 191, 166, 0.2)',
    link: 'rgba(240, 238, 233, 0.08)',
    linkCategory: 'rgba(240, 238, 233, 0.16)',
    linkHover: 'rgba(143, 191, 166, 0.7)',
  },
  light: {
    ink: 'rgba(33, 31, 28, 0.94)',
    muted: 'rgba(33, 31, 28, 0.6)',
    faint: 'rgba(33, 31, 28, 0.2)',
    surface: '#f7f6f3',
    post: 'rgba(33, 31, 28, 0.36)',
    accent: '#3f6e58',
    accentSoft: 'rgba(63, 110, 88, 0.14)',
    link: 'rgba(33, 31, 28, 0.08)',
    linkCategory: 'rgba(33, 31, 28, 0.18)',
    linkHover: 'rgba(63, 110, 88, 0.7)',
  },
} as const;

const DIMMED_ALPHA = 0.12;
const LABEL_ZOOM_THRESHOLD = 3.1;
const DEFAULT_GRAPH_SIZE = { width: 960, height: 660 };

interface KnowledgeGraphExplorerProps {
  graphData: KnowledgeGraphData;
  focusedPost?: string;
  compact?: boolean;
  /** Pre-selected territory filter (Explore mode, `?territory=`). */
  initialTerritory?: KnowledgeCategoryKey;
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

/**
 * Keep one territory: its tags, every post or note filed under it, and the
 * links between them. Membership matches lib/knowledgeNodes, so the filter
 * shows exactly what that territory's focus page lists.
 */
const filterByTerritory = (
  graphData: KnowledgeGraphData,
  territory: KnowledgeCategoryKey | null,
): KnowledgeGraphData => {
  if (!territory) return graphData;
  const visible = new Set(
    graphData.nodes
      .filter((node) =>
        node.type === 'tag'
          ? classifyKnowledgeNode(node) === territory
          : getNodesForTags(node.tags).includes(territory),
      )
      .map((node) => node.id),
  );
  return {
    nodes: graphData.nodes
      .filter((node) => visible.has(node.id))
      .map((node) => {
        if (node.type === 'tag') return node;
        // Classify filtered posts by their in-territory tags only, so the map
        // anchors everything to the one selected territory.
        const own = (node.tags || []).filter(
          (tag) =>
            classifyKnowledgeNode({ type: 'tag', label: tag }) === territory,
        );
        return own.length ? { ...node, tags: own } : node;
      }),
    links: graphData.links.filter(
      (link) =>
        visible.has(resolveNodeId(link.source as string | KnowledgeNode)) &&
        visible.has(resolveNodeId(link.target as string | KnowledgeNode)),
    ),
  };
};

export default function KnowledgeGraphExplorer({
  graphData,
  focusedPost,
  compact = false,
  initialTerritory,
}: KnowledgeGraphExplorerProps) {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const { resolvedTheme } = useTheme();
  const t = useTranslations('knowledge');
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && resolvedTheme === 'dark';
  const palette = isDark ? COLORS.dark : COLORS.light;
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>(undefined);
  const graphShellRef = useRef<HTMLDivElement>(null);
  const hasFitted = useRef(false);
  const [query, setQuery] = useState('');
  const [territory, setTerritory] = useState<KnowledgeCategoryKey | null>(
    initialTerritory ?? null,
  );
  const [fontFamily, setFontFamily] = useState('ui-sans-serif, sans-serif');
  // Reduced motion: the layout is computed up front and the camera jumps
  // instead of gliding, so nothing on the map animates.
  const [reducedMotion, setReducedMotion] = useState(false);
  const territoryLabel = useCallback(
    (key: KnowledgeCategoryKey) => t(`nodes.${key}.label`),
    [t],
  );
  const openHref = useCallback(
    (href: string) =>
      router.push(
        href.startsWith('/') && params?.locale
          ? `/${params.locale}${href}`
          : href,
      ),
    [params?.locale, router],
  );
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [graphSize, setGraphSize] = useState(DEFAULT_GRAPH_SIZE);
  const visualCompact = compact || graphSize.width < 560;

  useEffect(() => {
    setMounted(true);
    // next/font hashes family names, so read the resolved stack for canvas.
    setFontFamily(getComputedStyle(document.body).fontFamily);
    setReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
  }, []);

  const displayGraphData = useMemo(() => {
    return filterGraphData(filterByTerritory(graphData, territory), query);
  }, [graphData, query, territory]);

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
  }, [
    graphLayoutData.nodes.length,
    graphLayoutData.links.length,
    query,
    territory,
  ]);

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
    (requestedDuration = 700) => {
      const duration = reducedMotion ? 0 : requestedDuration;
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
    [compact, focusedPost, graphLayoutData.nodes, reducedMotion, visualCompact],
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

  const categoryKeyOf = (node: GraphNode) =>
    node.visualType === 'category' ? node.categoryKey : null;
  const labelOf = (node: GraphNode) => {
    const key = categoryKeyOf(node);
    return key ? territoryLabel(key) : clampLabel(node, visualCompact);
  };
  const territoryKeys = KNOWLEDGE_NODE_KEYS.filter((key) =>
    graphData.nodes.some(
      (node) => node.type === 'tag' && classifyKnowledgeNode(node) === key,
    ),
  );

  return (
    <div className="min-w-0 overflow-hidden border border-gray-900/15 bg-gray-50 dark:border-white/15 dark:bg-[#141312]">
      {!compact && (
        <div className="space-y-5 border-b border-gray-900/15 p-4 sm:p-5 dark:border-white/15">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-1.5">
              <p className="type-meta text-gray-950 dark:text-gray-50">
                {t('stats', {
                  categories: stats.categories,
                  posts: stats.posts,
                  tags: stats.tags,
                })}
              </p>
              <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
                {t('exploreHint')}
              </p>
            </div>
            <label className="w-full max-w-sm">
              <span className="sr-only">{t('searchGraph')}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="block w-full border-0 border-b border-gray-900/25 bg-transparent px-0 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-950 focus:ring-0 dark:border-white/25 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-50"
              />
            </label>
          </div>

          <div
            role="group"
            aria-label={t('filterLabel')}
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {[null, ...territoryKeys].map((key) => {
              const selected = territory === key;
              return (
                <button
                  key={key ?? 'all'}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTerritory(key)}
                  className={`type-meta min-h-9 shrink-0 border px-3 transition-colors duration-200 ${
                    selected
                      ? 'border-gray-950 bg-gray-950 text-gray-50 dark:border-gray-50 dark:bg-gray-50 dark:text-gray-950'
                      : 'border-gray-900/20 text-gray-600 hover:border-gray-950 hover:text-gray-950 dark:border-white/20 dark:text-gray-300 dark:hover:border-gray-50 dark:hover:text-gray-50'
                  }`}
                >
                  {key ? territoryLabel(key) : t('filterAll')}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        ref={graphShellRef}
        className={
          compact
            ? 'relative h-[250px]'
            : 'relative h-[560px] sm:h-[620px] lg:h-[700px]'
        }
      >
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
              return link.type === 'category-tag'
                ? palette.linkCategory
                : palette.link;
            }}
            linkWidth={(link: LinkObject<GraphNode, GraphLink>) => {
              const s = resolveNodeId(link.source as string | GraphNode);
              const tgt = resolveNodeId(link.target as string | GraphNode);
              if (hoverNode && (s === hoverNode.id || tgt === hoverNode.id)) {
                return 1.6;
              }
              return link.type === 'category-tag' ? 0.9 : 0.45;
            }}
            linkDirectionalParticles={0}
            warmupTicks={visualCompact ? 160 : 300}
            cooldownTicks={reducedMotion ? 0 : visualCompact ? 130 : 210}
            d3AlphaDecay={0.06}
            d3VelocityDecay={0.62}
            minZoom={0.35}
            maxZoom={8}
            onEngineStop={handleEngineStop}
            onNodeHover={handleNodeHover}
            onNodeClick={(node: GraphNode) => {
              const key = categoryKeyOf(node);
              if (key) {
                openHref(knowledgeNodeHref(key));
                return;
              }
              if (node.href?.startsWith('/')) openHref(node.href);
            }}
            nodeCanvasObject={(
              node: NodeObject<GraphNode>,
              ctx: CanvasRenderingContext2D,
              globalScale: number,
            ) => {
              const graphNode = node as GraphNode;
              const isFocused = !!(
                focusedPost && node.id === `post:${focusedPost}`
              );
              const isHovered = hoverNode?.id === node.id;
              const isHighlighted =
                highlightedNodeIds.size === 0 ||
                highlightedNodeIds.has(node.id);
              const dimensions = getNodeDimensions(graphNode, visualCompact);
              const zoomDamp = Math.max(1, Math.min(globalScale, 2.35));
              const width = dimensions.width / zoomDamp;
              const height = dimensions.height / zoomDamp;
              const fontSize = dimensions.fontSize / zoomDamp;
              const x = node.x || 0;
              const y = node.y || 0;
              const emphasis = isHovered || isFocused;

              ctx.globalAlpha = isHighlighted ? 1 : DIMMED_ALPHA;

              if (graphNode.visualType === 'post') {
                // Articles are quiet dots; their titles surface on hover or zoom.
                ctx.beginPath();
                ctx.arc(x, y, (emphasis ? 4.5 : 3) / zoomDamp, 0, Math.PI * 2);
                ctx.fillStyle = emphasis ? palette.accent : palette.post;
                ctx.fill();
              } else {
                drawRoundedRect(
                  ctx,
                  x - width / 2,
                  y - height / 2,
                  width,
                  height,
                  graphNode.visualType === 'category' ? 0 : 2 / zoomDamp,
                );
                ctx.fillStyle =
                  graphNode.visualType === 'category'
                    ? emphasis
                      ? palette.accent
                      : palette.surface
                    : emphasis
                      ? palette.accentSoft
                      : palette.surface;
                ctx.fill();
                ctx.strokeStyle =
                  graphNode.visualType === 'category'
                    ? emphasis
                      ? palette.accent
                      : palette.ink
                    : emphasis
                      ? palette.accent
                      : palette.faint;
                ctx.lineWidth =
                  (graphNode.visualType === 'category' ? 1.2 : 1) / zoomDamp;
                ctx.stroke();
              }

              const showText =
                graphNode.visualType === 'category' ||
                (graphNode.visualType === 'tag' &&
                  (graphNode.weight >= 8.8 ||
                    isHovered ||
                    globalScale > LABEL_ZOOM_THRESHOLD - 0.6)) ||
                emphasis ||
                globalScale > LABEL_ZOOM_THRESHOLD + 0.8;
              if (showText) {
                const label = labelOf(graphNode);
                const isCategory = graphNode.visualType === 'category';
                ctx.font = `${isCategory ? 600 : 500} ${fontSize}px ${fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = isCategory
                  ? emphasis
                    ? palette.surface
                    : palette.ink
                  : graphNode.visualType === 'post'
                    ? palette.ink
                    : palette.muted;
                const labelY =
                  graphNode.visualType === 'post'
                    ? y + 10 / zoomDamp
                    : y + 0.5 / zoomDamp;
                ctx.fillText(
                  isCategory ? label.toUpperCase() : label,
                  x,
                  labelY,
                );
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
            <div className="max-w-sm space-y-2">
              <p className="type-meta text-gray-950 dark:text-gray-50">
                {t('noMatches')}
              </p>
              <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
                {t('searchHint')}
              </p>
            </div>
          </div>
        )}

        {shouldShowDetailCard && activeNode && (
          <aside className="pointer-events-none absolute right-4 bottom-4 left-4 hidden sm:right-auto sm:block sm:w-80">
            <div className="pointer-events-auto border border-gray-900/15 bg-gray-50/95 p-5 dark:border-white/15 dark:bg-[#141312]/95">
              <div className="type-meta flex items-center justify-between gap-3 text-gray-500 dark:text-gray-400">
                <span>
                  {activeNode.visualType === 'category'
                    ? t('nodeLabel')
                    : activeNode.visualType === 'post'
                      ? t('postNode')
                      : t('tagNode')}
                </span>
                <span>
                  {t('connections', { count: activeConnectionCount })}
                </span>
              </div>
              <h2 className="mt-3 line-clamp-2 text-lg leading-snug font-semibold tracking-tight text-gray-950 dark:text-gray-50">
                {labelOf(activeNode)}
              </h2>
              {(categoryKeyOf(activeNode) || activeNode.summary) && (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {categoryKeyOf(activeNode)
                    ? t(`nodes.${categoryKeyOf(activeNode)}.description`)
                    : activeNode.summary}
                </p>
              )}
              {!!activeNode.tags?.length && (
                <p className="type-meta mt-3 text-gray-500 dark:text-gray-400">
                  {activeNode.tags.slice(0, 4).join(' · ')}
                </p>
              )}
            </div>
          </aside>
        )}

        {!compact && (
          <div className="type-meta pointer-events-none absolute right-4 bottom-4 hidden items-center gap-4 text-gray-500 sm:flex dark:text-gray-400">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-5 border border-gray-950 dark:border-gray-50" />
              {t('legendCategories')}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-4 border border-gray-900/25 dark:border-white/25" />
              {t('legendTags')}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
              {t('legendPosts')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
