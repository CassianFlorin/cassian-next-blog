import { animate, stagger, AnimationParams, TargetsParam } from 'animejs';
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  AnimationIntensity,
} from './fadeIn';

type StaggerOptions = Partial<AnimationParams> & {
  intensity?: AnimationIntensity;
  startDelay?: number;
};

const resolveResponsiveStagger = (intensity: AnimationIntensity) => {
  const isMobile =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 767px)').matches;

  const desktop = {
    light: {
      duration: ANIMATION_DURATION.fast,
      staggerDelay: 45,
      translate: 20,
    },
    medium: {
      duration: ANIMATION_DURATION.normal,
      staggerDelay: 65,
      translate: 28,
    },
    strong: {
      duration: ANIMATION_DURATION.slow,
      staggerDelay: 85,
      translate: 38,
    },
  } as const;

  const mobile = {
    light: { duration: 320, staggerDelay: 28, translate: 14 },
    medium: { duration: 420, staggerDelay: 40, translate: 20 },
    strong: { duration: 520, staggerDelay: 52, translate: 28 },
  } as const;

  return (isMobile ? mobile : desktop)[intensity];
};

export const staggerFadeInUp = (
  targets: TargetsParam,
  options: StaggerOptions = {},
) => {
  const { intensity = 'medium', startDelay = 0, ...animationOptions } = options;
  const { duration, staggerDelay, translate } =
    resolveResponsiveStagger(intensity);

  return animate(targets, {
    opacity: [0, 1],
    translateY: [translate, 0],
    easing: ANIMATION_EASING.expressive,
    duration,
    delay: stagger(staggerDelay, { start: startDelay }),
    ...animationOptions,
  } as AnimationParams);
};

export const staggerFadeIn = (
  targets: TargetsParam,
  options: StaggerOptions = {},
) => {
  const { intensity = 'medium', startDelay = 0, ...animationOptions } = options;
  const { duration, staggerDelay } = resolveResponsiveStagger(intensity);

  return animate(targets, {
    opacity: [0, 1],
    easing: ANIMATION_EASING.gentle,
    duration: Math.max(300, duration - 120),
    delay: stagger(Math.max(24, staggerDelay - 10), { start: startDelay }),
    ...animationOptions,
  } as AnimationParams);
};
