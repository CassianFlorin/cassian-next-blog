import type { KnowledgeOverview } from './knowledgeOverview';
import { getNodesForTags, type KnowledgeNodeKey } from './knowledgeNodes';

/**
 * Layout for the hero's 3D archive: a spiral galaxy around a single core.
 * Each knowledge territory is one arm; every article is a star on the arm of
 * the territory it belongs to, newest closest to the core. Computed on the
 * server so the client only receives positions, never the content model.
 *
 * Positions are in the galaxy's local frame: the disk lies in the x/z plane,
 * y is its (thin) thickness. The client tilts and spins the whole disk.
 */

export interface ArchiveTerritory {
  key: KnowledgeNodeKey;
  label: string;
  notes: number;
  /** Arm index; the arm leaves the core at armAngle(index, total). */
  arm: number;
}

export interface ArchiveCard {
  slug: string;
  title: string;
  date: string;
  href: string;
  territory: KnowledgeNodeKey;
  territoryLabel: string;
  position: [number, number, number];
}

export interface ArchiveSceneData {
  territories: ArchiveTerritory[];
  cards: ArchiveCard[];
}

export interface ArchivePost {
  slug: string;
  path: string;
  date: string;
  title: string;
  tags: string[];
}

/** Radius where the arms leave the core. */
export const ARM_ROOT = 3;
/** Radians an arm turns per unit of log-radius: the spiral's tightness. */
export const ARM_TWIST = 1.35;
export const DISK_RADIUS = 13;

export const armAngle = (index: number, total: number) =>
  (index / Math.max(total, 1)) * Math.PI * 2;

/** Angle of an arm at a given radius (logarithmic spiral). */
export const spiralAngle = (base: number, radius: number) =>
  base + ARM_TWIST * Math.log(Math.max(radius, ARM_ROOT) / ARM_ROOT);

const round = (value: number) => Math.round(value * 100) / 100;

/** Deterministic 0..1 noise so the layout is stable between builds. */
export function seeded(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

export function buildArchiveScene(
  posts: ArchivePost[],
  overview: KnowledgeOverview,
): ArchiveSceneData {
  const territories: ArchiveTerritory[] = overview.nodes.map((node, arm) => ({
    key: node.key,
    label: node.label,
    notes: node.notes,
    arm,
  }));
  const byKey = new Map(territories.map((t) => [t.key, t]));
  const placed = new Map<KnowledgeNodeKey, number>();

  const cards: ArchiveCard[] = [...posts]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map((post) => {
      const candidates = getNodesForTags(post.tags);
      const territory =
        candidates.find((key) => byKey.has(key)) ??
        territories[0]?.key ??
        candidates[0];
      const info = byKey.get(territory);
      const slot = placed.get(territory) ?? 0;
      placed.set(territory, slot + 1);

      // Newest near the core, older further out along the arm.
      const radius = Math.min(
        DISK_RADIUS - 1,
        ARM_ROOT + 1.2 + slot * 1.35 + seeded(post.slug) * 0.9,
      );
      const base = armAngle(info?.arm ?? 0, territories.length);
      const angle =
        spiralAngle(base, radius) + (seeded(`${post.slug}:a`) - 0.5) * 0.22;
      const lift = (seeded(`${post.slug}:y`) - 0.5) * 0.7;

      return {
        slug: post.slug,
        title: post.title,
        date: (post.date || '').slice(0, 10),
        href: `/${post.path}`,
        territory,
        territoryLabel: info?.label ?? '',
        position: [
          round(Math.cos(angle) * radius),
          round(lift),
          round(Math.sin(angle) * radius),
        ],
      };
    });

  return { territories, cards };
}
