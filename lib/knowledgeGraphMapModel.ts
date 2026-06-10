import type {
  KnowledgeGraphData,
  KnowledgeLink,
  KnowledgeNode,
} from './knowledgeGraph';

export type KnowledgeCategoryKey =
  | 'languages'
  | 'ai-agent'
  | 'tools'
  | 'knowledge-workflow'
  | 'projects'
  | 'devops'
  | 'engineering'
  | 'data-integration';

export type KnowledgeMapVisualType = 'category' | 'tag' | 'post';

export type KnowledgeMapLinkType = KnowledgeLink['type'] | 'category-tag';

export interface KnowledgeCategory {
  key: KnowledgeCategoryKey;
  label: string;
  description: string;
  color: string;
  glow: string;
}

export interface KnowledgeMapNode extends Omit<KnowledgeNode, 'type'> {
  type: KnowledgeNode['type'] | 'category';
  visualType: KnowledgeMapVisualType;
  categoryKey: KnowledgeCategoryKey;
  displayLabel: string;
  weight: number;
  x: number;
  y: number;
  fx?: number;
  fy?: number;
  tags?: string[];
  summary?: string;
}

export interface KnowledgeMapLink {
  source: string;
  target: string;
  type: KnowledgeMapLinkType;
}

export interface KnowledgeMapModelOptions {
  width: number;
  height: number;
  compact: boolean;
  focusedPost?: string;
}

export interface KnowledgeCategoryStat {
  key: KnowledgeCategoryKey;
  tags: number;
  posts: number;
}

export interface KnowledgeMapModel {
  nodes: KnowledgeMapNode[];
  links: KnowledgeMapLink[];
  categoryStats: KnowledgeCategoryStat[];
}

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  {
    key: 'languages',
    label: 'Languages',
    description: 'Programming languages and platform notes',
    color: '#256f8f',
    glow: '#8fd3e8',
  },
  {
    key: 'ai-agent',
    label: 'AI / Agent',
    description: 'Agent tools, AI workflow, and coding assistants',
    color: '#7c5cce',
    glow: '#c4b5fd',
  },
  {
    key: 'tools',
    label: 'Developer Tools',
    description: 'CLI, IDE, Git, and engineering utilities',
    color: '#2f7d5f',
    glow: '#86d2a6',
  },
  {
    key: 'knowledge-workflow',
    label: 'Knowledge Workflow',
    description: 'Notes, graphs, publishing, and knowledge management',
    color: '#b66b1f',
    glow: '#f4b46d',
  },
  {
    key: 'projects',
    label: 'Projects',
    description: 'Open-source projects and shipped tools',
    color: '#a33d5f',
    glow: '#f2a4bc',
  },
  {
    key: 'devops',
    label: 'DevOps',
    description: 'Infrastructure, routing, Docker, and operations',
    color: '#596b23',
    glow: '#c5d86d',
  },
  {
    key: 'engineering',
    label: 'Engineering Method',
    description: 'Architecture, habits, validation, and problem solving',
    color: '#6d6255',
    glow: '#cdbda9',
  },
  {
    key: 'data-integration',
    label: 'Data Integration',
    description: 'Analytics, integration, and product data systems',
    color: '#236c6f',
    glow: '#8dd7d5',
  },
];

