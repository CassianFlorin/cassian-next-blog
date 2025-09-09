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

export default function StepProgress({ steps }: StepProgressProps) {
  return (
    <div className="my-6 w-full max-w-full">
      <div className="space-y-3 sm:space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex w-full items-start">
            <div className="mt-0.5 mr-3 flex h-7 w-7 items-center justify-center rounded-full border-2 sm:mr-4 sm:h-8 sm:w-8">
              {step.status === 'completed' && (
                <svg
                  className="h-4 w-4 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
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
            <div className="min-w-0 flex-1">
              <h4
                className={`text-xs font-medium sm:text-sm ${
                  step.status === 'completed'
                    ? 'text-green-600'
                    : step.status === 'current'
                      ? 'text-blue-600'
                      : 'text-gray-500'
                }`}
              >
                {step.title}
              </h4>
              {step.description && (
                <p className="mt-1 text-xs break-words text-gray-500 sm:text-sm">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
