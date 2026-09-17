import { slug as slugify } from 'github-slugger';
import {
  GENERIC_TAGS,
  getNodesForTags,
  type KnowledgeNodeKey,
} from './knowledgeNodes';

/**
 * Relationships from an article outward: the territories it is filed under,
 * the articles closest to it, and the projects it connects to. Uses the same
 * membership rules as the knowledge map, so an article page and its territory
 * pages always agree.
 */

export interface RelatablePost {
  slug: string;
  title: string;
  path: string;
  date: string;
  tags?: string[];
}

export interface RelatableProject {
  id: string;
  knowledgeNodes?: KnowledgeNodeKey[];
}

export type ProjectRelation<P extends RelatableProject> = {
  project: P;
  /** `explicit`: the project's case study cites this article. */
  reason: 'explicit' | 'territory';
};

/**
 * Territories from specific tags only. The fallback territory given to an
 * article with nothing but generic tags is too weak to relate articles by.
 */
const specificTerritories = (tags: string[] = []): KnowledgeNodeKey[] =>
  tags.some((tag) => !GENERIC_TAGS.has(slugify(tag)))
    ? getNodesForTags(tags)
    : [];

const specificTagSlugs = (tags: string[] = []) =>
  new Set(tags.map((tag) => slugify(tag)).filter((s) => !GENERIC_TAGS.has(s)));

/**
 * Articles ranked by closeness. Shared tags and territories are weighted by
 * rarity (inverse document frequency), so two posts sharing "Obsidian" are
 * closer than two sharing "AI", which half the archive carries. Territories
 * count half as much as tags. Unrelated articles are never padded in.
 */
export function relatedArticles<P extends RelatablePost>(
  current: RelatablePost,
  posts: P[],
  limit = 3,
): P[] {
  const pool = posts.some((post) => post.slug === current.slug)
    ? posts
    : [...posts, current as P];
  const total = pool.length;
  const tagSets = new Map(
    pool.map((post) => [post.slug, specificTagSlugs(post.tags)]),
  );
  const territorySets = new Map(
    pool.map((post) => [post.slug, new Set(specificTerritories(post.tags))]),
  );

  const frequency = (sets: Iterable<Set<string>>) => {
    const counts = new Map<string, number>();
    for (const set of sets) {
      set.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    }
    return counts;
  };
  const tagFrequency = frequency(tagSets.values());
  const territoryFrequency = frequency(territorySets.values());
  const weight = (counts: Map<string, number>, value: string) =>
    Math.log(total / (counts.get(value) || total));

  const tags = tagSets.get(current.slug)!;
  const territories = territorySets.get(current.slug)!;

  return posts
    .filter((post) => post.slug !== current.slug)
    .map((post) => {
      let score = 0;
      tagSets.get(post.slug)!.forEach((tag) => {
        if (tags.has(tag)) score += weight(tagFrequency, tag);
      });
      territorySets.get(post.slug)!.forEach((key) => {
        if (territories.has(key))
          score += 0.5 * weight(territoryFrequency, key);
      });
      return { post, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
    .slice(0, limit)
    .map(({ post }) => post);
}

/**
 * Sharing one broad territory (say, Developer Tools) is too loose to tie an
 * installation guide to a product; uncited projects need two in common.
 */
const MIN_SHARED_TERRITORIES = 2;

/**
 * Projects connected to an article: ones whose case study cites it first,
 * then ones sharing at least two territories with it.
 */
export function relatedProjects<P extends RelatableProject>(
  current: Pick<RelatablePost, 'slug' | 'tags'>,
  projects: P[],
  citations: Map<string, string[]>,
  limit = 3,
): ProjectRelation<P>[] {
  const territories = new Set(specificTerritories(current.tags));
  const explicit = projects
    .filter((project) => citations.get(project.id)?.includes(current.slug))
    .map((project) => ({ project, reason: 'explicit' as const }));
  const cited = new Set(explicit.map(({ project }) => project.id));
  const byTerritory = projects
    .filter(
      (project) =>
        !cited.has(project.id) &&
        (project.knowledgeNodes || []).filter((key) => territories.has(key))
          .length >= MIN_SHARED_TERRITORIES,
    )
    .map((project) => ({ project, reason: 'territory' as const }));

  return [...explicit, ...byTerritory].slice(0, limit);
}
