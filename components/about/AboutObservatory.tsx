'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultLocale, isLocale } from '@/lib/i18nRouting';
import type { AboutSceneData } from '@/lib/aboutScene';
import type { AboutHandle } from './aboutEngine';

/**
 * The About observatory: a sticky 3D view beside the profile. Each section
 * of the profile (by its h2, in order) has a viewpoint; reading moves the
 * view, and the caption says what you are looking at. Viewpoints can also be
 * chosen directly. Without WebGL the stations and captions still render, as a
 * short guide to the page.
 */

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

export interface ObservatoryStation {
  name: string;
  caption: string;
}

export default function AboutObservatory({
  data,
  stations,
  label,
  hint,
  hintTouch,
  profileId,
}: {
  data: AboutSceneData;
  stations: ObservatoryStation[];
  label: string;
  hint: string;
  /** Hint for touch screens, where there is no hover and no drag. */
  hintTouch: string;
  /** Element id of the profile whose h2 headings drive the stations. */
  profileId: string;
}) {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const localize = useCallback((href: string) => `/${locale}${href}`, [locale]);
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<AboutHandle | null>(null);
  const [webgl, setWebgl] = useState(true);
  const [ready, setReady] = useState(false);
  const [station, setStation] = useState(0);
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setTouch(window.matchMedia('(pointer: coarse)').matches);
  }, []);
  const stationRef = useRef(0);
  const openRef = useRef<(href: string) => void>(() => {});
  openRef.current = (href) => router.push(localize(href));

  const go = useCallback((index: number) => {
    stationRef.current = index;
    setStation(index);
    handleRef.current?.setStation(index);
  }, []);

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
    void import('./aboutEngine').then(({ mountAbout }) => {
      if (disposed) return;
      handleRef.current = mountAbout(
        host,
        data,
        {
          onReady: () => setReady(true),
          onOpen: (href) => openRef.current(href),
        },
        { reducedMotion, labelLayer, localize, station: stationRef.current },
      );
    });
    return () => {
      disposed = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [data, localize]);

  // Reading drives the view: the last profile heading above the middle of
  // the viewport picks the station.
  useEffect(() => {
    const profile = document.getElementById(profileId);
    if (!profile) return;
    const headings = Array.from(profile.querySelectorAll('h2'));
    if (!headings.length) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.45;
      let index = 0;
      headings.forEach((heading, i) => {
        if (heading.getBoundingClientRect().top < line) index = i;
      });
      const next = Math.min(index, stations.length - 1);
      if (next !== stationRef.current) go(next);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [profileId, stations.length, go]);

  const pad = (value: number) => String(value).padStart(2, '0');

  return (
    <figure aria-label={label} className="about-observatory">
      <div
        role="tablist"
        aria-label={label}
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
      >
        {stations.map((item, i) => (
          <button
            key={item.name}
            type="button"
            role="tab"
            aria-selected={station === i}
            onClick={() => go(i)}
            className="universe-chip shrink-0"
          >
            {pad(i + 1)} {item.name}
          </button>
        ))}
      </div>

      {webgl ? (
        <div
          className="work-stage relative mt-3 h-[58svh] min-h-[360px] overflow-hidden lg:h-[calc(100svh-15rem)] lg:max-h-[46rem]"
          data-ready={ready ? 'true' : 'false'}
        >
          <div ref={hostRef} className="absolute inset-0" />
          <div
            ref={labelRef}
            className="pointer-events-none absolute inset-0 overflow-hidden"
          />
        </div>
      ) : null}

      <figcaption
        aria-live="polite"
        className="border-primary-600 dark:border-primary-400 mt-3 border-l-2 pl-4"
      >
        <span className="type-meta block text-gray-500 dark:text-gray-400">
          {pad(station + 1)} / {pad(stations.length)} ·{' '}
          {stations[station]?.name}
        </span>
        <span className="mt-1 block leading-7 text-gray-700 dark:text-gray-300">
          {stations[station]?.caption}
        </span>
        {webgl ? (
          <span className="type-meta mt-2 block text-gray-500 dark:text-gray-400">
            {touch ? hintTouch : hint}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
