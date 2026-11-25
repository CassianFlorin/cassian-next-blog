'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultLocale, isLocale } from '@/lib/i18nRouting';
import type { ArticleSceneData } from '@/lib/articleScene';
import type { ArticleHandle } from './articleEngine';

/**
 * The article's header scene, behind the title on wide screens: its sections
 * on an orbit, its nearest writing around it, its territories above. Purely
 * an enhancement: everything it shows is also in the page as text, so without
 * WebGL it renders nothing.
 */

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

export default function ArticleOrbit({
  data,
  className,
  label,
  stats,
}: {
  data: ArticleSceneData;
  /** Must include a positioning class (relative / absolute). */
  className: string;
  label: string;
  stats: string;
}) {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const localize = useCallback((href: string) => `/${locale}${href}`, [locale]);
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<ArticleHandle | null>(null);
  const [webgl, setWebgl] = useState(true);
  const [ready, setReady] = useState(false);
  const openRef = useRef<(href: string) => void>(() => {});
  openRef.current = (href) => router.push(localize(href));

  useEffect(() => {
    const host = hostRef.current;
    const labelLayer = labelRef.current;
    if (!host || !labelLayer) return;
    // Wide screens only: on narrow ones the header goes straight to reading.
    if (!window.matchMedia('(min-width: 64rem)').matches) return;
    if (!supportsWebGL()) {
      setWebgl(false);
      return;
    }
    let disposed = false;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    void import('./articleEngine').then(({ mountArticle }) => {
      if (disposed) return;
      handleRef.current = mountArticle(
        host,
        data,
        {
          onReady: () => setReady(true),
          onOpen: (href) => openRef.current(href),
        },
        { reducedMotion, labelLayer, localize },
      );
    });
    return () => {
      disposed = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [data, localize]);

  if (!webgl) return null;

  return (
    <div
      aria-hidden="true"
      className={`article-stage overflow-hidden ${className}`}
      data-ready={ready ? 'true' : 'false'}
    >
      <div ref={hostRef} className="absolute inset-0" />
      <div
        ref={labelRef}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        {/* Under the title column, clear of the scene on the right. */}
        <div className="container-atelier pb-8">
          <div className="ml-[13rem] w-96 border-t border-gray-900/20 pt-3 dark:border-white/20">
            <p className="type-meta text-gray-600 dark:text-gray-400">
              {label}
            </p>
            <p className="type-meta mt-2 text-gray-800 dark:text-gray-200">
              {stats}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
