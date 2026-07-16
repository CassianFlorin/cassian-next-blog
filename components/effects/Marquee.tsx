import { ReactNode } from 'react';

type MarqueeProps = {
  children: ReactNode;
  className?: string;
};

/**
 * CSS-only infinite marquee. Content is duplicated once; the track slides
 * -50% and loops. Pauses on hover, static under prefers-reduced-motion.
 */
export default function Marquee({ children, className = '' }: MarqueeProps) {
  return (
    <div className={`marquee ${className}`}>
      <div className="marquee-track">
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
