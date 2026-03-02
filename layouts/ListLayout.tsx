'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { formatDate } from 'pliny/utils/formatDate';
import { CoreContent } from 'pliny/utils/contentlayer';
import type { Blog } from 'contentlayer/generated';
import Link from '@/components/Link';
import Tag from '@/components/Tag';
import siteMetadata from '@/data/siteMetadata';
import { staggerFadeIn, staggerFadeInUp } from '@/lib/animations/stagger';
import { useAnime } from '@/lib/hooks/useAnime';
import { fadeInUp } from '@/lib/animations/fadeIn';

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}
interface ListLayoutProps {
  posts: CoreContent<Blog>[];
  title: string;
  initialDisplayPosts?: CoreContent<Blog>[];
  pagination?: PaginationProps;
}

function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname();
  const basePath = pathname
    .replace(/^\//, '')
    .replace(/\/page\/\d+\/?$/, '')
    .replace(/\/$/, '');
  const prevPage = currentPage - 1 > 0;
  const nextPage = currentPage + 1 <= totalPages;

  return (
    <div className="pt-8 pb-4">
      <nav className="flex items-center justify-between">
        {!prevPage ? (
          <span className="text-sm text-gray-300 dark:text-gray-600">
            Previous
          </span>
        ) : (
          <Link
            href={
              currentPage - 1 === 1
                ? `/${basePath}/`
                : `/${basePath}/page/${currentPage - 1}`
            }
            rel="prev"
            className="hover:text-primary-600 dark:hover:text-primary-400 text-sm text-gray-500 transition-colors dark:text-gray-400"
          >
            Previous
          </Link>
        )}
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {currentPage} / {totalPages}
        </span>
        {!nextPage ? (
          <span className="text-sm text-gray-300 dark:text-gray-600">Next</span>
        ) : (
          <Link
            href={`/${basePath}/page/${currentPage + 1}`}
            rel="next"
            className="hover:text-primary-600 dark:hover:text-primary-400 text-sm text-gray-500 transition-colors dark:text-gray-400"
          >
            Next
          </Link>
        )}
      </nav>
    </div>
  );
}

export default function ListLayout({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
}: ListLayoutProps) {
  const [searchValue, setSearchValue] = useState('');
  const headerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredBlogPosts = posts.filter((post) => {
    const searchContent = post.title + post.summary + post.tags?.join(' ');
    return searchContent.toLowerCase().includes(searchValue.toLowerCase());
  });

  const displayPosts =
    initialDisplayPosts.length > 0 && !searchValue
      ? initialDisplayPosts
      : filteredBlogPosts;

  useAnime({
    targets: headerRef,
    ...fadeInUp(0, 'medium'),
  });

  useEffect(() => {
    if (!listRef.current) return;
    const cards = listRef.current.querySelectorAll<HTMLElement>('article');
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
      startDelay: 160,
    });

    return () => {
      animation.pause();
    };
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (!listRef.current) return;

    const cards = listRef.current.querySelectorAll<HTMLElement>('article');
    if (reducedMotion) {
      cards.forEach((card) => {
        card.style.opacity = '1';
        card.style.removeProperty('transform');
      });
      return;
    }

    const animation = staggerFadeIn(cards, {
      intensity: 'light',
      startDelay: 40,
    });

    return () => {
      animation.pause();
    };
  }, [displayPosts]);

  return (
    <>
      <div>
        <div
          ref={headerRef}
          className="space-y-4 pt-6 pb-8"
          style={{ opacity: 0 }}
        >
          <h1 className="text-2xl leading-9 font-bold tracking-tight text-gray-800 sm:text-3xl dark:text-gray-100">
            {title}
          </h1>
          <div className="relative max-w-md">
            <label>
              <span className="sr-only">Search articles</span>
              <input
                aria-label="Search articles"
                type="text"
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search articles..."
                className="focus:ring-primary-500/50 dark:focus:ring-primary-400/50 block w-full rounded-xl border-0 bg-white/60 px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 ring-1 ring-gray-200/60 transition-all duration-200 focus:bg-white focus:ring-2 dark:bg-gray-900/40 dark:text-gray-200 dark:placeholder-gray-500 dark:ring-gray-800/60 dark:focus:bg-gray-900/60"
              />
            </label>
            <svg
              className="absolute top-2.5 right-3 h-5 w-5 text-gray-400 dark:text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div
          ref={listRef}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {!filteredBlogPosts.length && (
            <p className="text-gray-500 dark:text-gray-400">No posts found.</p>
          )}
          {displayPosts.map((post) => {
            const { path, date, title, summary, tags } = post;
            return (
              <article
                key={path}
                className="group rounded-2xl bg-white/60 p-5 transition-all duration-300 hover:bg-white hover:shadow-sm dark:bg-gray-900/40 dark:hover:bg-gray-900/60"
                style={{ opacity: 0 }}
              >
                <div className="flex h-full flex-col">
                  <time
                    dateTime={date}
                    className="mb-2 text-xs text-gray-400 dark:text-gray-500"
                  >
                    {formatDate(date, siteMetadata.locale)}
                  </time>
                  <h3 className="mb-2 text-base leading-snug font-semibold tracking-tight">
                    <Link
                      href={`/${path}`}
                      className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-800 transition-colors duration-200 dark:text-gray-100"
                    >
                      {title}
                    </Link>
                  </h3>
                  <p className="mb-3 line-clamp-2 flex-grow text-sm text-gray-500 dark:text-gray-400">
                    {summary}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags
                      ?.slice(0, 3)
                      .map((tag) => <Tag key={tag} text={tag} />)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {pagination && pagination.totalPages > 1 && !searchValue && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
        />
      )}
    </>
  );
}
