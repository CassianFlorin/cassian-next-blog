import { AnimationParams } from 'animejs';

export const ANIMATION_EASING = {
  gentle: 'out(2)',
  expressive: 'out(3)',
  snappy: 'out(4)',
  pop: 'outElastic(1, 0.6)',
} as const;

export const ANIMATION_DURATION = {
  fast: 380,
  normal: 600,
  slow: 820,
} as const;

export type AnimationIntensity = 'light' | 'medium' | 'strong';

const byIntensity = (
  intensity: AnimationIntensity,
  values: [number, number, number],
) => {
  if (intensity === 'light') return values[0];
  if (intensity === 'strong') return values[2];
  return values[1];
};

export const fadeInUp = (
  delay: number = 0,
  intensity: AnimationIntensity = 'medium',
): Partial<AnimationParams> => ({
  opacity: [0, 1],
  translateY: [byIntensity(intensity, [14, 24, 36]), 0],
  easing: ANIMATION_EASING.expressive,
  duration: ANIMATION_DURATION.normal,
  delay,
});

export const fadeIn = (delay: number = 0): Partial<AnimationParams> => ({
  opacity: [0, 1],
  easing: ANIMATION_EASING.gentle,
  duration: ANIMATION_DURATION.fast,
  delay,
});

export const fadeInScale = (
  delay: number = 0,
  intensity: AnimationIntensity = 'medium',
): Partial<AnimationParams> => ({
  opacity: [0, 1],
  scale: [byIntensity(intensity, [0.98, 0.94, 0.9]), 1],
  easing: ANIMATION_EASING.expressive,
  duration: ANIMATION_DURATION.normal,
  delay,
});

export const fadeInLeft = (
  delay: number = 0,
  intensity: AnimationIntensity = 'medium',
): Partial<AnimationParams> => ({
  opacity: [0, 1],
  translateX: [byIntensity(intensity, [-14, -22, -30]), 0],
  easing: ANIMATION_EASING.expressive,
  duration: ANIMATION_DURATION.normal,
  delay,
});

export const popIn = (delay: number = 0): Partial<AnimationParams> => ({
  opacity: [0, 1],
  scale: [0.82, 1],
  easing: ANIMATION_EASING.pop,
  duration: ANIMATION_DURATION.slow,
  delay,
});
