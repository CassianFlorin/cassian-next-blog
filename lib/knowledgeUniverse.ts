import { slug as slugify } from 'github-slugger';
import { seeded } from './archiveScene';
import type { KnowledgeIndex, KnowledgeNodeKey } from './knowledgeNodes';

/**
 * Layout for the 3D knowledge universe (/knowledge and every territory page).
 *
 * Territories are small worlds spread through space; their topics orbit them
 * as dust; articles are stars. An article that belongs to several
 * territories sits between them, so cross-territory writing reads as a
 * bridge without drawing one. Computed on the server; the client only places.
 */

export type Vec3 = [number, number, number];

export interface UniverseTerritory {
  key: KnowledgeNodeKey;
  label: string;
  description: string;
  href: string;
  articles: number;
  topics: number;
  position: Vec3;
  /** Core radius, by how much the territory holds. */
  size: number;
}

export interface UniverseTopic {
  id: string;
  label: string;
  href: string;
  count: number;
  territory: KnowledgeNodeKey;
  position: Vec3;
}

export interface UniversePost {
  id: string;
  title: string;
  href: string;
  date: string;
  territories: KnowledgeNodeKey[];
  position: Vec3;
}

export interface UniverseData {
  territories: UniverseTerritory[];
  topics: UniverseTopic[];
  posts: UniversePost[];
  /** [postIndex, topicIndex] pairs: an article and a topic it carries. */
  links: Array<[number, number]>;
  /** [territoryIndex, territoryIndex, weight]: writing shared by both. */
  bridges: Array<[number, number, number]>;
}

const SPACE_RADIUS = 13;
const round = (value: number) => Math.round(value * 100) / 100;
const roundVec = (v: Vec3): Vec3 => [round(v[0]), round(v[1]), round(v[2])];

/** Evenly spread directions (Fibonacci sphere). */
function sphereDirection(index: number, total: number): Vec3 {
  const y = total <= 1 ? 0 : 1 - (index / (total - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = index * Math.PI * (3 - Math.sqrt(5));
  return [Math.cos(theta) * r, y, Math.sin(theta) * r];
}

const add = (a: Vec3, b: Vec3, scale = 1): Vec3 => [
  a[0] + b[0] * scale,
  a[1] + b[1] * scale,
  a[2] + b[2] * scale,
];

const normalize = (v: Vec3): Vec3 => {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
};

export function buildKnowledgeUniverse(
  index: KnowledgeIndex,
  label: (key: KnowledgeNodeKey) => string,
  describe: (key: KnowledgeNodeKey) => string,
): UniverseData {
  const held = (node: (typeof index.nodes)[number]) =>
    node.articles.length + node.notes.length;
  const nodes = index.nodes
    .filter((node) => held(node) + node.topics.length > 0)
    .sort((a, b) => held(b) - held(a));
  const largest = Math.max(1, ...nodes.map(held));

  // Territories: biggest in the middle, the rest on a flattened shell.
  const territories: UniverseTerritory[] = nodes.map((node, i) => {
    const count = held(node);
    const direction = sphereDirection(i - 1, Math.max(1, nodes.length - 1));
    const position: Vec3 =
      i === 0
        ? [0, 0, 0]
        : [
            direction[0] * SPACE_RADIUS,
            direction[1] * SPACE_RADIUS * 0.55,
            direction[2] * SPACE_RADIUS,
          ];
    return {
      key: node.key,
      label: label(node.key),
      description: describe(node.key),
      href: `/knowledge/${node.key}`,
      articles: count,
      topics: node.topics.length,
      position: roundVec(position),
      size: round(0.55 + 0.75 * Math.sqrt(count / largest)),
    };
  });
  const anchor = new Map(territories.map((t) => [t.key, t]));
  const territoryIndex = new Map(territories.map((t, i) => [t.key, i]));

  // Topics: a shell of dust around their territory, bigger topics closer.
  const topics: UniverseTopic[] = [];
  nodes.forEach((node) => {
    const home = anchor.get(node.key);
    if (!home) return;
    node.topics.forEach((topic, i) => {
      const direction = sphereDirection(i, Math.max(2, node.topics.length));
      const jitter = seeded(`${node.key}:${topic.slug}`);
      const radius = home.size + 1.4 + (i / node.topics.length) * 2.2 + jitter;
      topics.push({
        id: `${node.key}:${topic.slug}`,
        label: topic.label,
        href: `/tags/${topic.slug}`,
        count: topic.count,
        territory: node.key,
        position: roundVec(add(home.position, direction, radius)),
      });
    });
  });
  const topicsBySlug = new Map<string, number[]>();
  topics.forEach((topic, i) => {
    const slug = topic.href.slice('/tags/'.length);
    topicsBySlug.set(slug, [...(topicsBySlug.get(slug) ?? []), i]);
  });

  // Posts: collect every territory an article belongs to.
  const postMap = new Map<
    string,
    {
      title: string;
      href: string;
      date: string;
      tags: string[];
      keys: KnowledgeNodeKey[];
    }
  >();
  nodes.forEach((node) => {
    [...node.articles, ...node.notes].forEach((entry) => {
      const existing = postMap.get(entry.href);
      if (existing) {
        if (!existing.keys.includes(node.key)) existing.keys.push(node.key);
      } else {
        postMap.set(entry.href, {
          title: entry.title,
          href: entry.href,
          date: (entry.date || '').slice(0, 10),
          tags: entry.tags,
          keys: [node.key],
        });
      }
    });
  });

  const posts: UniversePost[] = [];
  const links: Array<[number, number]> = [];
  [...postMap.values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((post) => {
      const homes = post.keys
        .map((key) => anchor.get(key))
        .filter((t): t is UniverseTerritory => t !== undefined);
      if (!homes.length) return;
      const centroid = homes
        .reduce<Vec3>((sum, t) => add(sum, t.position), [0, 0, 0])
        .map((v) => v / homes.length) as Vec3;
      const noise = seeded(post.href);
      const jitter = normalize([
        seeded(`${post.href}:x`) - 0.5,
        seeded(`${post.href}:y`) - 0.5,
        seeded(`${post.href}:z`) - 0.5,
      ]);
      // A single-territory article orbits outside its topics; a bridging
      // one sits near the midpoint between its territories.
      const position =
        homes.length === 1
          ? add(centroid, jitter, homes[0].size + 3.6 + noise * 2.4)
          : add(centroid, jitter, 0.8 + noise * 1.4);

      const postIndex = posts.length;
      posts.push({
        id: post.href,
        title: post.title,
        href: post.href,
        date: post.date,
        territories: post.keys,
        position: roundVec(position),
      });
      new Set(post.tags.map((tag) => slugify(tag))).forEach((slug) => {
        (topicsBySlug.get(slug) ?? []).forEach((topicIndex) =>
          links.push([postIndex, topicIndex]),
        );
      });
    });

  const bridges: Array<[number, number, number]> = [];
  nodes.forEach((node) => {
    const from = territoryIndex.get(node.key);
    node.related.forEach((relation) => {
      const to = territoryIndex.get(relation.key);
      if (from === undefined || to === undefined || to <= from) return;
      if (relation.weight < 2) return;
      bridges.push([from, to, relation.weight]);
    });
  });

  return { territories, topics, posts, links, bridges };
}
