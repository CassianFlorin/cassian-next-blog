'use client';

import { ReactNode, useRef } from 'react';
import Image from '@/components/Image';
import Bleed from 'pliny/ui/Bleed';
import { CoreContent } from 'pliny/utils/contentlayer';
import type { Blog } from 'contentlayer/generated';
import Comments from '@/components/Comments';
import Link from '@/components/Link';
import PageTitle from '@/components/PageTitle';
import SectionContainer from '@/components/SectionContainer';
import siteMetadata from '@/data/siteMetadata';
import ScrollTopAndComment from '@/components/ScrollTopAndComment';
import { useAnime } from '@/lib/hooks/useAnime';
import { fadeInScale, fadeInUp } from '@/lib/animations/fadeIn';

interface LayoutProps {
  content: CoreContent<Blog>;
  children: ReactNode;
  next?: { path: string; title: string };
  prev?: { path: string; title: string };
}

export default function PostMinimal({
  content,
  next,
  prev,
  children,
}: LayoutProps) {
  const { slug, title, images } = content;
  const displayImage =
    images && images.length > 0
      ? images[0]
      : 'https://picsum.photos/seed/picsum/800/400';

  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useAnime({
    targets: imageRef,
    ...fadeInScale(0, 'strong'),
  });

  useAnime({
    targets: contentRef,
    ...fadeInUp(280, 'strong'),
  });

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      <article>
        <div>
          <div className="space-y-1 pb-10 text-center dark:border-gray-700">
            <div ref={imageRef} className="w-full" style={{ opacity: 0 }}>
              <Bleed>
                <div className="relative aspect-2/1 w-full">
                  <Image
                    src={displayImage}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                </div>
              </Bleed>
            </div>
            <div className="relative pt-10">
              <PageTitle>{title}</PageTitle>
            </div>
          </div>
          <div
            ref={contentRef}
            className="prose dark:prose-invert max-w-none py-4"
            style={{ opacity: 0 }}
          >
            {children}
          </div>
          {siteMetadata.comments && (
            <div
              className="pt-6 pb-6 text-center text-gray-700 dark:text-gray-300"
              id="comment"
            >
              <Comments slug={slug} />
            </div>
          )}
          <footer>
            <div className="flex flex-col text-sm font-medium sm:flex-row sm:justify-between sm:text-base">
              {prev && prev.path && (
                <div className="pt-4 xl:pt-8">
                  <Link
                    href={`/${prev.path}`}
                    className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                    aria-label={`Previous post: ${prev.title}`}
                  >
                    &larr; {prev.title}
                  </Link>
                </div>
              )}
              {next && next.path && (
                <div className="pt-4 xl:pt-8">
                  <Link
                    href={`/${next.path}`}
                    className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                    aria-label={`Next post: ${next.title}`}
                  >
                    {next.title} &rarr;
                  </Link>
                </div>
              )}
            </div>
          </footer>
        </div>
      </article>
    </SectionContainer>
  );
}
