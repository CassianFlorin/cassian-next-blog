import { animate, AnimationParams } from 'animejs';
import { ANIMATION_EASING } from './fadeIn';

export function createScrollAnimation(
  selector: string,
  animationParams: Partial<AnimationParams>,
  threshold: number = 0.1,
) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      el.style.opacity = '1';
      el.style.removeProperty('transform');
    });
    return null;
  }

  const elements = document.querySelectorAll(selector);
  const animatedElements = new Set<Element>();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animatedElements.has(entry.target)) {
          animatedElements.add(entry.target);
          animate(entry.target, animationParams as AnimationParams);
        }
      });
    },
    { threshold },
  );

  elements.forEach((el) => observer.observe(el));

  return observer;
}

export function smoothScrollTo(
  target: number | HTMLElement,
  duration: number = 600,
) {
  const targetPosition = typeof target === 'number' ? target : target.offsetTop;

  animate(document.documentElement, {
    scrollTop: targetPosition,
    duration,
    easing: ANIMATION_EASING.gentle,
  } as AnimationParams);
}
