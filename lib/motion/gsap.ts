'use client';

import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

/**
 * The site's one motion system. Every DOM animation goes through GSAP from
 * here, and the ease and durations mirror the tokens in css/tailwind.css
 * (--ease-atelier, --motion-*), so CSS transitions and GSAP tweens move alike.
 * Ease-out only: no bounce, elastic or overshoot.
 *
 * Bundle budget: only what above-the-fold entrances need is loaded with the
 * page (core, SplitText, useGSAP). Scroll-driven plugins load on demand from
 * `lib/motion/plugins.ts` after hydration.
 *
 * Reduced motion is handled with gsap.matchMedia() at each call site (see
 * `motionQuery`): under `prefers-reduced-motion: reduce` nothing animates and
 * content is shown as rendered.
 */

gsap.registerPlugin(useGSAP, SplitText);

/**
 * cubic-bezier(x1, y1, x2, y2) as an ease function — the same curve CSS uses,
 * without shipping CustomEase. Solves x(t) = p by Newton–Raphson, falling back
 * to bisection, then returns y(t).
 */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  const solve = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const error = sampleX(t) - x;
      if (Math.abs(error) < 1e-6) return t;
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    while (hi - lo > 1e-6) {
      if (sampleX(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };

  return (p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : sampleY(solve(p)));
}

/** cubic-bezier(0.22, 1, 0.36, 1) — the same curve as --ease-atelier. */
export const EASE = cubicBezier(0.22, 1, 0.36, 1);
gsap.registerEase('atelier', EASE);

export const DURATION = {
  fast: 0.22,
  normal: 0.52,
  slow: 1,
} as const;

/** Run setup only when motion is welcome; reverts itself otherwise. */
export const motionQuery = '(prefers-reduced-motion: no-preference)';

gsap.defaults({ ease: EASE, duration: DURATION.normal });

export { gsap, SplitText, useGSAP };
