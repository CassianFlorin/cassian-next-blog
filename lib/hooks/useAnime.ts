import { RefObject, useEffect, useRef } from 'react';
import { animate, JSAnimation, AnimationParams, TargetsParam } from 'animejs';
import { ANIMATION_DURATION, ANIMATION_EASING } from '../animations/fadeIn';

type KnownKeys<T> = {
  [K in keyof T]: string extends K
    ? never
    : number extends K
      ? never
      : symbol extends K
        ? never
        : K;
}[keyof T];

type SafeAnimationParams = Partial<
  Pick<AnimationParams, KnownKeys<AnimationParams>>
>;

type AnimateParams = {
  targets:
    | TargetsParam
    | RefObject<HTMLElement | null>
    | (() => TargetsParam | RefObject<HTMLElement | null> | null);
  [key: string]: unknown;
} & Omit<SafeAnimationParams, 'targets'>;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const resolveTargets = (
  targetOrResolver: AnimateParams['targets'],
): TargetsParam | null => {
  const rawTarget =
    typeof targetOrResolver === 'function'
      ? targetOrResolver()
      : targetOrResolver;

  if (!rawTarget) return null;
  if (typeof rawTarget === 'object' && 'current' in rawTarget) {
    return rawTarget.current;
  }

  return rawTarget as TargetsParam;
};

const revealTargets = (targets: TargetsParam | null) => {
  if (!targets || typeof document === 'undefined') return;

  let elements: HTMLElement[] = [];
  if (typeof targets === 'string') {
    elements = Array.from(document.querySelectorAll<HTMLElement>(targets));
  } else if (targets instanceof Element) {
    elements = [targets as HTMLElement];
  } else if ('length' in (targets as object)) {
    elements = Array.from(targets as ArrayLike<Element>).filter(
      (node): node is HTMLElement => node instanceof HTMLElement,
    );
  }

  elements.forEach((el) => {
    el.style.opacity = '1';
    el.style.removeProperty('transform');
  });
};

export function useAnime(params: AnimateParams) {
  const animationRef = useRef<JSAnimation | null>(null);

  useEffect(() => {
    const targets = resolveTargets(params.targets);
    const { targets: _, ...animParams } = params;
    const mergedParams: Partial<AnimationParams> = {
      duration: ANIMATION_DURATION.normal,
      easing: ANIMATION_EASING.expressive,
      ...animParams,
    };

    if (prefersReducedMotion() || !targets) {
      revealTargets(targets);
      return;
    }

    animationRef.current = animate(targets, mergedParams as AnimationParams);

    return () => {
      if (animationRef.current) {
        animationRef.current.pause();
        animationRef.current = null;
      }
    };
  }, [params]);

  return animationRef;
}

export function useScrollAnimation(
  targetRef: RefObject<HTMLElement | null>,
  params: SafeAnimationParams,
  threshold: number = 0.1,
) {
  const animationRef = useRef<JSAnimation | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!targetRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      revealTargets(targetRef.current);
      return;
    }

    const mergedParams: Partial<AnimationParams> = {
      duration: ANIMATION_DURATION.normal,
      easing: ANIMATION_EASING.expressive,
      ...params,
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            animationRef.current = animate(
              entry.target,
              mergedParams as AnimationParams,
            );
          }
        });
      },
      { threshold },
    );

    observer.observe(targetRef.current);

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        animationRef.current.pause();
        animationRef.current = null;
      }
    };
  }, [targetRef, threshold, params]);

  return animationRef;
}
