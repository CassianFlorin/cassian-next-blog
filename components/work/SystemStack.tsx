'use client';

import { useEffect, useRef, useState } from 'react';
import RichText from './RichText';
import type { StackHandle } from './systemStackEngine';

/**
 * SYSTEM chapter: the layers as a 3D exploded stack beside a plain numbered
 * list. The list is the readable source (and all there is without WebGL);
 * hovering a layer on either side lights it on both.
 */

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

export default function SystemStack({
  layers,
  label,
}: {
  layers: Array<{ title: string; body: string }>;
  label: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<StackHandle | null>(null);
  const [webgl, setWebgl] = useState(true);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const host = hostRef.current;
    const labelLayer = labelRef.current;
    if (!host || !labelLayer) return;
    if (!supportsWebGL()) {
      setWebgl(false);
      return;
    }
    let disposed = false;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    void import('./systemStackEngine').then(({ mountSystemStack }) => {
      if (disposed) return;
      handleRef.current = mountSystemStack(
        host,
        { onReady: () => setReady(true), onActive: setActive },
        {
          reducedMotion,
          layers: layers.map((layer) => layer.title),
          labelLayer,
        },
      );
    });
    return () => {
      disposed = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [layers]);

  const light = (index: number) => {
    setActive(index);
    handleRef.current?.setActive(index);
  };

  return (
    <div
      className={
        webgl
          ? 'grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-12'
          : ''
      }
    >
      {webgl ? (
        <div
          className="work-stage relative h-[22rem] overflow-hidden sm:h-[28rem]"
          data-ready={ready ? 'true' : 'false'}
        >
          <div ref={hostRef} className="absolute inset-0" />
          <div
            ref={labelRef}
            className="pointer-events-none absolute inset-0 overflow-hidden"
          />
        </div>
      ) : null}

      <ol aria-label={label} className="max-w-3xl space-y-7">
        {layers.map((layer, i) => (
          <li
            key={layer.title}
            onMouseEnter={() => light(i)}
            onMouseLeave={() => light(-1)}
            data-active={active === i ? 'true' : 'false'}
            className="stack-item grid gap-2 border-l-2 pl-5 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-4"
          >
            <span className="type-meta pt-0.5 text-gray-500 dark:text-gray-400">
              L{i + 1}
            </span>
            <span className="space-y-1.5">
              <span className="block font-semibold tracking-tight text-gray-950 dark:text-gray-50">
                {layer.title}
              </span>
              <span className="block leading-7 text-gray-700 dark:text-gray-300">
                <RichText text={layer.body} />
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
