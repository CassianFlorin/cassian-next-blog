'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { loadScrollTrigger, whenReady } from '@/lib/motion/plugins';

/**
 * A hairline across the top of the viewport that fills as the article body
 * (element `targetId`) is read: information, not decoration, so it also runs
 * under reduced motion — just without the easing lag.
 */
export default function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(
    (context) => {
      const target = document.getElementById(targetId);
      const el = bar.current;
      if (!target || !el) return;
      const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      // ScrollTrigger loads on demand; the bar is empty until then.
      return whenReady(loadScrollTrigger(), context, () => {
        gsap.fromTo(
          el,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: target,
              start: 'top 20%',
              end: 'bottom bottom',
              scrub: reduced ? true : 0.3,
            },
          },
        );
      });
    },
    { scope: bar, dependencies: [targetId] },
  );

  return (
    <div
      ref={bar}
      aria-hidden="true"
      className="bg-primary-600 dark:bg-primary-400 pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left scale-x-0"
    />
  );
}
