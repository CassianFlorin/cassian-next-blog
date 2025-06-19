'use client'

import React from 'react'

interface Step {
  title: string
  status: 'completed' | 'current' | 'pending'
  description?: string
}

interface StepProgressProps {
  steps: Step[]
}

export default function StepProgress({ steps }: StepProgressProps) {
  return (
    <div className="my-6">
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start">
            <div className="mt-0.5 mr-4 flex h-8 w-8 items-center justify-center rounded-full border-2">
              {step.status === 'completed' && (
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {step.status === 'current' && (
                <div className="h-3 w-3 rounded-full bg-blue-600"></div>
              )}
              {step.status === 'pending' && (
                <div className="h-3 w-3 rounded-full bg-gray-300"></div>
              )}
            </div>
            <div className="flex-1">
              <h4
                className={`text-sm font-medium ${
                  step.status === 'completed'
                    ? 'text-green-600'
                    : step.status === 'current'
                      ? 'text-blue-600'
                      : 'text-gray-500'
                }`}
              >
                {step.title}
              </h4>
              {step.description && <p className="mt-1 text-sm text-gray-500">{step.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
