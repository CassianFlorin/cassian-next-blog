import { getCaseStudy, projectHref } from '@/data/caseStudies';
import projectsData from '@/data/projectsData';
import { getKnowledgeIndex } from './knowledgeData';
import type { KnowledgeNodeKey } from './knowledgeNodes';
import { buildAboutScene } from './aboutScene';

/** Which territories each "focus" direction gathers, in display order. */
const FOCUS_TERRITORIES: KnowledgeNodeKey[][] = [
  ['ai-agent'],
  ['tools', 'languages', 'engineering'],
  ['knowledge-workflow', 'data-integration'],
  ['projects', 'devops'],
];

/** The About observatory for a locale, from the site's real content. */
export function getAboutScene(
  locale: string,
  focusLabels: string[],
  roots: string[],
) {
  const index = getKnowledgeIndex(locale);
  const posts = new Map<
    string,
    {
      title: string;
      href: string;
      date: string;
      territories: KnowledgeNodeKey[];
    }
  >();
  index.nodes.forEach((node) =>
    node.articles.forEach((entry) => {
      const existing = posts.get(entry.href);
      if (existing) existing.territories.push(node.key);
      else
        posts.set(entry.href, {
          title: entry.title,
          href: entry.href,
          date: entry.date || '',
          territories: [node.key],
        });
    }),
  );

  return buildAboutScene({
    focus: FOCUS_TERRITORIES.map((territories, i) => ({
      label: focusLabels[i] ?? '',
      territories,
    })),
    posts: [...posts.values()],
    projects: projectsData
      .filter((project) => getCaseStudy(project.id) || project.href)
      .map((project) => ({
        title: project.title,
        href: projectHref(project).startsWith('/')
          ? projectHref(project)
          : '/projects',
        territories: project.knowledgeNodes ?? [],
      })),
    roots,
  });
}
