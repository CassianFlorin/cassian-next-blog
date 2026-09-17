import {
  caseStudyProjects,
  findProjectBySlug,
  getCaseStudy,
  projectSlug,
} from '@/data/caseStudies';
import { renderOgCard } from '@/lib/ogCard';

/** Share cards for case studies, served at `/og/projects/<slug>.png`. */
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudyProjects().map((project) => ({
    slug: `${projectSlug(project)}.png`,
  }));
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ slug: string }> },
) {
  const { slug } = await props.params;
  const ordered = caseStudyProjects();
  const project = findProjectBySlug(slug.replace(/\.png$/, ''));
  const entry = project && getCaseStudy(project.id);
  if (!project || !entry) return new Response('Not found', { status: 404 });

  const position = ordered.findIndex((item) => item.id === project.id) + 1;

  // English copy: a card is shared across locales, and the OG font subset is
  // built for post titles rather than every case-study sentence.
  return renderOgCard({
    title: project.title,
    kicker: `CF / PROJECT ${String(position).padStart(2, '0')}`,
    subtitle: entry.content.en.summary,
    meta: project.techStack.slice(0, 3),
    aside: entry.started,
  });
}
