'use client';

import { useEffect, useRef } from 'react';
import Link from '@/components/Link';
import Tag from '@/components/Tag';
import siteMetadata from '@/data/siteMetadata';
import { formatDate } from 'pliny/utils/formatDate';
import { useTranslations } from 'next-intl';
import { staggerFadeInUp } from '@/lib/animations/stagger';
import { useAnime } from '@/lib/hooks/useAnime';
import { fadeInUp } from '@/lib/animations/fadeIn';

const MAX_DISPLAY = 6;

export default function Home({ posts }) {
  const t = useTranslations();
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
  }, [posts]);

  return (
    <>
      <div>
        <div
          ref={headerRef}
          className="space-y-2 pt-6 pb-10 md:space-y-4"
          style={{ opacity: 0 }}
        >
          <h1 className="text-3xl leading-9 font-bold tracking-tight text-gray-800 sm:text-4xl sm:leading-10 md:text-5xl md:leading-tight dark:text-gray-100">
            {t('home.title')}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-gray-500 dark:text-gray-400">
            {t('home.description')}
          </p>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {!posts.length && (
            <p className="text-gray-500 dark:text-gray-400">
              {t('blog.noPosts')}
            </p>
          )}
          {posts.slice(0, MAX_DISPLAY).map((post) => {
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

                  <h2 className="mb-2 text-lg leading-snug font-semibold tracking-tight">
                    <Link
                      href={`/blog/${slug}`}
                      className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-800 transition-colors duration-200 dark:text-gray-100"
                    >
                      {title}
                    </Link>
                  </h2>

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
      </div>

      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-center pt-10">
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
      )}
    </>
  );
}
