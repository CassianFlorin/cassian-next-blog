'use client';

import { ReactNode, useRef } from 'react';
import { CoreContent } from 'pliny/utils/contentlayer';
import type { Blog, Authors } from 'contentlayer/generated';
import Comments from '@/components/Comments';
import Link from '@/components/Link';
import PageTitle from '@/components/PageTitle';
import SectionContainer from '@/components/SectionContainer';
import Image from '@/components/Image';
import Tag from '@/components/Tag';
import siteMetadata from '@/data/siteMetadata';
import ScrollTopAndComment from '@/components/ScrollTopAndComment';
import AdSense from '@/components/AdSense';
import adsenseConfig from '@/data/adsenseConfig';
import { useAnime } from '@/lib/hooks/useAnime';
import { fadeInLeft, fadeInUp } from '@/lib/animations/fadeIn';

const editUrl = (path) => `${siteMetadata.siteRepo}/blob/main/data/${path}`;
const discussUrl = (path) =>
  `https://mobile.twitter.com/search?q=${encodeURIComponent(`${siteMetadata.siteUrl}/${path}`)}`;

const postDateTemplate: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

interface LayoutProps {
  content: CoreContent<Blog>;
  authorDetails: CoreContent<Authors>[];
  next?: { path: string; title: string };
  prev?: { path: string; title: string };
  children: ReactNode;
}

export default function PostLayout({
  content,
  authorDetails,
  next,
  prev,
  children,
}: LayoutProps) {
  const { filePath, path, slug, date, title, tags } = content;
  const basePath = path.split('/')[0];

  const authorRef = useRef<HTMLDListElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useAnime({
    targets: authorRef,
    ...fadeInLeft(180, 'medium'),
  });

  useAnime({
    targets: contentRef,
    ...fadeInUp(260, 'strong'),
  });

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      <article>
        <div className="xl:divide-y xl:divide-gray-200/60 xl:dark:divide-gray-800/60">
          <header className="pt-8 xl:pb-8">
            <div className="mx-auto max-w-3xl space-y-3 text-center">
              <div>
                <time
                  dateTime={date}
                  className="text-sm text-gray-400 dark:text-gray-500"
                >
                  {new Date(date).toLocaleDateString(
                    siteMetadata.locale,
                    postDateTemplate,
                  )}
                </time>
              </div>
              <div>
                <PageTitle>{title}</PageTitle>
              </div>
              {tags && (
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {tags.map((tag) => (
                    <Tag key={tag} text={tag} />
                  ))}
                </div>
              )}
            </div>
          </header>
          <div className="grid-rows-[auto_1fr] divide-y divide-gray-200/60 pb-8 xl:grid xl:grid-cols-4 xl:gap-x-8 xl:divide-y-0 dark:divide-gray-800/60">
            <dl
              ref={authorRef}
              className="pt-6 pb-10 xl:border-b xl:border-gray-200/60 xl:pt-11 xl:dark:border-gray-800/60"
              style={{ opacity: 0 }}
            >
              <dt className="sr-only">Authors</dt>
              <dd>
                <ul className="flex flex-wrap justify-center gap-4 sm:space-x-12 xl:block xl:space-y-8 xl:space-x-0">
                  {authorDetails.map((author) => (
                    <li
                      className="flex items-center space-x-3"
                      key={author.name}
                    >
                      {author.avatar && (
                        <Image
                          src={author.avatar}
                          width={40}
                          height={40}
                          alt="avatar"
                          className="h-10 w-10 rounded-full"
                        />
                      )}
                      <dl className="text-sm leading-5 whitespace-nowrap">
                        <dt className="sr-only">Name</dt>
                        <dd className="font-medium text-gray-700 dark:text-gray-200">
                          {author.name}
                        </dd>
                        <dt className="sr-only">Twitter</dt>
                        <dd>
                          {author.twitter && (
                            <Link
                              href={author.twitter}
                              className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-400 transition-colors duration-200 dark:text-gray-500"
                            >
                              {author.twitter
                                .replace('https://twitter.com/', '@')
                                .replace('https://x.com/', '@')}
                            </Link>
                          )}
                        </dd>
                      </dl>
                    </li>
                  ))}
                </ul>
              </dd>
            </dl>
            <div className="divide-y divide-gray-200/60 xl:col-span-3 xl:row-span-2 xl:pb-0 dark:divide-gray-800/60">
              <div
                ref={contentRef}
                className="prose prose-gray dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-p:leading-relaxed max-w-none pt-10 pb-8"
                style={{ opacity: 0 }}
              >
                {children}
              </div>
              {/* 文章内容后的广告位 */}
              <div className="py-6">
                <AdSense
                  adSlot={adsenseConfig.adSlots.postContent}
                  adFormat="auto"
                  className="text-center"
                  adStyle={{ minHeight: '250px' }}
                />
              </div>
              <div className="pt-6 pb-6 text-sm text-gray-400 dark:text-gray-500">
                <Link
                  href={discussUrl(path)}
                  rel="nofollow"
                  className="transition-colors duration-200 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Discuss on Twitter
                </Link>
                {` · `}
                <Link
                  href={editUrl(filePath)}
                  className="transition-colors duration-200 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  View on GitHub
                </Link>
              </div>
              {siteMetadata.comments && (
                <div
                  className="pt-6 pb-6 text-center text-gray-700 dark:text-gray-300"
                  id="comment"
                >
                  <Comments slug={slug} />
                </div>
              )}
            </div>
            <footer>
              <div className="divide-gray-200/60 text-sm leading-5 xl:col-start-1 xl:row-start-2 xl:divide-y dark:divide-gray-800/60">
                {(next || prev) && (
                  <div className="flex justify-between py-4 xl:block xl:space-y-6 xl:py-8">
                    {prev && prev.path && (
                      <div>
                        <h2 className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                          Previous
                        </h2>
                        <div className="hover:text-primary-600 dark:hover:text-primary-400 font-medium text-gray-700 transition-colors duration-200 dark:text-gray-300">
                          <Link href={`/${prev.path}`}>{prev.title}</Link>
                        </div>
                      </div>
                    )}
                    {next && next.path && (
                      <div>
                        <h2 className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                          Next
                        </h2>
                        <div className="hover:text-primary-600 dark:hover:text-primary-400 font-medium text-gray-700 transition-colors duration-200 dark:text-gray-300">
                          <Link href={`/${next.path}`}>{next.title}</Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="pt-4 xl:pt-8">
                <Link
                  href={`/${basePath}`}
                  className="hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center text-sm text-gray-500 transition-colors duration-200 dark:text-gray-400"
                  aria-label="Back to the blog"
                >
                  <svg
                    className="mr-1.5 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16l-4-4m0 0l4-4m-4 4h18"
                    />
                  </svg>
                  Back to blog
                </Link>
              </div>
              {/* 侧边栏广告位 */}
              <div className="pt-6 xl:pt-8">
                <AdSense
                  adSlot={adsenseConfig.adSlots.sidebar}
                  adFormat="vertical"
                  className="text-center"
                  adStyle={{ minHeight: '300px', width: '100%' }}
                />
              </div>
            </footer>
          </div>
        </div>
      </article>
    </SectionContainer>
  );
}
