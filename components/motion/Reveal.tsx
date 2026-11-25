'use client';

import { useRef, type ElementType, type ReactNode } from 'react';
import { DURATION, gsap, motionQuery, useGSAP } from '@/lib/motion/gsap';
import {
  loadDrawSVG,
  loadScrollTrigger,
  whenReady,
} from '@/lib/motion/plugins';

/**
 * Scroll reveal with a per-section grammar instead of one fade for everything,
 * played once by ScrollTrigger:
 * - `rise`: the whole block settles upward (Writing)
 * - `drift`: direct children slide in from the left, staggered (Work)
 * - `graph`: `.graph-edge` lines draw themselves, then `.graph-node` groups
 *   grow in, both in `--reveal-index` order (Knowledge)
 *
 * Server HTML is fully visible. Blocks already on screen are left alone (no
 * flash on hydration); only what is still below the fold waits for the
 * reader. ScrollTrigger (and DrawSVG for graphs) load on demand. Under
 * reduced motion nothing is touched.
 */
interface Props {
  variant: 'rise' | 'drift' | 'graph';
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

const order = (el: Element) =>
  Number.parseFloat(
    (el as HTMLElement).style.getPropertyValue('--reveal-index') || '0',
  );
const byOrder = (els: Element[]) =>
  [...els].sort((a, b) => order(a) - order(b));

const onScreen = (el: Element) =>
  el.getBoundingClientRect().top < window.innerHeight * 0.9;

export default function Reveal({
  variant,
  as: Tag = 'div',
  className,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    (context) => {
      const el = ref.current;
      if (!el || onScreen(el)) return;
      if (!window.matchMedia(motionQuery).matches) return;

      const ready = Promise.all([
        loadScrollTrigger(),
        variant === 'graph' ? loadDrawSVG() : null,
      ]);

      return whenReady(ready, context, () => {
        // The reader may have scrolled here while the plugin loaded.
        if (onScreen(el)) return;
        const mm = gsap.matchMedia();
        mm.add(motionQuery, () => {
          const scrollTrigger = { trigger: el, start: 'top 85%', once: true };

          if (variant === 'rise') {
            gsap.from(el, {
              autoAlpha: 0,
              y: 28,
              duration: DURATION.slow,
              scrollTrigger,
            });
            return;
          }

          if (variant === 'drift') {
            gsap.from(el.children, {
              autoAlpha: 0,
              x: -24,
              duration: DURATION.slow,
              stagger: 0.09,
              scrollTrigger,
            });
            return;
          }

          const q = gsap.utils.selector(el);
          gsap
            .timeline({ scrollTrigger })
            .from(byOrder(q('.graph-edge')), {
              drawSVG: 0,
              duration: 0.8,
              stagger: 0.05,
            })
            .from(
              byOrder(q('.graph-node')),
              {
                autoAlpha: 0,
                scale: 0.6,
                transformOrigin: '50% 50%',
                duration: 0.6,
                stagger: 0.07,
              },
              0.15,
            );
        });
      });
    },
    { scope: ref, dependencies: [variant] },
  );

  return (
    <Tag ref={ref} data-reveal={variant} className={className}>
      {children}
    </Tag>
  );
}
