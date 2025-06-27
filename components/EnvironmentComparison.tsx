'use client'

import React from 'react'

interface Environment {
  name: string
  path: string
  issue: string
  pros?: string[]
  cons?: string[]
}

interface EnvironmentComparisonProps {
  environments: Environment[]
}

export default function EnvironmentComparison({ environments }: EnvironmentComparisonProps) {
  return (
    <div className="my-6 w-full max-w-full">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {environments.map((env, index) => (
          <div
            key={index}
            className="w-full max-w-full rounded-lg border border-gray-200 p-3 sm:p-4 dark:border-gray-700"
          >
            <div className="mb-2 flex flex-col items-start justify-between sm:mb-3 sm:flex-row sm:items-center">
              <h3 className="text-base font-semibold break-words text-gray-900 sm:text-lg dark:text-gray-100">
                {env.name}
              </h3>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  env.name === 'Homebrew'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                }`}
              >
                {env.name === 'Homebrew' ? '问题环境' : '推荐环境'}
              </span>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div>
                <span className="text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-300">
                  路径:
                </span>
                <code className="ml-2 rounded bg-gray-100 px-2 py-1 text-xs break-all sm:text-sm dark:bg-gray-800">
                  {env.path}
                </code>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">问题:</span>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{env.issue}</p>
              </div>

              {env.pros && env.pros.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    优点:
                  </span>
                  <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {env.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-center">
                        <svg
                          className="mr-1 h-3 w-3 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {env.cons && env.cons.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">缺点:</span>
                  <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {env.cons.map((con, idx) => (
                      <li key={idx} className="flex items-center">
                        <svg
                          className="mr-1 h-3 w-3 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
