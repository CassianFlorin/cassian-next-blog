import type { KnowledgeCategoryKey } from './knowledgeGraphMapModel';

/**
 * Layout for the 3D work orbit (/projects and each case-study header).
 *
 * Projects are living cores on a shallow arc in depth, case studies larger
 * and nearer. Each carries its tech stack as orbiting satellites (placed by
 * the client, since they move) and threads to the knowledge territories it
 * belongs to, which hang further back. Computed on the server.
 */

export type Vec3 = [number, number, number];

export interface WorkProject {
  id: string;
  title: string;
  href: string;
  tagline: string;
  status: string;
  tech: string[];
  territories: KnowledgeCategoryKey[];
  caseStudy: boolean;
  position: Vec3;
  size: number;
}

export interface WorkTerritory {
  key: KnowledgeCategoryKey;
  label: string;
  href: string;
  position: Vec3;
}

export interface WorkSceneData {
  projects: WorkProject[];
  territories: WorkTerritory[];
}

export interface WorkInput {
  id: string;
  title: string;
  href: string;
  tagline: string;
  status: string;
  tech: string[];
  territories: KnowledgeCategoryKey[];
  caseStudy: boolean;
}

const round = (value: number) => Math.round(value * 100) / 100;

export function buildWorkScene(
  projects: WorkInput[],
  territoryLabel: (key: KnowledgeCategoryKey) => string,
): WorkSceneData {
  const ordered = [
    ...projects.filter((p) => p.caseStudy),
    ...projects.filter((p) => !p.caseStudy),
  ];
  const count = ordered.length;
  const spread = Math.min(1.25, 0.32 * Math.max(1, count - 1));

  const placed: WorkProject[] = ordered.map((project, i) => {
    const t = count === 1 ? 0 : i / (count - 1) - 0.5;
    const angle = t * spread * 2;
    // A shallow arc that bows away from the camera; extra work sits back.
    const radius = project.caseStudy ? 12 : 15;
    const position: Vec3 = [
      round(Math.sin(angle) * radius),
      round(Math.sin(i * 1.7) * 1.4),
      round(-Math.cos(angle) * radius + radius - (project.caseStudy ? 0 : 3)),
    ];
    return {
      ...project,
      position,
      size: project.caseStudy ? 1.35 : 0.85,
    };
  });

  // Territories hang behind the arc, spread evenly in the order of the
  // projects that reference them, so their names never stack.
  const keys = [...new Set(placed.flatMap((p) => p.territories))];
  const meanX = (key: KnowledgeCategoryKey) => {
    const users = placed.filter((p) => p.territories.includes(key));
    return (
      users.reduce((sum, p) => sum + p.position[0], 0) /
      Math.max(1, users.length)
    );
  };
  const sorted = [...keys].sort((a, b) => meanX(a) - meanX(b));
  const width = Math.max(8, (keys.length - 1) * 4.2);
  const territories: WorkTerritory[] = sorted.map((key, i) => ({
    key,
    label: territoryLabel(key),
    href: `/knowledge/${key}`,
    position: [
      round(
        keys.length === 1 ? 0 : -width / 2 + (i / (keys.length - 1)) * width,
      ),
      round(5.6 + (i % 2) * 1.6),
      round(-9 - (i % 3) * 1.5),
    ],
  }));

  return { projects: placed, territories };
}
