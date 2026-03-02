'use client';

import { ReactNode, useRef } from 'react';
import { useAnime } from '@/lib/hooks/useAnime';
import { fadeInUp } from '@/lib/animations/fadeIn';

interface Props {
  children: ReactNode;
}

export default function PageTitle({ children }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useAnime({
    targets: titleRef,
    ...fadeInUp(0, 'medium'),
  });

  return (
    <h1
      ref={titleRef}
      className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-5xl md:leading-14 dark:text-gray-100"
      style={{ opacity: 0 }}
    >
      {children}
    </h1>
  );
}
