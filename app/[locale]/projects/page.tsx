'use client';

import { useRef } from 'react';
import projectsData from '@/data/projectsData';
import Card from '@/components/Card';
import { useTranslations } from 'next-intl';
import { useAnime } from '@/lib/hooks/useAnime';
import { fadeInUp } from '@/lib/animations/fadeIn';

export default function Projects() {
  const t = useTranslations('projects');
  const headerRef = useRef<HTMLDivElement>(null);

  useAnime({
    targets: headerRef,
    ...fadeInUp(0, 'medium'),
  });

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          ref={headerRef}
          className="space-y-2 pt-6 pb-8 md:space-y-5"
          style={{ opacity: 0 }}
        >
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            {t('title')}
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            {t('description')}
          </p>
        </div>
        <div className="container py-12">
          <div className="-m-4 flex flex-wrap">
            {projectsData.map((d) => (
              <Card
                key={d.title}
                title={d.title}
                description={d.description}
                imgSrc={d.imgSrc}
                href={d.href}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
