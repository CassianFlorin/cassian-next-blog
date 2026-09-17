import { slug as slugify } from 'github-slugger';
import type { KnowledgePost } from './knowledgeGraph';
import {
  classifyKnowledgeNode,
  KNOWLEDGE_CATEGORIES,
  type KnowledgeCategoryKey,
} from './knowledgeGraphMapModel';

/**
 * The single relationship model behind every knowledge surface: the homepage
 * map, /knowledge/[node] focus pages, explorer filters and the sitemap.
 *
 * A knowledge node is a territory (one of KNOWLEDGE_CATEGORIES). Articles and
 * notes belong to every territory their tags touch; projects declare theirs.
 * Two territories are related when writing crosses between them.
 */

export type KnowledgeNodeKey = KnowledgeCategoryKey;

export interface NodeEntry {
  slug: string;
  title: string;
  href: string;
  date?: string;
  summary?: string;
  tags: string[];
}

export interface NodeTopic {
  label: string;
  slug: string;
  count: number;
}

export interface NodeRelation {
  key: KnowledgeNodeKey;
  /** Articles and notes shared by both territories. */
  weight: number;
}

export interface KnowledgeNodeSummary {
  key: KnowledgeNodeKey;
  articles: NodeEntry[];
  notes: NodeEntry[];
  topics: NodeTopic[];
  projects: string[];
  related: NodeRelation[];
}

export interface KnowledgeProjectRef {
  id: string;
  knowledgeNodes?: KnowledgeNodeKey[];
}

export interface KnowledgeIndex {
  nodes: KnowledgeNodeSummary[];
  byKey: Map<KnowledgeNodeKey, KnowledgeNodeSummary>;
  totals: { articles: number; notes: number; topics: number };
}

/** Tags so broad they say nothing about a territory. */
export const GENERIC_TAGS = new Set([
  'tools',
  'guide',
  'tips',
  '开发习惯',
  '解决方案',
  '技术分享',
]);

export const KNOWLEDGE_NODE_KEYS = KNOWLEDGE_CATEGORIES.map(
  (category) => category.key,
);

export const isKnowledgeNodeKey = (value: unknown): value is KnowledgeNodeKey =>
  typeof value === 'string' &&
  (KNOWLEDGE_NODE_KEYS as string[]).includes(value);

export const knowledgeNodeHref = (key: KnowledgeNodeKey) => `/knowledge/${key}`;

/**
 * Territories an item belongs to. Generic tags are ignored so "Guide" does
 * not file every tutorial under Knowledge Workflow; an item with only generic
 * tags falls back to its single primary territory.
 */
export function getNodesForTags(tags: string[] = []): KnowledgeNodeKey[] {
  const specific = tags.filter((tag) => !GENERIC_TAGS.has(slugify(tag)));
  if (!specific.length) {
    return [classifyKnowledgeNode({ type: 'post', label: '', tags })];
  }
  return [
    ...new Set(
      specific.map((tag) => classifyKnowledgeNode({ type: 'tag', label: tag })),
    ),
  ];
}

const byDateDesc = (a: NodeEntry, b: NodeEntry) =>
  (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title);

export function buildKnowledgeIndex({
  posts,
  notes = [],
  projects = [],
}: {
  posts: KnowledgePost[];
  notes?: NodeEntry[];
  projects?: KnowledgeProjectRef[];
}): KnowledgeIndex {
  const summaries = new Map<KnowledgeNodeKey, KnowledgeNodeSummary>();
  const topicCounts = new Map<KnowledgeNodeKey, Map<string, NodeTopic>>();
  const relationWeights = new Map<string, number>();
  const allTopics = new Set<string>();

  const summaryFor = (key: KnowledgeNodeKey) => {
    let summary = summaries.get(key);
    if (!summary) {
      summary = {
        key,
        articles: [],
        notes: [],
        topics: [],
        projects: [],
        related: [],
      };
      summaries.set(key, summary);
    }
    return summary;
  };

  const file = (entry: NodeEntry, kind: 'articles' | 'notes') => {
    const keys = getNodesForTags(entry.tags);
    keys.forEach((key) => summaryFor(key)[kind].push(entry));

    entry.tags.forEach((tag) => {
      const tagSlug = slugify(tag);
      allTopics.add(tagSlug);
      if (GENERIC_TAGS.has(tagSlug)) return;
      const key = classifyKnowledgeNode({ type: 'tag', label: tag });
      const bucket = topicCounts.get(key) || new Map<string, NodeTopic>();
      const topic = bucket.get(tagSlug) || {
        label: tag,
        slug: tagSlug,
        count: 0,
      };
      topic.count += 1;
      bucket.set(tagSlug, topic);
      topicCounts.set(key, bucket);
    });

    const sorted = [...keys].sort();
    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        const id = `${sorted[i]}|${sorted[j]}`;
        relationWeights.set(id, (relationWeights.get(id) || 0) + 1);
      }
    }
  };

  const visiblePosts = posts.filter((post) => post.draft !== true);
  visiblePosts.forEach((post) =>
    file(
      {
        slug: post.slug,
        title: post.title,
        href: `/${post.path || `blog/${post.slug}`}`,
        date: post.date,
        summary: post.summary,
        tags: post.tags || [],
      },
      'articles',
    ),
  );
  notes.forEach((note) => file(note, 'notes'));

  projects.forEach((project) => {
    project.knowledgeNodes?.forEach((key) => {
      summaryFor(key).projects.push(project.id);
    });
  });

  topicCounts.forEach((bucket, key) => {
    summaryFor(key).topics = [...bucket.values()].sort(
      (a, b) => b.count - a.count || a.slug.localeCompare(b.slug),
    );
  });

  relationWeights.forEach((weight, id) => {
    const [a, b] = id.split('|') as [KnowledgeNodeKey, KnowledgeNodeKey];
    summaryFor(a).related.push({ key: b, weight });
    summaryFor(b).related.push({ key: a, weight });
  });

  const nodes = KNOWLEDGE_NODE_KEYS.filter((key) => summaries.has(key)).map(
    (key) => {
      const summary = summaries.get(key)!;
      summary.articles.sort(byDateDesc);
      summary.notes.sort(byDateDesc);
      summary.related.sort(
        (a, b) => b.weight - a.weight || a.key.localeCompare(b.key),
      );
      return summary;
    },
  );

  return {
    nodes,
    byKey: new Map(nodes.map((node) => [node.key, node])),
    totals: {
      articles: visiblePosts.length,
      notes: notes.length,
      topics: allTopics.size,
    },
  };
}
