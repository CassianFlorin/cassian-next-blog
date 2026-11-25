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
import Tldr from '@/components/Tldr';
import { gsap, motionQuery, useGSAP } from '@/lib/motion/gsap';

interface LayoutProps {
  content: CoreContent<Blog>;
  children: ReactNode;
  next?: { path: string; title: string };
  prev?: { path: string; title: string };
  /** Accepted for layout interchangeability; this layout does not show them. */
  knowledgeGraph?: unknown;
  relations?: unknown;
  authorDetails?: unknown;
}

export default function PostMinimal({
  content,
  next,
  prev,
  children,
}: LayoutProps) {
  const { slug, title, images, tldr } = content;
  const displayImage =
    images && images.length > 0
      ? images[0]
      : 'https://picsum.photos/seed/picsum/800/400';

  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Content is visible as rendered; GSAP only adds the entrance on top.
  useGSAP(() => {
    gsap.matchMedia().add(motionQuery, () => {
      gsap.from(imageRef.current, { autoAlpha: 0, scale: 0.96 });
      gsap.from(contentRef.current, { autoAlpha: 0, y: 24, delay: 0.28 });
    });
  });

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      <article>
        <div>
          <div className="space-y-1 pb-10 text-center dark:border-gray-700">
            <div ref={imageRef} className="w-full">
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
          >
            <Tldr>{tldr}</Tldr>
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
