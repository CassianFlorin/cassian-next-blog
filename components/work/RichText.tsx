import { Fragment } from 'react';

/** Renders a plain string, turning `backtick` spans into inline code. */
export default function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
          <code
            key={index}
            className="rounded-none bg-gray-900/[0.06] px-1 py-0.5 font-mono text-[0.88em] text-gray-900 dark:bg-white/[0.08] dark:text-gray-100"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
