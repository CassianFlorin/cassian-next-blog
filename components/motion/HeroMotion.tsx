'use client';

import { useRef, type ReactNode } from 'react';
import {
  DURATION,
  gsap,
  motionQuery,
  SplitText,
  useGSAP,
} from '@/lib/motion/gsap';

/**
 * CF / 00 entrance, as one timeline: the name rises letter by letter out of
 * masked lines, the three editorial lines slide up one after another, then
 * the meta, areas, summary and the scroll cue settle in.
 *
 * Parts are marked in HeroSection with `data-hero="…"`. They start hidden only
 * when <html> carries `motion-ok` (set before paint, see app/layout.tsx), and a
 * CSS failsafe reveals them if this never runs, so text can't stay hidden.
 */
export default function HeroMotion({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          motion: motionQuery,
          compact: '(width < 64rem)',
        },
        (context) => {
          if (!context.conditions?.motion) return;
          // Smaller screens get the same choreography at a quicker tempo.
          const tempo = context.conditions.compact ? 0.65 : 1;
          const q = gsap.utils.selector(scope);
          const tl = gsap.timeline({
            defaults: { duration: DURATION.slow * tempo },
          });

          // Hidden by CSS until now; the masks below do the hiding from here.
          tl.set(q('[data-hero]'), { visibility: 'visible' });

          const meta = q('[data-hero="meta"]');
          tl.from(meta, { autoAlpha: 0, y: 8, duration: DURATION.normal });

          const name = q('[data-hero="name"]')[0];
          if (name) {
            const split = SplitText.create(name, {
              type: 'lines,chars',
              mask: 'lines',
              aria: 'auto',
            });
            tl.from(
              split.chars,
              {
                yPercent: 110,
                duration: 0.95 * tempo,
                stagger: 0.032 * tempo,
              },
              0.08,
            );
          }

          const lines = q('[data-hero="line"]');
          if (lines.length) {
            const split = SplitText.create(lines, {
              type: 'lines',
              mask: 'lines',
            });
            tl.from(
              split.lines,
              { yPercent: 105, stagger: 0.12 * tempo },
              `-=${0.45 * tempo}`,
            );
          }

          tl.from(
            q('[data-hero="areas"] > li'),
            { autoAlpha: 0, y: 10, stagger: 0.06 * tempo },
            `-=${0.55 * tempo}`,
          )
            .from(
              q('[data-hero="summary"]'),
              { autoAlpha: 0, y: 10 },
              `-=${0.7 * tempo}`,
            )
            .from(
              q('[data-hero="cue"]'),
              { autoAlpha: 0, y: -6, duration: DURATION.normal },
              `-=${0.5 * tempo}`,
            );
        },
      );
    },
    { scope },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
