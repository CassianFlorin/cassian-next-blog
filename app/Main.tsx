'use client';

import { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from '@/components/Link';
import Tag from '@/components/Tag';
import SplitText from '@/components/effects/SplitText';
import SpotlightCard from '@/components/effects/SpotlightCard';
import Marquee from '@/components/effects/Marquee';
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
import { fadeIn, fadeInUp } from '@/lib/animations/fadeIn';

type HomePost = {
  slug: string;
  date: string;
  title: string;
  summary?: string;
  tags: string[];
};

const marqueeTech = [
  'Go',
  'Swift',
  'SwiftUI',
  'Python',
  'Java',
  'Next.js',
  'Obsidian',
  'CLI',
];

export default function Home({ posts }: { posts: HomePost[] }) {
  const t = useTranslations();
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const appProject = projectsData.find((project) => project.category === 'app');
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
    targets: heroCopyRef,
    ...fadeInUp(120, 'medium'),
  });

  useAnime({
    targets: heroVisualRef,
    ...fadeIn(320),
    scale: [0.94, 1],
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
      {/* Hero: asymmetric split with character-level reveal */}
      <section className="grid gap-12 pt-10 pb-16 md:pt-16 lg:min-h-[calc(100dvh-160px)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.62fr)] lg:items-center lg:gap-20">
        <div ref={heroCopyRef} className="max-w-3xl space-y-7 opacity-0">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-gray-900/10 bg-white/60 py-1.5 pr-3.5 pl-1.5 text-sm font-medium text-gray-700 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
            <Image
              src="/static/images/logo.png"
              alt=""
              width={24}
              height={24}
              priority
              className="h-6 w-6 rounded-full object-cover"
            />
            AI Engineering Tool Builder
          </div>

          <div className="space-y-5">
            <SplitText
              as="h1"
              text={t('home.title')}
              delay={260}
              className="text-5xl leading-[1.02] font-bold tracking-tight text-gray-950 sm:text-6xl md:text-7xl dark:text-gray-50"
            />
            <p className="max-w-xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8 dark:text-gray-300">
              {t('home.description')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={heroActions[0].href} className="btn btn-primary">
              {t(`home.${heroActions[0].labelKey}`)}
            </Link>
            <Link href={heroActions[1].href} className="btn btn-ghost">
              {t(`home.${heroActions[1].labelKey}`)}
            </Link>
          </div>
        </div>

        <div ref={heroVisualRef} className="relative opacity-0">
          <div
            aria-hidden="true"
            className="from-primary-400/35 absolute -inset-6 rounded-[3rem] bg-gradient-to-br via-teal-400/20 to-transparent blur-2xl"
          />
          <div className="relative overflow-hidden rounded-[2rem] border border-gray-900/10 bg-white/50 p-2.5 backdrop-blur transition-transform duration-500 hover:-translate-y-1.5 dark:border-white/10 dark:bg-white/5">
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

      {/* Focus areas + stack marquee */}
      <section className="border-y border-gray-900/10 py-6 dark:border-white/10">
        <Marquee>
          {[
            ...focusAreaKeys.map((area) => t(`home.focusAreas.${area}`)),
            ...marqueeTech,
          ].map((label) => (
            <span
              key={label}
              className="mx-2 inline-flex items-center rounded-full border border-gray-900/10 bg-white/55 px-4 py-1.5 text-sm font-medium whitespace-nowrap text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300"
            >
              {label}
            </span>
          ))}
        </Marquee>
      </section>

      {/* Projects + knowledge map bento */}
      <section className="space-y-8 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-gray-50">
              {t('home.featuredProjects')}
            </h2>
            <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
              {t('home.featuredProjectsDescription')}
            </p>
          </div>
          <Link
            href="/projects"
            className="hover:text-primary-800 dark:hover:text-primary-300 text-sm font-semibold text-gray-600 transition-colors dark:text-gray-300"
          >
            {t('home.viewProject')} <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-6">
          {appProject && (
            <div className="from-primary-950 dark:from-primary-900/60 relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br via-[oklch(0.24_0.05_190)] to-gray-950 lg:col-span-4 dark:via-[oklch(0.22_0.045_190)] dark:to-gray-950">
              <div
                aria-hidden="true"
                className="absolute inset-0 [background-image:radial-gradient(circle,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:22px_22px] opacity-40"
              />
              <div className="relative grid gap-6 p-7 sm:grid-cols-[1fr_auto] sm:items-center md:p-9">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-bold tracking-tight text-white">
                      {appProject.title}
                    </h3>
                    <span className="text-primary-100 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium ring-1 ring-white/20">
                      {t(`projects.items.${appProject.id}.status`)}
                    </span>
                  </div>
                  <p className="text-primary-50/85 max-w-xl text-sm leading-6">
                    {t(`projects.items.${appProject.id}.description`)}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {appProject.techStack.slice(0, 5).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-white/80 ring-1 ring-white/15"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  {appProject.href && (
                    <Link
                      href={appProject.href}
                      className="text-primary-200 hover:text-primary-100 inline-flex items-center gap-1.5 pt-1 text-sm font-semibold transition-colors"
                    >
                      {t('home.viewProject')} <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
                {/* Litho brand seal, rebuilt in CSS from the landing page mark */}
                <div className="relative hidden shrink-0 sm:block">
                  <div
                    aria-hidden="true"
                    className="absolute -inset-4 rounded-[3rem] bg-[#CF432D]/25 blur-2xl"
                  />
                  <div className="relative flex h-44 w-44 -rotate-2 items-center justify-center rounded-[2rem] bg-[linear-gradient(150deg,#E7573F_0%,#CF432D_55%,#B33320_100%)] ring-1 shadow-[0_24px_70px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-12px_28px_rgba(0,0,0,0.22)] ring-white/15 transition-transform duration-500 hover:rotate-0 md:h-52 md:w-52">
                    <span
                      aria-hidden="true"
                      className="text-[6.5rem] leading-none font-semibold text-[#FAF6EF] drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] md:text-[7.5rem]"
                    >
                      石
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {featuredProjects.slice(0, 2).map((project) => (
            <SpotlightCard key={project.title} className="lg:col-span-3">
              <div className="flex h-full flex-col gap-4 p-6 md:p-7">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-xl font-bold tracking-tight text-gray-950 dark:text-gray-50">
                    {project.title}
                  </h3>
                  <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-900/10 dark:bg-white/[0.06] dark:text-gray-400 dark:ring-white/10">
                    {t(`projects.items.${project.id}.status`)}
                  </span>
                </div>
                <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {t(`projects.items.${project.id}.description`)}
                </p>
                <div className="mt-auto space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-900/10 dark:bg-white/[0.06] dark:text-gray-400 dark:ring-white/10"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  {project.href && (
                    <Link
                      href={project.href}
                      className="text-primary-700 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-200 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                    >
                      {t('home.viewProject')} <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              </div>
            </SpotlightCard>
          ))}

          <Link
            href="/knowledge"
            className="group from-primary-600 to-primary-800 dark:from-primary-500/90 dark:to-primary-800 relative block overflow-hidden rounded-[1.25rem] bg-gradient-to-br lg:col-span-2 lg:col-start-5 lg:row-start-1"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 [background-image:radial-gradient(circle,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:18px_18px] opacity-30"
            />
            <div className="relative flex h-full min-h-56 flex-col justify-between gap-6 p-7">
              <div className="space-y-3">
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  {t('home.knowledgeMapTitle')}
                </h3>
                <p className="text-primary-50/90 text-sm leading-6">
                  {t('home.knowledgeMapDescription')}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                {t('home.openKnowledgeMap')}
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Writing topics: hover rows */}
      <section className="space-y-8 py-16">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-gray-50">
            {t('home.writingTopics')}
          </h2>
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
            {t('home.writingTopicsDescription')}
          </p>
        </div>

        <div className="divide-y divide-gray-900/10 border-y border-gray-900/10 dark:divide-white/10 dark:border-white/10">
          {writingTopics.map((topic) => (
            <Link
              key={topic.href}
              href={topic.href}
              className="group flex items-center justify-between gap-6 px-2 py-7 transition-colors duration-300 hover:bg-white/60 sm:px-4 dark:hover:bg-white/[0.04]"
            >
              <div className="max-w-2xl space-y-2">
                <h3 className="group-hover:text-primary-800 dark:group-hover:text-primary-300 text-xl font-bold tracking-tight text-gray-950 transition-colors duration-300 sm:text-2xl dark:text-gray-50">
                  {t(`home.writingTopicCards.${topic.id}.title`)}
                </h3>
                <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {t(`home.writingTopicCards.${topic.id}.description`)}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="group-hover:border-primary-500 group-hover:text-primary-800 dark:group-hover:border-primary-400 dark:group-hover:text-primary-300 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-900/15 text-lg text-gray-500 transition-all duration-300 group-hover:-rotate-45 dark:border-white/15 dark:text-gray-400"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Selected articles */}
      <section className="space-y-8 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-gray-50">
              {t('home.selectedArticles')}
            </h2>
            <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
              {t('home.selectedArticlesDescription')}
            </p>
          </div>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_0.95fr]"
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

        <div className="pt-2">
          <Link
            href="/blog"
            className="btn btn-ghost"
            aria-label={t('home.viewAllPosts')}
          >
            {t('home.viewAllPosts')}
          </Link>
        </div>
      </section>
    </>
  );
}

function ArticleFeature({ post }: { post: HomePost }) {
  const { slug, date, title, summary, tags } = post;

  return (
    <article className="opacity-0">
      <SpotlightCard className="h-full">
        <div className="flex h-full flex-col p-7 md:p-8">
          <time
            dateTime={date}
            className="mb-5 font-mono text-xs text-gray-500 dark:text-gray-400"
          >
            {formatDate(date, siteMetadata.locale)}
          </time>

          <h3 className="mb-4 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
            <Link
              href={`/blog/${slug}`}
              className="hover:text-primary-800 dark:hover:text-primary-300 text-gray-950 transition-colors duration-200 dark:text-gray-50"
            >
              {title}
            </Link>
          </h3>

          <p className="mb-7 line-clamp-4 flex-grow text-sm leading-6 text-gray-600 dark:text-gray-400">
            {summary}
          </p>

          <div className="mt-auto flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <Tag key={tag} text={tag} />
            ))}
          </div>
        </div>
      </SpotlightCard>
    </article>
  );
}

function ArticleRow({ post }: { post: HomePost }) {
  const { slug, date, title, summary, tags } = post;

  return (
    <article className="opacity-0">
      <SpotlightCard className="h-full">
        <div className="flex h-full flex-col p-6">
          <time
            dateTime={date}
            className="mb-3 block font-mono text-xs text-gray-500 dark:text-gray-400"
          >
            {formatDate(date, siteMetadata.locale)}
          </time>

          <h3 className="mb-2 text-lg leading-snug font-bold tracking-tight">
            <Link
              href={`/blog/${slug}`}
              className="hover:text-primary-800 dark:hover:text-primary-300 text-gray-950 transition-colors duration-200 dark:text-gray-50"
            >
              {title}
            </Link>
          </h3>

          <p className="mb-4 line-clamp-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
            {summary}
          </p>

          <div className="mt-auto flex flex-wrap gap-2">
            {tags.slice(0, 2).map((tag) => (
              <Tag key={tag} text={tag} />
            ))}
          </div>
        </div>
      </SpotlightCard>
    </article>
  );
}
