'use client';

import siteMetadata from '@/data/siteMetadata';
import { useEffect, useState } from 'react';
import { smoothScrollTo } from '@/lib/animations/scroll';

/**
 * Quiet back-to-top / jump-to-comments controls for long articles. They fade
 * in with CSS (no JS animation), so reduced-motion users still see them.
 */
const ScrollTopAndComment = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleWindowScroll = () => setShow(window.scrollY > 400);
    handleWindowScroll();
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  const buttonClass =
    'flex h-10 w-10 items-center justify-center border border-gray-900/20 bg-gray-50 text-gray-600 transition-colors duration-200 hover:border-gray-950 hover:text-gray-950 dark:border-white/20 dark:bg-night dark:text-gray-300 dark:hover:border-gray-50 dark:hover:text-gray-50';

  return (
    <div
      aria-hidden={!show}
      className={`fixed right-6 bottom-6 z-40 hidden flex-col gap-2 transition-opacity duration-200 md:flex ${
        show ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {siteMetadata.comments?.provider && (
        <button
          type="button"
          aria-label="Scroll To Comment"
          tabIndex={show ? 0 : -1}
          onClick={() => {
            const comment = document.getElementById('comment');
            if (comment) smoothScrollTo(comment);
          }}
          className={buttonClass}
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
      <button
        type="button"
        aria-label="Scroll To Top"
        tabIndex={show ? 0 : -1}
        onClick={() => smoothScrollTo(0)}
        className={buttonClass}
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

export default ScrollTopAndComment;
