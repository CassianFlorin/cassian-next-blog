import projectsData, { type Project } from '../projectsData';
import branchlight from './branchlight';
import databaseCli from './databaseCli';
import litho from './litho';
import waitlight from './waitlight';
import type { CaseStudyEntry } from './types';

export type { CaseStudy, CaseStudyEntry } from './types';

/** Order here is the order of the Work index and prev/next navigation. */
export const caseStudies: CaseStudyEntry[] = [
  waitlight,
  branchlight,
  litho,
  databaseCli,
];

const byProjectId = new Map(
  caseStudies.map((entry) => [entry.projectId, entry]),
);

export const getCaseStudy = (projectId: string) => byProjectId.get(projectId);

export const caseStudyProjects = (): Project[] =>
  caseStudies
    .map((entry) => projectsData.find((p) => p.id === entry.projectId))
    .filter((project): project is Project => project !== undefined);

/** URL segment for a project, e.g. `waitlight`. */
export const projectSlug = (project: Pick<Project, 'title'>) =>
  project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const findProjectBySlug = (slug: string) =>
  caseStudyProjects().find((project) => projectSlug(project) === slug);

/**
 * Where a project should link on this site: its case study when one exists,
 * otherwise its own destination (product page or repository).
 */
export const projectHref = (project: Project) =>
  getCaseStudy(project.id)
    ? `/projects/${projectSlug(project)}`
    : project.href || project.sourceHref || '/projects';
