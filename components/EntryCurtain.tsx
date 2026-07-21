'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createTimeline, stagger } from 'animejs';
import { ANIMATION_EASING } from '@/lib/animations/fadeIn';

const SESSION_KEY = 'entry-curtain-played';
const BRAND = 'Cassian Florin';
const TAGLINE = 'AI Engineering · Tool Builder';

/**
 * First-visit brand curtain. Plays once per browser session: the brand name
 * reveals character-by-character over a primary-tinted overlay, then the
 * curtain lifts to hand off to the in-page RouteTransitionOrchestrator.
 *
 * A blocking inline script (see the locale layout) adds `entry-curtain-done`
 * to <html> when the session flag is already set, so returning-in-session
 * reloads never flash the curtain before this effect runs.
 */
export default function EntryCurtain() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  const chars = useMemo(
    () =>
      Array.from(BRAND).map((char) => ({
        char,
        isSpace: char === ' ',
      })),
    [],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const finish = () => {
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* storage may be unavailable (private mode); play once, no persistence */
      }
      document.documentElement.classList.add('entry-curtain-done');
      setDone(true);
    };

    let alreadyPlayed = false;
    try {
      alreadyPlayed = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      alreadyPlayed = false;
    }

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (alreadyPlayed || reducedMotion) {
      finish();
      return;
    }

    const letters = root.querySelectorAll<HTMLElement>('.entry-curtain-char');
    const tagline = root.querySelector<HTMLElement>('.entry-curtain-tagline');
    const rule = root.querySelector<HTMLElement>('.entry-curtain-rule');

    if (!letters.length || !tagline || !rule) {
      finish();
      return;
    }

    document.body.style.overflow = 'hidden';

    const timeline = createTimeline({
      defaults: { ease: ANIMATION_EASING.expressive },
    });

    timeline
      .add(letters, {
        opacity: [0, 1],
        translateY: ['0.75em', 0],
        rotate: [6, 0],
        duration: 640,
        delay: stagger(38, { start: 140 }),
      })
      .add(
        rule,
        {
          scaleX: [0, 1],
          opacity: [0, 1],
          duration: 520,
        },
        '-=320',
      )
      .add(
        tagline,
        {
          opacity: [0, 1],
          translateY: [10, 0],
          duration: 480,
        },
        '-=300',
      )
      .add(
        root,
        {
          translateY: ['0%', '-100%'],
          duration: 760,
          ease: 'inOut(3)',
          delay: 460,
          onComplete: () => {
            document.body.style.overflow = '';
            finish();
          },
        },
        '+=0',
      );

    return () => {
      timeline.pause();
      document.body.style.overflow = '';
    };
  }, []);

  if (done) return null;

  return (
    <div ref={rootRef} className="entry-curtain" role="presentation">
      <div className="entry-curtain-inner">
        <h1 className="entry-curtain-brand" aria-label={BRAND}>
          {chars.map((item, index) =>
            item.isSpace ? (
              <span key={index}> </span>
            ) : (
              <span
                key={index}
                aria-hidden="true"
                className="entry-curtain-char"
              >
                {item.char}
              </span>
            ),
          )}
        </h1>
        <span className="entry-curtain-rule" aria-hidden="true" />
        <p className="entry-curtain-tagline" aria-hidden="true">
          {TAGLINE}
        </p>
      </div>
    </div>
  );
}