const TAG_CATEGORY_MAP: Record<string, KnowledgeCategoryKey> = {
  agent: 'ai-agent',
  ai: 'ai-agent',
  codegraph: 'knowledge-workflow',
  contributors: 'projects',
  cursor: 'ai-agent',
  devops: 'devops',
  diff: 'tools',
  docker: 'devops',
  git: 'tools',
  github: 'tools',
  guide: 'knowledge-workflow',
  'harness engineering': 'engineering',
  hermes: 'ai-agent',
  'intellij idea': 'tools',
  java: 'languages',
  javascript: 'languages',
  manus: 'ai-agent',
  mdx: 'languages',
  mootool: 'projects',
  obsidian: 'knowledge-workflow',
  openclaw: 'ai-agent',
  'open source': 'projects',
  'reverse-proxy': 'devops',
  sdkman: 'tools',
  tips: 'knowledge-workflow',
  tools: 'tools',
  traefik: 'devops',
  个人知识管理: 'knowledge-workflow',
  工具对比: 'tools',
  工具类: 'tools',
  工作流: 'knowledge-workflow',
  工程效率: 'engineering',
  工程方法论: 'engineering',
  开发工具: 'tools',
  开发习惯: 'engineering',
  技术分享: 'knowledge-workflow',
  架构设计: 'engineering',
  神策数据: 'data-integration',
  解决方案: 'engineering',
  验证: 'engineering',
};

const CATEGORY_BY_KEY = new Map(
  KNOWLEDGE_CATEGORIES.map((category) => [category.key, category]),
);

const normalizeLabel = (value: string) => value.trim().toLowerCase();

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

const resolveNodeId = (node: string | KnowledgeNode) =>
  typeof node === 'string' ? node : node.id;

const addCount = (
  map: Map<KnowledgeCategoryKey, number>,
  key: KnowledgeCategoryKey,
) => {
  map.set(key, (map.get(key) || 0) + 1);
};

const getCategoryAnchorMap = (
  categories: KnowledgeCategoryKey[],
  width: number,
  height: number,
  compact: boolean,
) => {
  const columns = compact ? 2 : Math.min(3, Math.max(1, categories.length));
  const rows = Math.ceil(categories.length / columns);
  const usableWidth = width * (compact ? 0.66 : 0.72);
  const usableHeight = height * (compact ? 0.58 : 0.62);
  const xGap = columns > 1 ? usableWidth / (columns - 1) : 0;
  const yGap = rows > 1 ? usableHeight / (rows - 1) : 0;
  const anchors = new Map<KnowledgeCategoryKey, { x: number; y: number }>();

  categories.forEach((key, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const rowOffset = rows > 1 && row % 2 === 1 ? xGap * 0.1 : 0;
    anchors.set(key, {
      x: (columns === 1 ? 0 : column * xGap - usableWidth / 2) + rowOffset,
      y: rows === 1 ? 0 : row * yGap - usableHeight / 2,
    });
  });

  return anchors;
};

const buildDegreeMap = (graphData: KnowledgeGraphData) => {
  const degreeMap = new Map<string, number>();

  graphData.links.forEach((link) => {
    const source = resolveNodeId(link.source as string | KnowledgeNode);
    const target = resolveNodeId(link.target as string | KnowledgeNode);
    degreeMap.set(source, (degreeMap.get(source) || 0) + 1);
    degreeMap.set(target, (degreeMap.get(target) || 0) + 1);
  });

  return degreeMap;
};

export const classifyKnowledgeNode = (
  node: Pick<KnowledgeNode, 'label' | 'type' | 'tags'>,
): KnowledgeCategoryKey => {
  if (node.type === 'tag') {
    return TAG_CATEGORY_MAP[normalizeLabel(node.label)] || 'engineering';
  }

  const counts = new Map<KnowledgeCategoryKey, number>();
  (node.tags || []).forEach((tag) => {
    addCount(counts, TAG_CATEGORY_MAP[normalizeLabel(tag)] || 'engineering');
  });

  return (
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'engineering'
  );
};

export const getKnowledgeCategory = (key: KnowledgeCategoryKey) =>
  CATEGORY_BY_KEY.get(key) || CATEGORY_BY_KEY.get('engineering')!;

