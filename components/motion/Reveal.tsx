'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';

/**
 * Scroll reveal with a per-section grammar instead of one fade for everything:
 * - `rise`: the whole block settles upward (Writing)
 * - `drift`: direct children slide in horizontally, staggered (Work)
 * - `graph`: `.graph-node` / `.graph-edge` descendants appear in sequence
 *   (Knowledge)
 *
 * Server HTML is fully visible. The element is only hidden ("armed") after
 * hydration and only if it is still below the fold, so there is no flash, no
 * hidden content without JS, and nothing hidden under reduced motion.
 */
interface Props {
  variant: 'rise' | 'drift' | 'graph';
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export default function Reveal({
  variant,
  as: Tag = 'div',
  className,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      el.classList.add('is-visible');
      return;
    }

    if (variant === 'drift') {
      Array.from(el.children).forEach((child, index) => {
        (child as HTMLElement).style.setProperty('--reveal-index', `${index}`);
      });
    }

    el.classList.add('is-armed');
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        el.classList.remove('is-armed');
        el.classList.add('is-visible');
        observer.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [variant]);

  return (
    <Tag ref={ref} data-reveal={variant} className={className}>
      {children}
    </Tag>
  );
}
