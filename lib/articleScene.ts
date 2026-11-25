import { seeded } from './archiveScene';

/**
 * Layout for an article's header scene: the article as a core, its sections
 * as satellites on one tilted orbit (in reading order), the writing closest
 * to it as stars further out, and the territories it is filed under above.
 * Computed on the server; the client only receives labels and positions.
 */

export type Vec3 = [number, number, number];

export interface ArticleChapter {
  label: string;
  /** Heading id in the rendered body, without '#'. */
  id: string;
  /** Sub-headings under it; sizes the satellite. */
  weight: number;
}

export interface ArticleNeighbour {
  title: string;
  href: string;
  date: string;
  position: Vec3;
}

export interface ArticleTerritory {
  label: string;
  href: string;
  position: Vec3;
}

export interface ArticleSceneData {
  chapters: ArticleChapter[];
  /** Radius of the chapter orbit around the core. */
  orbit: number;
  neighbours: ArticleNeighbour[];
  territories: ArticleTerritory[];
}

export interface TocHeading {
  value: string;
  url: string;
  depth: number;
}

const MAX_CHAPTERS = 12;
const MAX_NEIGHBOURS = 6;

const round = (value: number) => Math.round(value * 100) / 100;

/** Strip a leading emoji/symbol run so labels read as text. */
const cleanLabel = (value: string) =>
  value.replace(/^[^\p{L}\p{N}]+/u, '').trim() || value.trim();

const decodeId = (id: string) => {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
};

/**
 * The article's sections: the shallowest heading level used at least twice.
 * A lone top heading (a body `#` that repeats the title) is skipped, so a
 * post written `# Title / ## A / ## B` gets A and B.
 */
export function chaptersFromToc(toc: TocHeading[]): ArticleChapter[] {
  const headings = toc.filter((h) => h.url?.startsWith('#') && h.value);
  const depths = [...new Set(headings.map((h) => h.depth))].sort();
  const level = depths.find(
    (depth) => headings.filter((h) => h.depth === depth).length >= 2,
  );
  if (level === undefined) return [];

  const chapters: ArticleChapter[] = [];
  headings.forEach((heading) => {
    if (heading.depth === level) {
      chapters.push({
        label: cleanLabel(heading.value),
        id: decodeId(heading.url.slice(1)),
        weight: 0,
      });
    } else if (heading.depth > level && chapters.length) {
      chapters[chapters.length - 1].weight += 1;
    }
  });
  return chapters.slice(0, MAX_CHAPTERS);
}

export function buildArticleScene(input: {
  toc: TocHeading[];
  neighbours: Array<{ title: string; href: string; date: string }>;
  territories: Array<{ label: string; href: string }>;
}): ArticleSceneData {
  const chapters = chaptersFromToc(input.toc);
  const orbit = round(3.2 + Math.min(chapters.length, MAX_CHAPTERS) * 0.1);

  // Neighbours: a loose outer shell, spread around and a little below.
  const list = input.neighbours.slice(0, MAX_NEIGHBOURS);
  const neighbours = list.map((item, i) => {
    const jitter = seeded(item.href);
    const angle = (i / Math.max(list.length, 1)) * Math.PI * 2 + 0.5;
    const radius = 6.6 + jitter * 1.8;
    return {
      title: item.title,
      href: item.href,
      date: item.date.slice(0, 10),
      // Narrower than deep: the stage is wide but sits right of the title,
      // so a full-width shell would run off the right edge.
      position: [
        round(Math.cos(angle) * radius * 0.7),
        round(-1.2 + (jitter - 0.5) * 3.2),
        round(Math.sin(angle) * radius),
      ] as Vec3,
    };
  });

  // Territories: a short arc above and right of the core, clear of the
  // title on the left; one territory sits just off centre.
  const territories = input.territories.map((territory, i, all) => {
    const t = all.length > 1 ? i / (all.length - 1) : 0.3;
    return {
      label: territory.label,
      href: territory.href,
      position: [round(0.4 + t * 3.6), round(6.1 - t * 1.3), -3] as Vec3,
    };
  });

  return { chapters, orbit, neighbours, territories };
}
