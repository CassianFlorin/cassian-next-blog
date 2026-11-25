'use client';

import { ReactNode, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { DURATION, gsap, motionQuery, useGSAP } from '@/lib/motion/gsap';

interface Props {
  children: ReactNode;
}

/** The section of the site a path belongs to: /zh/blog/x → "blog". */
const groupOf = (path: string | null) => {
  if (!path) return '';
  return path.split('/').filter(Boolean)[1] || '';
};

/**
 * A quiet settle on client-side navigation. First paint belongs to the page
 * itself (the hero and page titles stage their own entrances), and moving
 * between two articles or two tag pages stays still, so reading isn't
 * interrupted. Under reduced motion nothing moves.
 */
export default function RouteTransitionOrchestrator({ children }: Props) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const previousPathRef = useRef<string | null>(null);

  useGSAP(
    () => {
      const previous = previousPathRef.current;
      previousPathRef.current = pathname;
      if (previous === null) return;

      const group = groupOf(pathname);
      if (
        group === groupOf(previous) &&
        (group === 'tags' || group === 'blog')
      ) {
        return;
      }

      gsap.matchMedia().add(motionQuery, () => {
        const sections = rootRef.current?.querySelectorAll(
          '[data-route-section="main"]',
        );
        if (!sections?.length) return;
        gsap.fromTo(
          sections,
          { autoAlpha: 0.6, y: 8 },
          { autoAlpha: 1, y: 0, duration: DURATION.normal, clearProps: 'all' },
        );
      });
    },
    { scope: rootRef, dependencies: [pathname], revertOnUpdate: true },
  );

  return <div ref={rootRef}>{children}</div>;
}
