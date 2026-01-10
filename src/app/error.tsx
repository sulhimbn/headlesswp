'use client'

import { useEffect } from 'react'
import Button from '@/components/ui/Button'
import { logger } from '@/lib/utils/logger'
import { UI_TEXT } from '@/lib/constants/uiText'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Error page caught an error:', error, { module: 'ErrorPage' })
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {UI_TEXT.error.heading}
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            {UI_TEXT.error.description}
          </p>
          <p className="text-sm text-gray-500">
            Error ID: {error.digest || 'Unknown'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
          >
            {UI_TEXT.error.tryAgain}
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            {UI_TEXT.error.backToHome}
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {UI_TEXT.error.contactHelp}{' '}
            <a
              href="/"
              className="text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 rounded"
            >
              {UI_TEXT.error.contactUs}
            </a>{' '}
            {UI_TEXT.error.contactForHelp}
          </p>
        </div>
      </div>
    </div>
  )
}
