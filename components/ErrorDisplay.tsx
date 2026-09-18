import React from 'react';

interface ErrorDisplayProps {
  title: string;
  error: string;
  code?: string;
  path?: string;
  details?: string[];
}

/**
 * One error record from a terminal or log. The "this is an error" semantics
 * live in the ERROR label and the aria-label, not in a red palette: the
 * record shares the accent rule + paper surface of every other article block.
 */
export default function ErrorDisplay({
  title,
  error,
  code,
  path,
  details,
}: ErrorDisplayProps) {
  return (
    <section
      role="note"
      aria-label={`Error: ${title}`}
      className="not-prose surface-paper border-primary-600 dark:border-primary-400 my-6 w-full max-w-full border-l-2 px-4 py-3 sm:px-5 sm:py-4"
    >
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="type-meta text-primary-700 dark:text-primary-300">
          Error
        </p>
        {code && (
          <p className="type-meta text-gray-500 dark:text-gray-400">
            exit <span className="tabular-nums">{code}</span>
          </p>
        )}
      </div>

      <h4 className="text-base font-semibold break-words text-gray-900 sm:text-lg dark:text-gray-100">
        {title}
      </h4>

      <pre className="mt-3 overflow-x-auto bg-gray-200/70 px-3 py-2 font-mono text-xs leading-6 whitespace-pre-wrap text-gray-800 sm:text-sm dark:bg-gray-950/70 dark:text-gray-200">
        {error}
      </pre>

      {(path || (details && details.length > 0)) && (
        <dl className="mt-3 divide-y divide-gray-200 text-sm dark:divide-gray-800">
          {path && (
            <div className="grid grid-cols-[4.5rem_1fr] gap-3 py-2">
              <dt className="type-meta text-gray-500 dark:text-gray-400">
                Path
              </dt>
              <dd className="font-mono text-xs leading-6 break-all text-gray-800 dark:text-gray-200">
                {path}
              </dd>
            </div>
          )}
          {details && details.length > 0 && (
            <div className="grid grid-cols-[4.5rem_1fr] gap-3 py-2">
              <dt className="type-meta text-gray-500 dark:text-gray-400">
                Notes
              </dt>
              <dd>
                <ul className="space-y-1 leading-6 text-gray-700 dark:text-gray-300">
                  {details.map((detail, index) => (
                    <li key={index} className="flex gap-2">
                      <span
                        aria-hidden
                        className="text-gray-400 dark:text-gray-600"
                      >
                        —
                      </span>
                      <span className="min-w-0 break-words">{detail}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}
