'use client';

import { useRef } from 'react';
import Link from '@/components/Link';
import projectsData from '@/data/projectsData';
import type { Project } from '@/data/projectsData';
import { useTranslations } from 'next-intl';
import { useAnime } from '@/lib/hooks/useAnime';
import { fadeInUp } from '@/lib/animations/fadeIn';

const appProjects = projectsData.filter((p) => p.category === 'app');
const featuredProjects = projectsData.filter((p) => p.category === 'featured');
const ecosystemProjects = projectsData.filter(
  (p) => p.category === 'ecosystem',
);
const openSourceProjects = projectsData.filter(
  (p) => p.category === 'open-source',
);

type ProjectLabels = {
  projectType: string;
  problem: string;
  solution: string;
  techStack: string;
  relatedPosts: string;
  github: string;
};

function ProjectSection({
  title,
  projects,
  labels,
}: {
  title: string;
  projects: Project[];
  labels: ProjectLabels;
}) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl leading-8 font-bold tracking-tight text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.title} project={project} labels={labels} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  labels,
}: {
  project: Project;
  labels: ProjectLabels;
}) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-gray-200/70 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800/70 dark:bg-gray-950">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="text-xl leading-7 font-semibold text-gray-900 dark:text-gray-100">
            {project.title}
          </h3>
          <span className="w-fit rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">
            {project.status}
          </span>
        </div>
        <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
          {project.description}
        </p>
      </div>

      <div className="mt-5 flex grow flex-col gap-4 text-sm leading-6">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            {labels.problem}
          </h4>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {project.problem}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            {labels.solution}
          </h4>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {project.solution}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            {labels.techStack}
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {project.relatedPosts && project.relatedPosts.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {labels.relatedPosts}
            </h4>
            <ul className="mt-2 space-y-1">
              {project.relatedPosts.map((post) => (
                <li key={post.href}>
                  <Link
                    href={post.href}
                    className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(project.sourceHref || project.href) && (
        <div className="mt-6 flex flex-wrap gap-4 border-t border-gray-200/70 pt-4 text-sm font-medium dark:border-gray-800/70">
          {project.sourceHref && (
            <Link
              href={project.sourceHref}
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            >
              {labels.github}
            </Link>
          )}
          {project.href && (
            <Link
              href={project.href}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {labels.projectType}
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

export default function Projects() {
  const t = useTranslations('projects');
  const headerRef = useRef<HTMLDivElement>(null);
  const projectLabels: ProjectLabels = {
    projectType: t('projectType'),
    problem: t('problem'),
    solution: t('solution'),
    techStack: t('techStack'),
    relatedPosts: t('relatedPosts'),
    github: t('github'),
  };

  useAnime({
    targets: headerRef,
    ...fadeInUp(0, 'medium'),
  });

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          ref={headerRef}
          className="space-y-2 pt-6 pb-8 md:space-y-5"
          style={{ opacity: 0 }}
        >
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            {t('title')}
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            {t('description')}
          </p>
        </div>
        <div className="space-y-12 py-12">
          <ProjectSection
            title={t('applications')}
            projects={appProjects}
            labels={projectLabels}
          />
          <ProjectSection
            title={t('featuredProjects')}
            projects={featuredProjects}
            labels={projectLabels}
          />
          <ProjectSection
            title={t('builderEcosystem')}
            projects={ecosystemProjects}
            labels={projectLabels}
          />
          <ProjectSection
            title={t('openSourceParticipation')}
            projects={openSourceProjects}
            labels={projectLabels}
          />
        </div>
      </div>
    </>
  );
}
