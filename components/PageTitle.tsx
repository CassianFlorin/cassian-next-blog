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
      className="text-2xl leading-tight font-bold tracking-tight text-gray-800 sm:text-3xl md:text-4xl dark:text-gray-100"
      style={{ opacity: 0 }}
    >
      {children}
    </h1>
  );
}
