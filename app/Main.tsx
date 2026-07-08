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
        className="grid gap-10 pt-8 pb-12 md:pt-12 lg:min-h-[calc(100dvh-88px)] lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.78fr)] lg:items-center lg:gap-16"
      >
        <div className="max-w-3xl space-y-7">
          <div className="border-primary-900/10 text-primary-900 dark:text-primary-100 inline-flex items-center gap-3 rounded-full border bg-white/55 px-3 py-2 text-sm font-semibold shadow-[0_14px_40px_rgba(36,75,67,0.08)] dark:border-white/10 dark:bg-white/5">
            <Image
              src="/static/images/logo.png"
              alt=""
              width={28}
              height={28}
              priority
              className="h-7 w-7 rounded-full object-cover"
            />
            AI Engineering Tool Builder
          </div>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl leading-[1.04] font-semibold tracking-tight text-gray-950 sm:text-5xl md:text-6xl dark:text-gray-50">
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
                    ? 'bg-primary-700 hover:bg-primary-800 active:bg-primary-900 dark:bg-primary-200 dark:hover:bg-primary-100 dark:text-primary-950 inline-flex min-h-11 items-center rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-[0_16px_45px_rgba(23,55,49,0.16)] transition-all duration-200 active:translate-y-px'
                    : 'hover:border-primary-400 hover:text-primary-800 dark:hover:border-primary-400 dark:hover:text-primary-100 border-primary-900/15 inline-flex min-h-11 items-center rounded-full border bg-white/65 px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-gray-700 transition-all duration-200 hover:bg-white active:translate-y-px dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/[0.08]'
                }
              >
                {t(`home.${action.labelKey}`)}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="border-primary-900/10 dark:bg-primary-950 absolute -top-4 -left-4 hidden h-28 w-28 rounded-[1.5rem] border bg-[#f2ecd8] p-3 shadow-[0_20px_70px_rgba(36,75,67,0.16)] md:block dark:border-white/10">
            <Image
              src="/static/images/logo.png"
              alt=""
              width={160}
              height={160}
              priority
              className="h-full w-full rounded-[1.15rem] object-cover"
            />
          </div>
          <div className="border-primary-900/10 overflow-hidden rounded-[2rem] border bg-white/45 p-3 shadow-[0_30px_90px_rgba(36,75,67,0.14)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <Image
              src="/static/images/avatar.png"
              alt="Cassian Florin portrait over misty mountains"
              width={1024}
              height={1024}
              priority
              className="aspect-square w-full rounded-[1.6rem] object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-primary-900/10 border-y py-5 dark:border-white/10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {focusAreaKeys.map((area) => (
            <div
              key={area}
              className="border-primary-900/15 border-l px-4 py-2 text-sm font-semibold text-gray-700 dark:border-white/10 dark:text-gray-300"
            >
              {t(`home.focusAreas.${area}`)}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-7 py-14">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
            {t('home.featuredProjects')}
          </h2>
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
            {t('home.featuredProjectsDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          {featuredProjects.map((project, index) => (
            <article
              key={project.title}
              className={
                index === 0
                  ? 'group ring-primary-900/10 overflow-hidden rounded-[1.5rem] bg-white/62 ring-1 transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:bg-white/[0.045] dark:ring-white/10 dark:hover:bg-white/[0.065]'
                  : 'group bg-primary-950 ring-primary-900/20 dark:bg-primary-100 dark:text-primary-950 rounded-[1.5rem] p-6 text-white ring-1 transition-all duration-300 hover:-translate-y-1 dark:ring-white/10'
              }
            >
              {index === 0 ? (
                <div className="grid h-full md:grid-cols-[0.85fr_1fr]">
                  <div className="dark:bg-primary-950 flex min-h-72 items-center justify-center bg-[#f2ecd8] p-8">
                    <Image
                      src="/static/images/logo.png"
                      alt=""
                      width={420}
                      height={420}
                      className="w-full max-w-64 rounded-[1.5rem] object-cover shadow-[0_18px_60px_rgba(36,75,67,0.18)]"
                    />
                  </div>
                  <div className="flex flex-col p-6 md:p-7">
                    <ProjectContent project={project} t={t} />
                  </div>
                </div>
              ) : (
                <ProjectContent project={project} t={t} compact inverted />
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-7 py-14">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
            {t('home.writingTopics')}
          </h2>
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
            {t('home.writingTopicsDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_0.82fr]">
          {writingTopics.map((topic, index) => (
            <Link
              key={topic.href}
              href={topic.href}
              className={
                index === 0
                  ? 'group bg-primary-900 dark:bg-primary-100 dark:text-primary-950 rounded-[1.5rem] p-7 text-white transition-all duration-300 hover:-translate-y-1 md:row-span-2'
                  : 'group ring-primary-900/10 rounded-[1.5rem] bg-white/55 p-7 ring-1 transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:bg-white/[0.045] dark:ring-white/10 dark:hover:bg-white/[0.065]'
              }
            >
              <h3
                className={
                  index === 0
                    ? 'dark:text-primary-950 mb-4 text-2xl leading-tight font-semibold tracking-tight text-white transition-colors duration-200'
                    : 'group-hover:text-primary-800 dark:group-hover:text-primary-200 mb-3 text-xl leading-tight font-semibold tracking-tight text-gray-950 transition-colors duration-200 dark:text-gray-50'
                }
              >
                {t(`home.writingTopicCards.${topic.id}.title`)}
              </h3>
              <p
                className={
                  index === 0
                    ? 'text-primary-50 dark:text-primary-900 text-sm leading-6'
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
        <div className="ring-primary-900/10 grid overflow-hidden rounded-[1.5rem] bg-white/62 ring-1 md:grid-cols-[0.72fr_1fr] dark:bg-white/[0.045] dark:ring-white/10">
          <div className="flex min-h-64 items-center justify-center bg-[linear-gradient(135deg,#244b43,#7f9785)] p-8 dark:bg-[linear-gradient(135deg,#13201c,#31534a)]">
            <Image
              src="/static/images/avatar.png"
              alt=""
              width={520}
              height={520}
              className="w-full max-w-72 rounded-[1.5rem] object-cover shadow-[0_24px_80px_rgba(13,29,25,0.22)]"
            />
          </div>
          <div className="flex flex-col justify-center gap-6 p-7 md:p-9">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
                {t('home.knowledgeMapTitle')}
              </h2>
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                {t('home.knowledgeMapDescription')}
              </p>
            </div>
            <Link
              href="/knowledge"
              className="bg-primary-700 hover:bg-primary-800 active:bg-primary-900 dark:bg-primary-200 dark:hover:bg-primary-100 dark:text-primary-950 inline-flex min-h-11 w-fit items-center rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-white transition-all duration-200 active:translate-y-px"
            >
              {t('home.openKnowledgeMap')}
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-7 py-14">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
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
            className="hover:border-primary-400 hover:text-primary-800 dark:hover:border-primary-400 dark:hover:text-primary-100 border-primary-900/15 inline-flex min-h-11 items-center rounded-full border bg-white/65 px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-gray-700 transition-all duration-200 hover:bg-white active:translate-y-px dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/[0.08]"
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
  inverted = false,
}: {
  project: (typeof projectsData)[number];
  t: ReturnType<typeof useTranslations>;
  compact?: boolean;
  inverted?: boolean;
}) {
  const headingClass = inverted
    ? 'text-2xl font-semibold tracking-tight text-white dark:text-primary-950'
    : 'text-2xl font-semibold tracking-tight text-gray-950 dark:text-gray-50';
  const bodyClass = inverted
    ? 'text-sm leading-6 text-primary-50 dark:text-primary-900'
    : 'text-sm leading-6 text-gray-600 dark:text-gray-400';
  const labelClass = inverted
    ? 'mb-1 font-semibold text-white dark:text-primary-950'
    : 'mb-1 font-semibold text-gray-800 dark:text-gray-200';
  const chipClass = inverted
    ? 'rounded-full bg-white/[0.12] px-2.5 py-0.5 text-xs font-medium text-primary-50 ring-1 ring-white/[0.18] dark:bg-primary-950/[0.08] dark:text-primary-900 dark:ring-primary-950/10'
    : 'rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-primary-900/10 dark:bg-white/[0.06] dark:text-gray-400 dark:ring-white/10';
  const linkClass = inverted
    ? 'text-primary-50 transition-colors duration-200 hover:text-white dark:text-primary-900 dark:hover:text-primary-950'
    : 'text-primary-800 hover:text-primary-950 dark:text-primary-200 dark:hover:text-primary-100 transition-colors duration-200';

  return (
    <div className="flex h-full flex-col space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={headingClass}>{project.title}</h3>
          <span className={chipClass}>{project.status}</span>
        </div>
        <p className={bodyClass}>{project.description}</p>
      </div>

      <div
        className={
          compact
            ? `grid gap-4 ${bodyClass}`
            : `grid gap-4 sm:grid-cols-2 ${bodyClass}`
        }
      >
        <div>
          <p className={labelClass}>{t('home.projectProblem')}</p>
          <p>{project.problem}</p>
        </div>
        <div>
          <p className={labelClass}>{t('home.projectProvides')}</p>
          <p>{project.solution}</p>
        </div>
      </div>

      <div className="mt-auto space-y-4">
        <div className="flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <span key={tech} className={chipClass}>
              {tech}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
          {project.href && (
            <Link href={project.href} className={linkClass}>
              {t('home.viewProject')}
            </Link>
          )}
          {project.relatedPosts?.map((post) => (
            <Link key={post.href} href={post.href} className={linkClass}>
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
    <article className="group ring-primary-900/10 rounded-[1.5rem] bg-white/62 p-7 ring-1 transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:bg-white/[0.045] dark:ring-white/10 dark:hover:bg-white/[0.065]">
      <div className="flex h-full flex-col">
        <time dateTime={date} className="mb-5 text-sm text-gray-500">
          {formatDate(date, siteMetadata.locale)}
        </time>

        <h3 className="mb-4 text-2xl leading-tight font-semibold tracking-tight">
          <Link
            href={`/blog/${slug}`}
            className="group-hover:text-primary-800 dark:group-hover:text-primary-200 text-gray-950 transition-colors duration-200 dark:text-gray-50"
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
    <article className="group border-primary-900/10 rounded-[1.5rem] border p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/50 dark:border-white/10 dark:hover:bg-white/[0.045]">
      <time dateTime={date} className="mb-3 block text-sm text-gray-500">
        {formatDate(date, siteMetadata.locale)}
      </time>

      <h3 className="mb-2 text-lg leading-snug font-semibold tracking-tight">
        <Link
          href={`/blog/${slug}`}
          className="group-hover:text-primary-800 dark:group-hover:text-primary-200 text-gray-950 transition-colors duration-200 dark:text-gray-50"
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
