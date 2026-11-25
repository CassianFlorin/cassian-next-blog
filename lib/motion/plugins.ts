'use client';

import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import { gsap } from './gsap';

/**
 * Plugins that only serve content below the fold, loaded on demand so they
 * stay out of every page's first-load JS. Each loads once and registers
 * itself; later callers get the same promise.
 */

let scrollTrigger: Promise<typeof ScrollTriggerType> | null = null;
export function loadScrollTrigger() {
  scrollTrigger ??= import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
    gsap.registerPlugin(ScrollTrigger);
    return ScrollTrigger;
  });
  return scrollTrigger;
}

let drawSVG: Promise<void> | null = null;
export function loadDrawSVG() {
  drawSVG ??= import('gsap/DrawSVGPlugin').then(({ DrawSVGPlugin }) => {
    gsap.registerPlugin(DrawSVGPlugin);
  });
  return drawSVG;
}

/**
 * Run `setup` inside a useGSAP context once `ready` resolves, so animations
 * created after an async plugin load are still reverted on unmount. Returns
 * the cleanup to hand back to useGSAP; it also cancels a setup that hasn't
 * run yet.
 */
export function whenReady(
  ready: Promise<unknown>,
  context: gsap.Context,
  setup: () => void,
) {
  let alive = true;
  void ready.then(() => {
    if (alive) context.add(setup);
  });
  return () => {
    alive = false;
  };
}
