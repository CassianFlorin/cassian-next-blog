'use client';

import { useRef } from 'react';
import Link from '@/components/Link';
import { useAnime } from '@/lib/hooks/useAnime';
import { fadeInUp, popIn } from '@/lib/animations/fadeIn';

export default function NotFound() {
  const numberRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useAnime({
    targets: numberRef,
    ...popIn(0),
  });

  useAnime({
    targets: contentRef,
    ...fadeInUp(260, 'medium'),
  });

  return (
    <div className="flex flex-col items-start justify-start md:mt-24 md:flex-row md:items-center md:justify-center md:space-x-6">
      <div className="space-x-2 pt-6 pb-8 md:space-y-5">
        <h1
          ref={numberRef}
          className="text-6xl leading-9 font-extrabold tracking-tight text-gray-900 md:border-r-2 md:px-6 md:text-8xl md:leading-14 dark:text-gray-100"
          style={{ opacity: 0 }}
        >
          404
        </h1>
      </div>
      <div ref={contentRef} className="max-w-md" style={{ opacity: 0 }}>
        <p className="mb-4 text-xl leading-normal font-bold md:text-2xl">
          Sorry we couldn't find this page.
        </p>
        <p className="mb-8">
          But dont worry, you can find plenty of other things on our homepage.
        </p>
        <Link
          href="/"
          className="focus:shadow-outline-blue inline rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm leading-5 font-medium text-white shadow-xs transition-all duration-200 hover:scale-105 hover:bg-blue-700 focus:outline-hidden dark:hover:bg-blue-500"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
