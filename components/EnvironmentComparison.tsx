'use client';

import React from 'react';

interface Environment {
  name: string;
  path: string;
  issue: string;
  pros?: string[];
  cons?: string[];
}

interface EnvironmentComparisonProps {
  environments: Environment[];
}

const Check = () => (
  <svg
    aria-hidden
    className="mt-1.5 h-3 w-3 shrink-0"
    fill="none"
    viewBox="0 0 20 20"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="square" d="M4 10.5l4 4 8-9" />
  </svg>
);

const Cross = () => (
  <svg
    aria-hidden
    className="mt-1.5 h-3 w-3 shrink-0"
    fill="none"
    viewBox="0 0 20 20"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="square" d="M5 5l10 10M15 5L5 15" />
  </svg>
);

/**
 * Side-by-side environment cards. "Recommended" takes the accent colour,
 * "problem" stays in the gray scale; the labels carry the meaning so the
 * comparison never depends on a red/green pair.
 */
export default function EnvironmentComparison({
  environments,
}: EnvironmentComparisonProps) {
  return (
    <div className="not-prose my-6 grid w-full max-w-full grid-cols-1 gap-px bg-gray-200 md:grid-cols-2 dark:bg-gray-800">
      {environments.map((env, index) => {
        const problem = env.name === 'Homebrew';
        return (
          <section
            key={index}
            className={`surface-paper w-full max-w-full border-t-2 p-4 sm:p-5 ${
              problem
                ? 'border-gray-400 dark:border-gray-600'
                : 'border-primary-600 dark:border-primary-400'
            }`}
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 className="text-base font-semibold break-words text-gray-900 sm:text-lg dark:text-gray-100">
                {env.name}
              </h3>
              <span
                className={`type-meta shrink-0 ${
                  problem
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-primary-700 dark:text-primary-300'
                }`}
              >
                {problem ? '问题环境' : '推荐环境'}
              </span>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="type-meta text-gray-500 dark:text-gray-400">
                  路径
                </dt>
                <dd className="mt-1">
                  <code className="bg-gray-200/70 px-1.5 py-0.5 font-mono text-xs break-all text-gray-800 dark:bg-gray-950/70 dark:text-gray-200">
                    {env.path}
                  </code>
                </dd>
              </div>

              <div>
                <dt className="type-meta text-gray-500 dark:text-gray-400">
                  问题
                </dt>
                <dd className="mt-1 leading-6 text-gray-700 dark:text-gray-300">
                  {env.issue}
                </dd>
              </div>

              {env.pros && env.pros.length > 0 && (
                <div>
                  <dt className="type-meta text-primary-700 dark:text-primary-300">
                    优点
                  </dt>
                  <dd>
                    <ul className="mt-1 space-y-1 text-gray-700 dark:text-gray-300">
                      {env.pros.map((pro, idx) => (
                        <li
                          key={idx}
                          className="text-primary-700 dark:text-primary-300 flex items-start gap-2"
                        >
                          <Check />
                          <span className="text-gray-700 dark:text-gray-300">
                            {pro}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}

              {env.cons && env.cons.length > 0 && (
                <div>
                  <dt className="type-meta text-gray-500 dark:text-gray-400">
                    缺点
                  </dt>
                  <dd>
                    <ul className="mt-1 space-y-1 text-gray-700 dark:text-gray-300">
                      {env.cons.map((con, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-gray-500"
                        >
                          <Cross />
                          <span className="text-gray-700 dark:text-gray-300">
                            {con}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
