'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from '@/components/Link';
import Tag from '@/components/Tag';
import siteMetadata from '@/data/siteMetadata';
import projectsData from '@/data/projectsData';
import {
  focusAreaKeys,
  heroActions,
  selectedPostSlugs,
  writingTopics,
} from '@/lib/homeContent';
import { formatDate } from 'pliny/utils/formatDate';
import { useTranslations } from 'next-intl';
import { staggerFadeInUp } from '@/lib/animations/stagger';
import { useAnime } from '@/lib/hooks/useAnime';
import { fadeInUp } from '@/lib/animations/fadeIn';

type HomePost = {
  slug: string;
  date: string;
  title: string;
  summary?: string;
  tags: string[];
};

export default function Home({ posts }: { posts: HomePost[] }) {
  const t = useTranslations();
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const featuredProjects = projectsData.filter(
    (project) => project.category === 'featured',
  );
  const selectedPosts = useMemo(() => {
    const bySlug = new Map(posts.map((post) => [post.slug, post]));
    return selectedPostSlugs
      .map((slug) => bySlug.get(slug))
      .filter((post): post is HomePost => Boolean(post))
      .slice(0, 3);
  }, [posts]);
  const articlePosts = useMemo(
    () => (selectedPosts.length ? selectedPosts : posts.slice(0, 3)),
    [posts, selectedPosts],
  );

  useAnime({
    targets: headerRef,
    ...fadeInUp(0, 'medium'),
  });

  useEffect(() => {
    if (!gridRef.current) return;

    const cards = gridRef.current.querySelectorAll<HTMLElement>('article');
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reducedMotion) {
      cards.forEach((card) => {
        card.style.opacity = '1';
        card.style.removeProperty('transform');
      });
      return;
    }

    const animation = staggerFadeInUp(cards, {
      intensity: 'strong',
      startDelay: 180,
    });

    return () => {
      animation.pause();
    };
  }, [articlePosts]);

  return (
    <>
      <section
        ref={headerRef}
        className="space-y-7 pt-6 pb-12"
        style={{ opacity: 0 }}
      >
        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl leading-9 font-bold tracking-tight text-gray-800 sm:text-4xl sm:leading-10 md:text-5xl md:leading-tight dark:text-gray-100">
            {t('home.title')}
          </h1>
          <p className="text-base leading-7 text-gray-500 dark:text-gray-400">
            {t('home.description')}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {heroActions.map((action, index) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                index === 0
                  ? 'bg-primary-500 hover:bg-primary-600 dark:hover:bg-primary-400 inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200'
                  : 'hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center rounded-full bg-white/60 px-5 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-white hover:shadow-sm dark:bg-gray-900/40 dark:text-gray-300 dark:hover:bg-gray-900/60'
              }
            >
              {t(`home.${action.labelKey}`)}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {focusAreaKeys.map((area) => (
            <span
              key={area}
              className="rounded-full bg-gray-100/80 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800/60 dark:text-gray-400"
            >
              {t(`home.focusAreas.${area}`)}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-5 py-10">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
            {t('home.featuredProjects')}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t('home.featuredProjectsDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {featuredProjects.map((project) => (
            <article
              key={project.title}
              className="rounded-2xl bg-white/60 p-6 transition-all duration-300 hover:bg-white hover:shadow-sm dark:bg-gray-900/40 dark:hover:bg-gray-900/60"
            >
              <div className="flex h-full flex-col space-y-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold tracking-tight text-gray-800 dark:text-gray-100">
                      {project.title}
                    </h3>
                    <span className="rounded-full bg-gray-100/80 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {project.description}
                  </p>
                </div>

                <div className="grid gap-4 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  <div>
                    <p className="mb-1 font-medium text-gray-700 dark:text-gray-200">
                      {t('home.projectProblem')}
                    </p>
                    <p>{project.problem}</p>
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-gray-700 dark:text-gray-200">
                      {t('home.projectProvides')}
                    </p>
                    <p>{project.solution}</p>
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-gray-100/80 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800/60 dark:text-gray-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
                    <Link
                      href={project.href}
                      className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-700 transition-colors duration-200 dark:text-gray-200"
                    >
                      {t('home.viewProject')}
                    </Link>
                    {project.relatedPosts?.map((post) => (
                      <Link
                        key={post.href}
                        href={post.href}
                        className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-700 transition-colors duration-200 dark:text-gray-200"
                      >
                        {t('home.relatedArticle')}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5 py-10">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
            {t('home.writingTopics')}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t('home.writingTopicsDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {writingTopics.map((topic) => (
            <Link
              key={topic.href}
              href={topic.href}
              className="group rounded-2xl bg-white/60 p-6 transition-all duration-300 hover:bg-white hover:shadow-sm dark:bg-gray-900/40 dark:hover:bg-gray-900/60"
            >
              <h3 className="group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-3 text-lg font-semibold tracking-tight text-gray-800 transition-colors duration-200 dark:text-gray-100">
                {t(`home.writingTopicCards.${topic.id}.title`)}
              </h3>
              <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
                {t(`home.writingTopicCards.${topic.id}.description`)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="rounded-2xl bg-white/60 p-6 transition-all duration-300 hover:bg-white hover:shadow-sm md:p-8 dark:bg-gray-900/40 dark:hover:bg-gray-900/60">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
                {t('home.knowledgeMapTitle')}
              </h2>
              <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
                {t('home.knowledgeMapDescription')}
              </p>
            </div>
            <Link
              href="/knowledge"
              className="hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center rounded-full bg-gray-100/80 px-5 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-white dark:bg-gray-800/60 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {t('home.openKnowledgeMap')}
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-5 py-10">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
            {t('home.selectedArticles')}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t('home.selectedArticlesDescription')}
          </p>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {!articlePosts.length && (
            <p className="text-gray-500 dark:text-gray-400">
              {t('blog.noPosts')}
            </p>
          )}
          {articlePosts.map((post) => {
            const { slug, date, title, summary, tags } = post;
            return (
              <article
                key={slug}
                className="group rounded-2xl bg-white/60 p-6 transition-all duration-300 hover:bg-white hover:shadow-sm dark:bg-gray-900/40 dark:hover:bg-gray-900/60"
                style={{ opacity: 0 }}
              >
                <div className="flex h-full flex-col">
                  <div className="mb-3">
                    <time
                      dateTime={date}
                      className="text-sm text-gray-400 dark:text-gray-500"
                    >
                      {formatDate(date, siteMetadata.locale)}
                    </time>
                  </div>

                  <h3 className="mb-2 text-lg leading-snug font-semibold tracking-tight">
                    <Link
                      href={`/blog/${slug}`}
                      className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-800 transition-colors duration-200 dark:text-gray-100"
                    >
                      {title}
                    </Link>
                  </h3>

                  <p className="mb-4 line-clamp-2 flex-grow text-sm text-gray-500 dark:text-gray-400">
                    {summary}
                  </p>

                  <div className="mt-auto flex flex-wrap gap-2">
                    {tags.slice(0, 3).map((tag) => (
                      <Tag key={tag} text={tag} />
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex justify-center pt-5">
          <Link
            href="/blog"
            className="hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center rounded-full bg-white/60 px-5 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-white hover:shadow-sm dark:bg-gray-900/40 dark:text-gray-300 dark:hover:bg-gray-900/60"
            aria-label={t('home.viewAllPosts')}
          >
            {t('home.viewAllPosts')}
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
