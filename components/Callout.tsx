import React from 'react';

/**
 * In-article aside. Shares the accent rule with `Tldr`: a single left rule in
 * the accent colour on a paper surface, square corners, no second hue.
 */
export default function Callout({
  emoji,
  children,
}: {
  emoji?: string;
  children: React.ReactNode;
  type?: string;
}) {
  return (
    <aside className="not-prose border-primary-600 dark:border-primary-400 surface-paper my-6 flex w-full max-w-full items-start gap-3 border-l-2 px-4 py-3 sm:px-5 sm:py-4">
      {emoji && (
        <span aria-hidden className="text-base leading-6 sm:text-lg">
          {emoji}
        </span>
      )}
      <div className="w-full text-sm leading-6 break-words text-gray-800 sm:text-base sm:leading-7 dark:text-gray-200 [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded-none [&_code]:bg-gray-200/70 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-gray-800 dark:[&_code]:bg-gray-950/70 dark:[&_code]:text-gray-200 [&_p+p]:mt-2">
        {children}
      </div>
    </aside>
  );
}
