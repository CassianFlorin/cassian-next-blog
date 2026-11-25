import { getTranslations } from 'next-intl/server';
import { getCaseStudy, projectHref } from '@/data/caseStudies';
import projectsData from '@/data/projectsData';
import { buildWorkScene } from './workScene';

/** The work orbit for a locale, from the same project data as the pages. */
export async function getWorkScene(locale: string) {
  const t = await getTranslations({ locale, namespace: 'projects' });
  const tk = await getTranslations({ locale, namespace: 'knowledge' });
  return buildWorkScene(
    projectsData.map((project) => ({
      id: project.id,
      title: project.title,
      href: projectHref(project),
      tagline: t.has(`items.${project.id}.tagline`)
        ? t(`items.${project.id}.tagline`)
        : t(`items.${project.id}.description`),
      status: t(`items.${project.id}.status`),
      tech: project.techStack.slice(0, 5),
      territories: project.knowledgeNodes ?? [],
      caseStudy: Boolean(getCaseStudy(project.id)),
    })),
    (key) => tk(`nodes.${key}.label`),
  );
}
