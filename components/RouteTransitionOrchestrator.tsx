'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { animate, JSAnimation } from 'animejs';
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/lib/animations/fadeIn';

interface Props {
  children: ReactNode;
}

const revealSections = (root: HTMLElement) => {
  root
    .querySelectorAll<HTMLElement>('[data-route-section]')
    .forEach((section) => {
      section.style.opacity = '1';
      section.style.removeProperty('transform');
    });
};

export default function RouteTransitionOrchestrator({ children }: Props) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<JSAnimation | null>(null);
  const initialRenderRef = useRef(true);
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reducedMotion) {
      revealSections(rootRef.current);
      return;
    }

    const isInitialRender = initialRenderRef.current;
    const previousPath = previousPathRef.current;

    const normalizeGroup = (path: string | null) => {
      if (!path) return '';
      const segments = path.split('/').filter(Boolean);
      return segments[1] || '';
    };

    const currentGroup = normalizeGroup(pathname);
    const previousGroup = normalizeGroup(previousPath);
    const shouldSkipRouteAnimation =
      !isInitialRender &&
      previousGroup === currentGroup &&
      (currentGroup === 'tags' || currentGroup === 'blog');

    if (shouldSkipRouteAnimation) {
      revealSections(rootRef.current);
      previousPathRef.current = pathname;
      return;
    }
    // First paint belongs to the page itself (the homepage hero stages its
    // own slow reveal); only client-side navigations get a quiet settle.
    if (isInitialRender) {
      initialRenderRef.current = false;
      previousPathRef.current = pathname;
      return;
    }

    const sections = rootRef.current.querySelectorAll<HTMLElement>(
      '[data-route-section="main"]',
    );
    if (!sections.length) return;

    animationRef.current?.pause();
    animationRef.current = animate(sections, {
      opacity: [0.6, 1],
      translateY: [8, 0],
      ease: ANIMATION_EASING.expressive,
      duration: ANIMATION_DURATION.normal,
    });
    initialRenderRef.current = false;
    previousPathRef.current = pathname;

    return () => {
      animationRef.current?.pause();
    };
  }, [pathname]);

  return <div ref={rootRef}>{children}</div>;
}
