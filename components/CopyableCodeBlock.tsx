'use client'

import React, { useState } from 'react'

interface CopyableCodeBlockProps {
  code: string
  language?: string
  title?: string
}

export default function CopyableCodeBlock({
  code,
  language = 'shell',
  title,
}: CopyableCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <div className="my-4 w-full max-w-full">
      {title && (
        <div className="flex items-center justify-between rounded-t-lg border-b border-gray-200 bg-gray-100 px-3 py-2 sm:px-4 dark:border-gray-700 dark:bg-gray-800">
          <span className="text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-300">
            {title}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{language}</span>
        </div>
      )}
      <div className="relative">
        <pre
          className={`${title ? 'rounded-b-lg' : 'rounded-lg'} overflow-x-auto bg-gray-900 p-3 text-xs text-gray-100 sm:p-4 sm:text-sm`}
        >
          <code>{code}</code>
        </pre>
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 p-2 text-gray-400 transition-colors duration-200 hover:text-white"
          title="复制代码"
        >
          {copied ? (
            <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
