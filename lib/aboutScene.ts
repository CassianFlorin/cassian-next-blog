import { seeded } from './archiveScene';
import type { KnowledgeNodeKey } from './knowledgeNodes';

/**
 * Layout for the About observatory: me at the centre, my four directions as
 * tilted rings, the writing on each ring as stars, projects as small cores,
 * my engineering roots as a ring underneath — and the same stars re-laid as
 * a rising spiral when the page turns to time. Computed on the server.
 *
 * Every star has two homes (topic and time) so the client can morph between
 * the two readings of the same traces.
 */

export type Vec3 = [number, number, number];

export interface AboutRing {
  label: string;
  radius: number;
  /** Euler tilt (x, z) in radians. */
  tilt: [number, number];
  count: number;
}

export interface AboutPost {
  title: string;
  href: string;
  date: string;
  ring: number;
  topicPosition: Vec3;
  timePosition: Vec3;
}

export interface AboutProject {
  title: string;
  href: string;
  ring: number;
  position: Vec3;
}

export interface AboutLabelPoint {
  label: string;
  position: Vec3;
}

export interface AboutSceneData {
  rings: AboutRing[];
  posts: AboutPost[];
  projects: AboutProject[];
  roots: AboutLabelPoint[];
  years: AboutLabelPoint[];
}

export interface AboutInput {
  /** One per direction, in display order. */
  focus: Array<{ label: string; territories: KnowledgeNodeKey[] }>;
  posts: Array<{
    title: string;
    href: string;
    date: string;
    territories: KnowledgeNodeKey[];
  }>;
  projects: Array<{
    title: string;
    href: string;
    territories: KnowledgeNodeKey[];
  }>;
  roots: string[];
}

const round = (value: number) => Math.round(value * 100) / 100;
const roundVec = (v: Vec3): Vec3 => [round(v[0]), round(v[1]), round(v[2])];

/** Point on a ring of radius r at angle a, tilted by (x, z). */
export function ringPoint(
  radius: number,
  angle: number,
  tilt: [number, number],
): Vec3 {
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  // Rotate around x, then around z.
  const [tx, tz] = tilt;
  const y1 = -z * Math.sin(tx);
  const z1 = z * Math.cos(tx);
  const x2 = x * Math.cos(tz) - y1 * Math.sin(tz);
  const y2 = x * Math.sin(tz) + y1 * Math.cos(tz);
  return [x2, y2, z1];
}

export function buildAboutScene(input: AboutInput): AboutSceneData {
  const ringOf = (territories: KnowledgeNodeKey[]) => {
    for (const key of territories) {
      const index = input.focus.findIndex((f) => f.territories.includes(key));
      if (index >= 0) return index;
    }
    return input.focus.length - 1;
  };

  const rings: AboutRing[] = input.focus.map((focus, i) => ({
    label: focus.label,
    radius: round(4.2 + i * 1.55),
    tilt: [round(0.18 + i * 0.07), round((i % 2 ? -1 : 1) * (0.1 + i * 0.05))],
    count: 0,
  }));

  // Topic home: evenly along the ring of the article's first direction.
  const byRing = new Map<number, typeof input.posts>();
  input.posts.forEach((post) => {
    const ring = ringOf(post.territories);
    byRing.set(ring, [...(byRing.get(ring) ?? []), post]);
  });
  rings.forEach((ring, i) => {
    ring.count = byRing.get(i)?.length ?? 0;
  });

  // Time home: one rising spiral, oldest at the bottom.
  const chronological = [...input.posts].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const timeIndex = new Map(chronological.map((post, i) => [post.href, i]));
  const turns = 2.2;
  const timePoint = (i: number): Vec3 => {
    const t = chronological.length > 1 ? i / (chronological.length - 1) : 0;
    const angle = t * Math.PI * 2 * turns;
    return [Math.cos(angle) * 8.6, -3.4 + t * 8, Math.sin(angle) * 8.6];
  };

  const posts: AboutPost[] = [];
  byRing.forEach((list, ring) => {
    const spec = rings[ring];
    list.forEach((post, k) => {
      const angle =
        (k / list.length) * Math.PI * 2 + seeded(post.href) * 0.35 + ring;
      posts.push({
        title: post.title,
        href: post.href,
        date: post.date.slice(0, 10),
        ring,
        topicPosition: roundVec(ringPoint(spec.radius, angle, spec.tilt)),
        timePosition: roundVec(timePoint(timeIndex.get(post.href) ?? 0)),
      });
    });
  });

  // Projects sit on their direction's ring, between the stars.
  const projectsByRing = new Map<number, typeof input.projects>();
  input.projects.forEach((project) => {
    const ring = ringOf(project.territories);
    projectsByRing.set(ring, [...(projectsByRing.get(ring) ?? []), project]);
  });
  const projects: AboutProject[] = [];
  projectsByRing.forEach((list, ring) => {
    const spec = rings[ring];
    list.forEach((project, k) => {
      const angle = ((k + 0.5) / list.length) * Math.PI * 2 + 0.6 + ring * 0.9;
      projects.push({
        title: project.title,
        href: project.href,
        ring,
        position: roundVec(ringPoint(spec.radius, angle, spec.tilt)),
      });
    });
  });

  // Roots: a flat ring under the core.
  const roots: AboutLabelPoint[] = input.roots.map((label, i) => {
    const angle = (i / input.roots.length) * Math.PI * 2 + 0.4;
    return {
      label,
      position: roundVec([Math.cos(angle) * 3, -3.6, Math.sin(angle) * 3]),
    };
  });

  // Year markers on the spiral, at each year's first article.
  const years: AboutLabelPoint[] = [];
  let lastYear = '';
  chronological.forEach((post, i) => {
    const year = post.date.slice(0, 4);
    if (year && year !== lastYear) {
      lastYear = year;
      const p = timePoint(i);
      years.push({
        label: year,
        position: roundVec([p[0] * 1.14, p[1], p[2] * 1.14]),
      });
    }
  });

  return { rings, posts, projects, roots, years };
}
