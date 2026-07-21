'use client';

import { useEffect, useMemo, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { ANIMATION_EASING } from '@/lib/animations/fadeIn';

type SplitTextProps = {
  text: string;
  className?: string;
  /** ms before the reveal starts */
  delay?: number;
  as?: 'h1' | 'h2' | 'p' | 'span';
};

/**
 * React Bits style character reveal. Words stay as inline-blocks so Latin
 * text keeps natural wrapping; CJK characters become single-char words.
 */
export default function SplitText({
  text,
  className,
  delay = 0,
  as: Tag = 'span',
}: SplitTextProps) {
  const rootRef = useRef<HTMLElement>(null);

  const words = useMemo(() => {
    return text.split(/(\s+)/).map((segment) => ({
      isSpace: /^\s+$/.test(segment),
      chars: Array.from(segment),
    }));
  }, [text]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const chars = root.querySelectorAll<HTMLElement>('.split-char');
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (reducedMotion) {
      chars.forEach((char) => {
        char.style.opacity = '1';
        char.style.removeProperty('transform');
      });
      return;
    }

    const animation = animate(chars, {
      opacity: [0, 1],
      translateY: ['0.6em', 0],
      rotate: [4, 0],
      ease: ANIMATION_EASING.expressive,
      duration: 700,
      delay: stagger(26, { start: delay }),
    });

    return () => {
      animation.pause();
    };
  }, [words, delay]);

  return (
    <Tag ref={rootRef as never} className={className} aria-label={text}>
      {words.map((word, wordIndex) =>
        word.isSpace ? (
          <span key={wordIndex}> </span>
        ) : (
          <span
            key={wordIndex}
            aria-hidden="true"
            className="inline-block whitespace-nowrap"
          >
            {word.chars.map((char, charIndex) => (
              <span key={charIndex} className="split-char opacity-0">
                {char}
              </span>
            ))}
          </span>
        ),
      )}
    </Tag>
  );
}
