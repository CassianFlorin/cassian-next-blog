'use client';

import { useEffect, useState } from 'react';

interface Chapter {
  id: string;
  label: string;
}

/**
 * Sticky chapter index for a case study. The chapter nearest the top of the
 * viewport is marked current, so long pages keep their bearings.
 */
export default function CaseStudyContents({
  title,
  chapters,
}: {
  title: string;
  chapters: Chapter[];
}) {
  const [current, setCurrent] = useState(chapters[0]?.id);

  useEffect(() => {
    const sections = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setCurrent(visible[0].target.id);
      },
      { rootMargin: '0px 0px -65% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [chapters]);

  return (
    <nav aria-label={title} className="lg:sticky lg:top-8">
      <p className="type-meta text-gray-500 dark:text-gray-400">{title}</p>
      <ol className="mt-4 grid gap-1">
        {chapters.map((chapter, index) => {
          const active = chapter.id === current;
          return (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                aria-current={active ? 'location' : undefined}
                className={`type-meta flex items-center gap-3 py-1.5 transition-colors duration-200 ${
                  active
                    ? 'text-gray-950 dark:text-gray-50'
                    : 'text-gray-400 hover:text-gray-950 dark:text-gray-500 dark:hover:text-gray-50'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`ease-atelier h-px transition-[width] duration-300 ${
                    active
                      ? 'w-6 bg-gray-950 dark:bg-gray-50'
                      : 'w-3 bg-gray-400 dark:bg-gray-600'
                  }`}
                />
                {String(index + 1).padStart(2, '0')} {chapter.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
