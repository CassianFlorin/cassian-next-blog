'use client';

import React from 'react';

interface Step {
  title: string;
  status: 'completed' | 'current' | 'pending';
  description?: string;
}

interface StepProgressProps {
  steps: Step[];
}

/**
 * Vertical step list. State is carried by the accent colour and the marker
 * shape alone (filled / ring / hollow) so it stays within the one-accent
 * palette and still reads without colour.
 */
export default function StepProgress({ steps }: StepProgressProps) {
  return (
    <ol className="not-prose my-6 w-full max-w-full list-none space-y-4 p-0">
      {steps.map((step, index) => {
        const done = step.status === 'completed';
        const current = step.status === 'current';
        return (
          <li key={index} className="flex w-full items-start gap-3 sm:gap-4">
            <span
              aria-hidden
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-[11px] tabular-nums ${
                done
                  ? 'border-primary-600 bg-primary-600 dark:border-primary-400 dark:bg-primary-400 text-white dark:text-gray-950'
                  : current
                    ? 'border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300'
                    : 'border-gray-300 text-gray-500 dark:border-gray-700 dark:text-gray-400'
              }`}
            >
              {done ? (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 20 20"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="square" d="M4 10.5l4 4 8-9" />
                </svg>
              ) : (
                String(index + 1).padStart(2, '0')
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h4
                className={`text-sm font-medium ${
                  current
                    ? 'text-primary-700 dark:text-primary-300'
                    : done
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <span className="sr-only">
                  {done ? 'Completed: ' : current ? 'Current: ' : 'Pending: '}
                </span>
                {step.title}
              </h4>
              {step.description && (
                <p className="mt-1 text-sm leading-6 break-words text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
