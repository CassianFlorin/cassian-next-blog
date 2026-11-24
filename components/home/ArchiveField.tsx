'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { defaultLocale, isLocale } from '@/lib/i18nRouting';
import type { ArchiveCard, ArchiveSceneData } from '@/lib/archiveScene';

/**
 * The homepage backdrop: the whole archive as a world you enter — a core,
 * and a galaxy whose arms are the knowledge territories, one star per
 * article. Fixed behind every chapter; scrolling moves the camera.
 * three.js loads as soon as the hero mounts (never blocking it); the page opens on
 * the plain ground and the galaxy gathers out of it. Only without WebGL does
 * the portrait backdrop appear instead.
 */

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

export interface ArchiveFieldLabels {
  archive: string;
  entries: string;
  territories: string;
  hint: string;
}

export default function ArchiveField({
  scene,
  labels,
}: {
  scene: ArchiveSceneData;
  labels: ArchiveFieldLabels;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<ArchiveCard | null>(null);
  const [fallback, setFallback] = useState(false);
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const openRef = useRef<(card: ArchiveCard) => void>(() => {});
  openRef.current = (card) => router.push(`/${locale}${card.href}`);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!supportsWebGL()) {
      setFallback(true);
      return;
    }

    let disposed = false;
    let unmount: (() => void) | undefined;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const start = async () => {
      const { mountArchive } = await import('./archiveEngine');
      if (disposed) return;
      unmount = mountArchive(
        host,
        scene,
        {
          onReady: () => setReady(true),
          onHover: setHovered,
          onOpen: (card) => openRef.current(card),
        },
        { reducedMotion, label: labelRef.current },
      );
    };

    // Start at once: the module request goes out on mount, in parallel
    // with the hero text animating in, instead of waiting for idle time.
    void start();

    return () => {
      disposed = true;
      unmount?.();
    };
  }, [scene]);

  const pad = (value: number) => String(value).padStart(2, '0');

  if (fallback) {
    // No WebGL: the hero keeps its portrait atmosphere, dissolved on the right.
    return (
      <div
        aria-hidden="true"
        className="hero-backdrop hero-mask absolute inset-x-0 top-0 -z-10 h-svh lg:left-[34%]"
      >
        <div className="hero-backdrop-drift absolute inset-0">
          <Image
            src="/static/images/avatar.png"
            alt=""
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="object-cover object-[50%_58%]"
          />
        </div>
        <div className="dark:bg-night/72 lg:dark:bg-night/58 absolute inset-0 bg-gray-50/75 lg:bg-gray-50/45" />
        <div className="dark:to-night absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-gray-50" />
      </div>
    );
  }

  return (
    <div
      className="hero-field fixed inset-0 -z-10"
      data-ready={ready ? 'true' : 'false'}
    >
      <div ref={hostRef} className="hero-field-canvas absolute inset-0" />
      {/* Fixed behind the whole homepage. Small screens: the galaxy sits
          under the text, so wash it back. */}
      <div className="dark:bg-night/60 absolute inset-0 bg-gray-50/60 md:hidden" />

      {/* Title that follows the hovered star; the engine moves it. */}
      <div
        ref={labelRef}
        aria-hidden="true"
        className="hero-field-label pointer-events-none absolute top-0 left-0 hidden w-72 opacity-0 lg:block"
      >
        {hovered ? (
          <div className="border-primary-600 dark:border-primary-400 border-l-2 pl-3">
            <p className="type-meta text-primary-700 dark:text-primary-400">
              {hovered.date.replaceAll('-', '.')} · {hovered.territoryLabel}
            </p>
            <p className="type-editorial mt-1 text-xl leading-snug text-gray-950 dark:text-gray-50">
              {hovered.title}
            </p>
            <p className="type-meta mt-2 text-gray-600 dark:text-gray-400">
              {labels.hint} →
            </p>
          </div>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden lg:block"
        style={{ opacity: 'var(--hero-presence, 1)' }}
      >
        <div className="container-atelier flex justify-end pb-10">
          <div className="w-72 border-t border-gray-900/20 pt-3 dark:border-white/20">
            <p className="type-meta text-gray-600 dark:text-gray-400">
              {labels.archive}
            </p>
            <p className="type-meta mt-2 text-gray-800 dark:text-gray-200">
              {pad(scene.cards.length)} {labels.entries} ·{' '}
              {pad(scene.territories.length)} {labels.territories}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