export function buildKnowledgeMapModel(
  graphData: KnowledgeGraphData,
  options: KnowledgeMapModelOptions,
): KnowledgeMapModel {
  const degreeMap = buildDegreeMap(graphData);
  const categoryTagCounts = new Map<KnowledgeCategoryKey, number>();
  const categoryPostCounts = new Map<KnowledgeCategoryKey, number>();
  const nodeCategoryMap = new Map<string, KnowledgeCategoryKey>();

  graphData.nodes.forEach((node) => {
    const category = classifyKnowledgeNode(node);
    nodeCategoryMap.set(node.id, category);
    if (node.type === 'tag') addCount(categoryTagCounts, category);
    if (node.type === 'post') addCount(categoryPostCounts, category);
  });

  const activeCategories = KNOWLEDGE_CATEGORIES.map(
    (category) => category.key,
  ).filter((key) => categoryTagCounts.has(key) || categoryPostCounts.has(key));
  const anchors = getCategoryAnchorMap(
    activeCategories,
    options.width,
    options.height,
    options.compact,
  );

  const categoryIndexMap = new Map<KnowledgeCategoryKey, number>();
  const activeNodes = graphData.nodes.filter((node) =>
    nodeCategoryMap.has(node.id),
  );
  const categoryNodes: KnowledgeMapNode[] = activeCategories.map((key) => {
    const category = getKnowledgeCategory(key);
    const anchor = anchors.get(key) || { x: 0, y: 0 };
    const weight =
      10 +
      (categoryTagCounts.get(key) || 0) * 1.4 +
      (categoryPostCounts.get(key) || 0) * 0.8;
    categoryIndexMap.set(key, 0);

    return {
      id: `category:${key}`,
      type: 'category',
      visualType: 'category',
      categoryKey: key,
      label: category.label,
      displayLabel: category.label,
      href: '',
      slug: key,
      summary: category.description,
      weight,
      x: anchor.x,
      y: anchor.y,
      fx: anchor.x,
      fy: anchor.y,
    };
  });

  const visualNodes: KnowledgeMapNode[] = [];

  activeNodes.forEach((node) => {
    const categoryKey = nodeCategoryMap.get(node.id) || 'engineering';
    const anchor = anchors.get(categoryKey) || { x: 0, y: 0 };
    const categoryIndex = categoryIndexMap.get(categoryKey) || 0;
    categoryIndexMap.set(categoryKey, categoryIndex + 1);
    const angle = getSeededAngle(node.id, categoryIndex, activeNodes.length);
    const radius =
      node.type === 'tag'
        ? options.compact
          ? 70
          : 130
        : options.compact
          ? 82
          : 182;
    const drift = node.type === 'tag' ? 0.72 : 1;
    const focusId = options.focusedPost ? `post:${options.focusedPost}` : '';
    const isFocused = node.id === focusId;

    visualNodes.push({
      ...node,
      visualType: node.type,
      categoryKey,
      displayLabel: node.label,
      weight:
        (node.type === 'tag' ? 5 : 2.2) +
        Math.log2((degreeMap.get(node.id) || 1) + 1) * 1.8 +
        (isFocused ? 4 : 0),
      x: anchor.x + Math.cos(angle) * radius * drift,
      y: anchor.y + Math.sin(angle) * radius,
      fx: isFocused && options.compact ? anchor.x : undefined,
      fy: isFocused && options.compact ? anchor.y : undefined,
    });
  });

  visualNodes.push(...categoryNodes);

  const links: KnowledgeMapLink[] = [
    ...graphData.links.map((link) => ({
      source: resolveNodeId(link.source as string | KnowledgeNode),
      target: resolveNodeId(link.target as string | KnowledgeNode),
      type: link.type,
    })),
  ];

  graphData.nodes
    .filter((node) => node.type === 'tag')
    .forEach((node) => {
      const categoryKey = nodeCategoryMap.get(node.id);
      if (!categoryKey) return;
      links.push({
        source: `category:${categoryKey}`,
        target: node.id,
        type: 'category-tag',
      });
    });

  return {
    nodes: visualNodes,
    links,
    categoryStats: activeCategories.map((key) => ({
      key,
      tags: categoryTagCounts.get(key) || 0,
      posts: categoryPostCounts.get(key) || 0,
    })),
  };
}
