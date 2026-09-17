import {
  getKnowledgeCategory,
  type KnowledgeCategoryKey,
} from './knowledgeGraphMapModel';
import type { KnowledgeIndex } from './knowledgeNodes';

/**
 * Layout for the homepage knowledge map, derived from the shared knowledge
 * index: one node per territory, its strongest topics as satellites, and
 * edges where writing crosses between territories. Computed on the server so
 * the full force-directed explorer only loads on /knowledge.
 */

export type LabelAnchor = 'start' | 'middle' | 'end';

export interface OverviewTag {
  label: string;
  href: string;
  count: number;
  x: number;
  y: number;
  /** Label placement, pushed away from the parent so labels never stack. */
  labelX: number;
  labelY: number;
  anchor: LabelAnchor;
}

export interface OverviewNode {
  key: KnowledgeCategoryKey;
  label: string;
  description: string;
  notes: number;
  tagCount: number;
  x: number;
  y: number;
  r: number;
  tags: OverviewTag[];
}

export interface OverviewEdge {
  source: KnowledgeCategoryKey;
  target: KnowledgeCategoryKey;
  weight: number;
}

export interface KnowledgeOverview {
  width: number;
  height: number;
  nodes: OverviewNode[];
  edges: OverviewEdge[];
  totals: { notes: number; tags: number };
}

export const OVERVIEW_WIDTH = 1000;
export const OVERVIEW_HEIGHT = 620;

/** Largest territory sits in the middle; the rest orbit around it. */
const SLOTS: Array<[number, number]> = [
  [500, 316],
  [226, 170],
  [778, 166],
  [206, 470],
  [800, 468],
  [500, 70],
  [500, 566],
  [930, 318],
];

/** The three largest territories show two topics; the rest show one. */
const satellitesFor = (index: number) => (index < 3 ? 2 : 1);

/** One shared post is coincidence; two or more is a connection. */
export const MIN_EDGE_WEIGHT = 2;

const round = (value: number) => Math.round(value * 10) / 10;

export function buildKnowledgeOverview(
  index: KnowledgeIndex,
): KnowledgeOverview {
  const size = (key: KnowledgeCategoryKey) => {
    const node = index.byKey.get(key);
    return node ? node.articles.length + node.notes.length : 0;
  };

  const ranked = [...index.nodes]
    .sort(
      (a, b) =>
        size(b.key) - size(a.key) ||
        b.topics.length - a.topics.length ||
        a.key.localeCompare(b.key),
    )
    .slice(0, SLOTS.length);

  const [cx, cy] = SLOTS[0];

  const nodes: OverviewNode[] = ranked.map((summary, position) => {
    const [x, y] = SLOTS[position];
    const category = getKnowledgeCategory(summary.key);
    const count = size(summary.key);
    const r = round(9 + Math.sqrt(count) * 5);

    // Satellites fan outward, away from the centre of the map.
    const outward = position === 0 ? -Math.PI / 2 : Math.atan2(y - cy, x - cx);
    const topics = summary.topics.slice(0, satellitesFor(position));
    const spread = 0.95;
    const tags = topics.map((topic, topicIndex) => {
      const offset =
        topics.length === 1
          ? 0
          : (topicIndex - (topics.length - 1) / 2) * spread;
      const angle = outward + offset;
      // Territory labels sit under each node; satellites heading downward
      // travel further so they clear that label.
      const distance = r + (Math.sin(angle) > 0.35 ? 100 : 64);
      const tx = x + Math.cos(angle) * distance;
      const ty = y + Math.sin(angle) * distance;
      const cos = Math.cos(angle);
      const anchor: LabelAnchor =
        cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle';
      const labelX =
        anchor === 'start' ? tx + 11 : anchor === 'end' ? tx - 11 : tx;
      const labelY =
        anchor === 'middle' ? ty + (Math.sin(angle) < 0 ? -12 : 22) : ty + 5;
      return {
        label: topic.label,
        href: `/tags/${topic.slug}`,
        count: topic.count,
        x: round(tx),
        y: round(ty),
        labelX: round(labelX),
        labelY: round(labelY),
        anchor,
      };
    });

    return {
      key: summary.key,
      label: category.label,
      description: category.description,
      notes: count,
      tagCount: summary.topics.length,
      x,
      y,
      r,
      tags,
    };
  });

  const placed = new Set(nodes.map((node) => node.key));
  const edges: OverviewEdge[] = ranked
    .flatMap((summary) =>
      summary.related
        .filter(
          (relation) =>
            relation.weight >= MIN_EDGE_WEIGHT &&
            placed.has(relation.key) &&
            summary.key < relation.key,
        )
        .map((relation) => ({
          source: summary.key,
          target: relation.key,
          weight: relation.weight,
        })),
    )
    .sort((a, b) => b.weight - a.weight);

  return {
    width: OVERVIEW_WIDTH,
    height: OVERVIEW_HEIGHT,
    nodes,
    edges,
    totals: {
      notes: index.totals.articles + index.totals.notes,
      tags: index.totals.topics,
    },
  };
}
