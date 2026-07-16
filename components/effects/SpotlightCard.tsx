'use client';

import { PointerEvent, ReactNode, useCallback, useRef } from 'react';

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Aceternity style card with a pointer-tracked glow. The spotlight position
 * is written straight to CSS variables so pointer movement never re-renders
 * the React tree.
 */
export default function SpotlightCard({
  children,
  className = '',
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    },
    [],
  );

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`spotlight-card ${className}`}
    >
      {children}
    </div>
  );
}
