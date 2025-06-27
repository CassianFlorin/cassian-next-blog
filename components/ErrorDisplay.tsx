'use client'

import React from 'react'

interface ErrorDisplayProps {
  title: string
  error: string
  code?: string
  path?: string
  details?: string[]
}

export default function ErrorDisplay({ title, error, code, path, details }: ErrorDisplayProps) {
  return (
    <div className="my-6 max-w-full rounded-lg border border-red-200 bg-red-50 p-4 sm:p-6 dark:border-red-800 dark:bg-red-900/20">
      <div className="flex flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-2 flex-shrink-0 sm:mb-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-0 w-full break-words sm:ml-3">
          <h3 className="text-sm font-medium text-red-800 sm:text-base dark:text-red-200">
            {title}
          </h3>
          <div className="mt-2 text-sm text-red-700 sm:text-base dark:text-red-300">
            <p className="overflow-x-auto rounded bg-red-100 px-2 py-1 font-mono text-xs sm:text-sm dark:bg-red-900/30">
              {error}
            </p>
            {code && (
              <p className="mt-1">
                <span className="font-semibold">错误代码:</span> {code}
              </p>
            )}
            {path && (
              <p className="mt-1">
                <span className="font-semibold">PATH:</span> {path}
              </p>
            )}
            {details && details.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-1">
                {details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
