'use client';

import { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
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
  const leadArticle = articlePosts[0];
  const secondaryArticles = articlePosts.slice(1);

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
        className="grid gap-10 pt-6 pb-8 lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)] lg:items-center lg:gap-14"
        style={{ opacity: 0 }}
      >
        <div className="max-w-3xl space-y-7">
          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-gray-900 sm:text-5xl md:text-6xl dark:text-gray-50">
              {t('home.title')}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8 dark:text-gray-300">
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
                    ? 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 shadow-primary-900/10 dark:bg-primary-400 dark:hover:bg-primary-300 inline-flex min-h-11 items-center rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-all duration-200 active:translate-y-px dark:text-gray-950'
                    : 'hover:border-primary-300 hover:text-primary-700 dark:hover:border-primary-700 dark:hover:text-primary-300 inline-flex min-h-11 items-center rounded-full border border-gray-200/90 bg-white/75 px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-gray-700 transition-all duration-200 hover:bg-white active:translate-y-px dark:border-gray-800 dark:bg-gray-950/50 dark:text-gray-200 dark:hover:bg-gray-900'
                }
              >
                {t(`home.${action.labelKey}`)}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.75rem] border border-gray-200/70 bg-white/70 p-3 shadow-[0_24px_80px_rgba(74,65,54,0.10)] dark:border-gray-800/80 dark:bg-gray-950/55 dark:shadow-none">
          <Image
            src="https://picsum.photos/seed/cassian-agent-workbench/960/1120"
            alt=""
            width={960}
            height={1120}
            priority
            className="aspect-[6/7] w-full rounded-[1.35rem] object-cover"
          />
        </div>
      </section>

      <section className="border-y border-gray-200/70 py-5 dark:border-gray-800/80">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {focusAreaKeys.map((area) => (
            <div
              key={area}
              className="rounded-2xl bg-white/45 px-4 py-3 text-sm font-medium text-gray-700 ring-1 ring-gray-200/70 dark:bg-gray-950/30 dark:text-gray-300 dark:ring-gray-800/80"
            >
              {t(`home.focusAreas.${area}`)}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-7 py-14">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            {t('home.featuredProjects')}
          </h2>
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
            {t('home.featuredProjectsDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          {featuredProjects.map((project, index) => (
            <article
              key={project.title}
              className={
                index === 0
                  ? 'group overflow-hidden rounded-[1.75rem] bg-white/70 ring-1 ring-gray-200/80 transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:bg-gray-950/45 dark:ring-gray-800/80 dark:hover:bg-gray-950'
                  : 'group bg-primary-50/70 ring-primary-200/70 hover:bg-primary-50 dark:bg-primary-950/20 dark:ring-primary-900/40 rounded-[1.75rem] p-6 ring-1 transition-all duration-300 hover:-translate-y-1'
              }
            >
              {index === 0 ? (
                <div className="grid h-full md:grid-cols-[0.92fr_1fr]">
                  <Image
                    src="https://picsum.photos/seed/skill-hub-agent-tools/900/900"
                    alt=""
                    width={900}
                    height={900}
                    className="h-full min-h-72 w-full object-cover"
                  />
                  <div className="flex flex-col p-6 md:p-7">
                    <ProjectContent project={project} t={t} />
                  </div>
                </div>
              ) : (
                <ProjectContent project={project} t={t} compact />
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-7 py-14">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            {t('home.writingTopics')}
          </h2>
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
            {t('home.writingTopicsDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {writingTopics.map((topic, index) => (
            <Link
              key={topic.href}
              href={topic.href}
              className={
                index === 0
                  ? 'group rounded-[1.75rem] bg-gray-900 p-7 text-white transition-all duration-300 hover:-translate-y-1 md:row-span-2 dark:bg-gray-50 dark:text-gray-950'
                  : 'group rounded-[1.75rem] bg-white/60 p-7 ring-1 ring-gray-200/70 transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:bg-gray-950/40 dark:ring-gray-800/80 dark:hover:bg-gray-950'
              }
            >
              <h3
                className={
                  index === 0
                    ? 'mb-4 text-2xl leading-tight font-semibold tracking-tight text-white transition-colors duration-200 dark:text-gray-950'
                    : 'group-hover:text-primary-700 dark:group-hover:text-primary-300 mb-3 text-xl leading-tight font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-gray-50'
                }
              >
                {t(`home.writingTopicCards.${topic.id}.title`)}
              </h3>
              <p
                className={
                  index === 0
                    ? 'text-sm leading-6 text-gray-200 dark:text-gray-700'
                    : 'text-sm leading-6 text-gray-600 dark:text-gray-400'
                }
              >
                {t(`home.writingTopicCards.${topic.id}.description`)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-14">
        <div className="grid overflow-hidden rounded-[1.75rem] bg-white/70 ring-1 ring-gray-200/80 md:grid-cols-[0.85fr_1fr] dark:bg-gray-950/45 dark:ring-gray-800/80">
          <Image
            src="https://picsum.photos/seed/obsidian-knowledge-map/900/700"
            alt=""
            width={900}
            height={700}
            className="h-full min-h-64 w-full object-cover"
          />
          <div className="flex flex-col justify-center gap-6 p-7 md:p-9">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
                {t('home.knowledgeMapTitle')}
              </h2>
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                {t('home.knowledgeMapDescription')}
              </p>
            </div>
            <Link
              href="/knowledge"
              className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 dark:bg-primary-400 dark:hover:bg-primary-300 inline-flex min-h-11 w-fit items-center rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-white transition-all duration-200 active:translate-y-px dark:text-gray-950"
            >
              {t('home.openKnowledgeMap')}
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-7 py-14">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            {t('home.selectedArticles')}
          </h2>
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
            {t('home.selectedArticlesDescription')}
          </p>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.82fr]"
        >
          {!articlePosts.length && (
            <p className="text-gray-500 dark:text-gray-400">
              {t('blog.noPosts')}
            </p>
          )}
          {leadArticle && <ArticleFeature post={leadArticle} />}

          <div className="grid gap-5">
            {secondaryArticles.map((post) => (
              <ArticleRow key={post.slug} post={post} />
            ))}
          </div>
        </div>

        <div className="flex justify-start pt-5">
          <Link
            href="/blog"
            className="hover:border-primary-300 hover:text-primary-700 dark:hover:border-primary-700 dark:hover:text-primary-300 inline-flex min-h-11 items-center rounded-full border border-gray-200/90 bg-white/70 px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-gray-700 transition-all duration-200 hover:bg-white active:translate-y-px dark:border-gray-800 dark:bg-gray-950/45 dark:text-gray-200 dark:hover:bg-gray-950"
            aria-label={t('home.viewAllPosts')}
          >
            {t('home.viewAllPosts')}
          </Link>
        </div>
      </section>
    </>
  );
}

function ProjectContent({
  project,
  t,
  compact = false,
}: {
  project: (typeof projectsData)[number];
  t: ReturnType<typeof useTranslations>;
  compact?: boolean;
}) {
  return (
    <div className="flex h-full flex-col space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            {project.title}
          </h3>
          <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200/80 dark:bg-gray-900/60 dark:text-gray-400 dark:ring-gray-800">
            {project.status}
          </span>
        </div>
        <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
          {project.description}
        </p>
      </div>

      <div
        className={
          compact
            ? 'grid gap-4 text-sm leading-6 text-gray-600 dark:text-gray-400'
            : 'grid gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 dark:text-gray-400'
        }
      >
        <div>
          <p className="mb-1 font-semibold text-gray-800 dark:text-gray-200">
            {t('home.projectProblem')}
          </p>
          <p>{project.problem}</p>
        </div>
        <div>
          <p className="mb-1 font-semibold text-gray-800 dark:text-gray-200">
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
              className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200/80 dark:bg-gray-900/55 dark:text-gray-400 dark:ring-gray-800"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
          <Link
            href={project.href}
            className="text-primary-700 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-200 transition-colors duration-200"
          >
            {t('home.viewProject')}
          </Link>
          {project.relatedPosts?.map((post) => (
            <Link
              key={post.href}
              href={post.href}
              className="text-primary-700 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-200 transition-colors duration-200"
            >
              {t('home.relatedArticle')}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArticleFeature({ post }: { post: HomePost }) {
  const { slug, date, title, summary, tags } = post;

  return (
    <article
      className="group rounded-[1.75rem] bg-white/70 p-7 ring-1 ring-gray-200/80 transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:bg-gray-950/45 dark:ring-gray-800/80 dark:hover:bg-gray-950"
      style={{ opacity: 0 }}
    >
      <div className="flex h-full flex-col">
        <time dateTime={date} className="mb-5 text-sm text-gray-500">
          {formatDate(date, siteMetadata.locale)}
        </time>

        <h3 className="mb-4 text-2xl leading-tight font-semibold tracking-tight">
          <Link
            href={`/blog/${slug}`}
            className="group-hover:text-primary-700 dark:group-hover:text-primary-300 text-gray-900 transition-colors duration-200 dark:text-gray-50"
          >
            {title}
          </Link>
        </h3>

        <p className="mb-7 line-clamp-3 flex-grow text-sm leading-6 text-gray-600 dark:text-gray-400">
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
}

function ArticleRow({ post }: { post: HomePost }) {
  const { slug, date, title, summary, tags } = post;

  return (
    <article
      className="group rounded-[1.75rem] border border-gray-200/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/60 dark:border-gray-800/80 dark:hover:bg-gray-950/35"
      style={{ opacity: 0 }}
    >
      <time dateTime={date} className="mb-3 block text-sm text-gray-500">
        {formatDate(date, siteMetadata.locale)}
      </time>

      <h3 className="mb-2 text-lg leading-snug font-semibold tracking-tight">
        <Link
          href={`/blog/${slug}`}
          className="group-hover:text-primary-700 dark:group-hover:text-primary-300 text-gray-900 transition-colors duration-200 dark:text-gray-50"
        >
          {title}
        </Link>
      </h3>

      <p className="mb-4 line-clamp-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
        {summary}
      </p>

      <div className="flex flex-wrap gap-2">
        {tags.slice(0, 2).map((tag) => (
          <Tag key={tag} text={tag} />
        ))}
      </div>
    </article>
  );
}
