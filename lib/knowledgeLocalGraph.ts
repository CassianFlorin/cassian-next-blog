import type { KnowledgeIndex, KnowledgeNodeKey } from './knowledgeNodes';

/**
 * Focus-mode layout: the focused territory at the centre, the territories it
 * connects to on an outer orbit (nearer the top when the bond is stronger),
 * and its own topics on an inner orbit, placed in the gaps between them.
 */

type Anchor = 'start' | 'middle' | 'end';

export interface LocalGraphNode {
  key: KnowledgeNodeKey;
  weight: number;
  x: number;
  y: number;
  r: number;
}

export interface LocalGraphTopic {
  label: string;
  slug: string;
  count: number;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  anchor: Anchor;
}

export interface LocalGraph {
  width: number;
  height: number;
  center: { key: KnowledgeNodeKey; x: number; y: number; r: number };
  related: LocalGraphNode[];
  topics: LocalGraphTopic[];
  maxWeight: number;
}

const WIDTH = 1000;
const HEIGHT = 640;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const OUTER = { rx: 380, ry: 230 };
const INNER = { rx: 190, ry: 128 };

const round = (value: number) => Math.round(value * 10) / 10;

const anchorFor = (cos: number): Anchor =>
  cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';

export function buildLocalGraph(
  index: KnowledgeIndex,
  key: KnowledgeNodeKey,
  { maxRelated = 7, maxTopics = 6 } = {},
): LocalGraph | null {
  const node = index.byKey.get(key);
  if (!node) return null;

  const related = node.related.slice(0, maxRelated);
  const maxWeight = Math.max(1, ...related.map((relation) => relation.weight));
  const step = (Math.PI * 2) / Math.max(related.length, 1);
  const start = -Math.PI / 2;

  const relatedNodes = related.map((relation, i) => {
    const angle = start + i * step;
    return {
      key: relation.key,
      weight: relation.weight,
      x: round(CX + Math.cos(angle) * OUTER.rx),
      y: round(CY + Math.sin(angle) * OUTER.ry),
      r: round(7 + (relation.weight / maxWeight) * 9),
    };
  });

  const topics = node.topics.slice(0, maxTopics);
  // Offset by half a step so topics sit between related territories.
  const topicStep = (Math.PI * 2) / Math.max(topics.length, 1);
  const topicStart =
    start + (related.length ? step / 2 : 0) + (topics.length === 1 ? 0 : 0.2);
  const topicNodes = topics.map((topic, i) => {
    const angle = topicStart + i * topicStep;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = CX + cos * INNER.rx;
    const y = CY + sin * INNER.ry;
    const anchor = anchorFor(cos);
    return {
      label: topic.label,
      slug: topic.slug,
      count: topic.count,
      x: round(x),
      y: round(y),
      labelX: round(
        anchor === 'start' ? x + 12 : anchor === 'end' ? x - 12 : x,
      ),
      labelY: round(anchor === 'middle' ? y + (sin < 0 ? -14 : 26) : y + 5),
      anchor,
    };
  });

  const size = node.articles.length + node.notes.length;
  return {
    width: WIDTH,
    height: HEIGHT,
    center: { key, x: CX, y: CY, r: round(18 + Math.sqrt(size) * 4) },
    related: relatedNodes,
    topics: topicNodes,
    maxWeight,
  };
}
