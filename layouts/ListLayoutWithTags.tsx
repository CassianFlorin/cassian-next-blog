'use client';

import { usePathname } from 'next/navigation';
import { slug } from 'github-slugger';
import { formatDate } from 'pliny/utils/formatDate';
import { CoreContent } from 'pliny/utils/contentlayer';
import type { Blog } from 'contentlayer/generated';
import Link from '@/components/Link';
import Tag from '@/components/Tag';
import siteMetadata from '@/data/siteMetadata';
import tagData from 'app/tag-data.json';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('blog');

  return (
    <div className="pt-8 pb-4">
      <nav className="flex items-center justify-between">
        {!prevPage ? (
          <span className="text-sm text-gray-300 dark:text-gray-600">
            {t('previous')}
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
            {t('previous')}
          </Link>
        )}
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {currentPage} / {totalPages}
        </span>
        {!nextPage ? (
          <span className="text-sm text-gray-300 dark:text-gray-600">
            {t('next')}
          </span>
        ) : (
          <Link
            href={`/${basePath}/page/${currentPage + 1}`}
            rel="next"
            className="hover:text-primary-600 dark:hover:text-primary-400 text-sm text-gray-500 transition-colors dark:text-gray-400"
          >
            {t('next')}
          </Link>
        )}
      </nav>
    </div>
  );
}

export default function ListLayoutWithTags({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
}: ListLayoutProps) {
  const pathname = usePathname();
  const tagCounts = tagData as Record<string, number>;
  const tagKeys = Object.keys(tagCounts);
  const sortedTags = tagKeys.sort((a, b) => tagCounts[b] - tagCounts[a]);
  const t = useTranslations('blog');

  const displayPosts =
    initialDisplayPosts.length > 0 ? initialDisplayPosts : posts;

  return (
    <>
      <div>
        <div className="pt-6 pb-8">
          <h1 className="text-2xl leading-9 font-bold tracking-tight text-gray-800 sm:hidden sm:text-3xl dark:text-gray-100">
            {title}
          </h1>
        </div>
        <div className="flex sm:space-x-12">
          <div className="hidden h-full max-h-screen max-w-[240px] min-w-[240px] flex-wrap overflow-auto rounded-2xl bg-white/60 pt-5 sm:flex dark:bg-gray-900/40">
            <div className="px-5 py-4">
              {pathname.startsWith('/blog') ? (
                <h3 className="text-primary-600 dark:text-primary-400 mb-4 text-sm font-medium">
                  {t('allPosts')}
                </h3>
              ) : (
                <Link
                  href={`/blog`}
                  className="hover:text-primary-600 dark:hover:text-primary-400 mb-4 block text-sm font-medium text-gray-600 transition-colors duration-200 dark:text-gray-300"
                >
                  {t('allPosts')}
                </Link>
              )}
              <ul className="space-y-1">
                {sortedTags.map((tag) => {
                  return (
                    <li key={tag}>
                      {decodeURI(pathname.split('/tags/')[1]) === slug(tag) ? (
                        <span className="text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/30 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium">
                          {tag}
                          <span className="text-primary-400 dark:text-primary-500 ml-1.5">
                            {tagCounts[tag]}
                          </span>
                        </span>
                      ) : (
                        <Link
                          href={`/tags/${slug(tag)}`}
                          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs text-gray-500 transition-colors duration-200 hover:bg-gray-100/80 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200"
                          aria-label={`${t('viewPostsTagged')} ${tag}`}
                        >
                          {tag}
                          <span className="ml-1.5 text-gray-400 dark:text-gray-500">
                            {tagCounts[tag]}
                          </span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {displayPosts.map((post) => {
                const { path, date, title, summary, tags } = post;
                return (
                  <article
                    key={path}
                    className="group rounded-2xl bg-white/60 p-5 transition-all duration-300 hover:bg-white hover:shadow-sm dark:bg-gray-900/40 dark:hover:bg-gray-900/60"
                  >
                    <div className="flex h-full flex-col">
                      <time
                        dateTime={date}
                        className="mb-2 text-xs text-gray-400 dark:text-gray-500"
                        suppressHydrationWarning
                      >
                        {formatDate(date, siteMetadata.locale)}
                      </time>
                      <h2 className="mb-2 text-base leading-snug font-semibold tracking-tight">
                        <Link
                          href={`/${path}`}
                          className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-800 transition-colors duration-200 dark:text-gray-100"
                        >
                          {title}
                        </Link>
                      </h2>
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
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
