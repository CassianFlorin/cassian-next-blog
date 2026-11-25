'use client';

import { useRef, type ElementType, type ReactNode } from 'react';
import { gsap, motionQuery, SplitText, useGSAP } from '@/lib/motion/gsap';
import { loadScrollTrigger, whenReady } from '@/lib/motion/plugins';

/**
 * A title that rises line by line out of masks.
 *
 * - `on="scroll"` (default): plays once when the title scrolls into view.
 *   Below-the-fold titles are hidden by their masks before anyone sees them.
 * - `on="mount"`: plays on load, for titles at the top of a page. These carry
 *   `data-motion-hidden`, so CSS keeps them hidden from first paint (only when
 *   <html> has `motion-ok`) and a CSS failsafe reveals them if JS never runs.
 *
 * Lines are re-split when fonts load or the width changes (autoSplit), and
 * the animation is created inside onSplit so it always targets live lines.
 */
interface Props {
  as?: ElementType;
  id?: string;
  className?: string;
  on?: 'scroll' | 'mount';
  delay?: number;
  children: ReactNode;
}

export default function TextReveal({
  as: Tag = 'div',
  id,
  className,
  on = 'scroll',
  delay = 0,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    (context) => {
      const el = ref.current;
      if (!el) return;

      const reveal = (scrolled: boolean) => {
        const mm = gsap.matchMedia();
        mm.add(motionQuery, () => {
          gsap.set(el, { visibility: 'visible' });
          SplitText.create(el, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit(self) {
              return gsap.from(self.lines, {
                yPercent: 105,
                duration: 0.9,
                stagger: 0.08,
                delay,
                scrollTrigger: scrolled
                  ? { trigger: el, start: 'top 88%', once: true }
                  : undefined,
              });
            },
          });
        });
      };

      // Titles at the top of a page play at once with the page's own JS.
      if (on === 'mount') {
        reveal(false);
        return;
      }

      // Scroll titles wait for ScrollTrigger (loaded on demand) and leave
      // alone anything the reader can already see, so nothing blinks.
      const onScreen = () =>
        el.getBoundingClientRect().top < window.innerHeight * 0.88;
      if (onScreen() || !window.matchMedia(motionQuery).matches) return;
      return whenReady(loadScrollTrigger(), context, () => {
        if (!onScreen()) reveal(true);
      });
    },
    { scope: ref },
  );

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      data-motion-hidden={on === 'mount' ? '' : undefined}
    >
      {children}
    </Tag>
  );
}
