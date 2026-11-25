'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultLocale, isLocale } from '@/lib/i18nRouting';
import type { WorkSceneData } from '@/lib/workScene';
import type { WorkHandle } from './workEngine';

/**
 * The work orbit in a page. On /projects it is a stage above the list; on a
 * case study it sits behind the header, showing that one project with its
 * stack and territories. Without WebGL it renders nothing: the text around it
 * already carries everything.
 */

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

export default function WorkOrbit({
  data,
  mode,
  projectId,
  /** Must include a positioning class (relative / absolute). */
  className = 'relative',
  hint,
}: {
  data: WorkSceneData;
  mode: 'index' | 'detail';
  projectId?: string;
  className?: string;
  hint?: string;
}) {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const localize = useCallback((href: string) => `/${locale}${href}`, [locale]);
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<WorkHandle | null>(null);
  const [webgl, setWebgl] = useState(true);
  const [ready, setReady] = useState(false);
  const openRef = useRef<(href: string) => void>(() => {});
  openRef.current = (href) => router.push(localize(href));

  useEffect(() => {
    const host = hostRef.current;
    const labelLayer = labelRef.current;
    if (!host || !labelLayer) return;
    if (!supportsWebGL()) {
      setWebgl(false);
      return;
    }
    let disposed = false;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    void import('./workEngine').then(({ mountWork }) => {
      if (disposed) return;
      handleRef.current = mountWork(
        host,
        data,
        {
          onReady: () => setReady(true),
          onHover: () => {},
          onOpen: (href) => openRef.current(href),
        },
        { reducedMotion, mode, projectId, labelLayer, localize },
      );
    });
    return () => {
      disposed = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [data, mode, projectId, localize]);

  if (!webgl) return null;

  return (
    <div
      className={`work-stage overflow-hidden ${className}`}
      data-ready={ready ? 'true' : 'false'}
    >
      <div ref={hostRef} className="absolute inset-0" />
      <div
        ref={labelRef}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      />
      {hint ? (
        <p className="type-meta pointer-events-none absolute inset-x-0 bottom-0">
          <span className="container-atelier block pb-5 text-gray-600 dark:text-gray-400">
            {hint}
          </span>
        </p>
      ) : null}
    </div>
  );
}
