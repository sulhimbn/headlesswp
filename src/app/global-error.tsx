'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Terjadi kesalahan
          </h2>
          <p className="mb-6 text-gray-600">
            Maaf, terjadi kesalahan yang tidak terduga.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mb-6 max-w-full overflow-auto rounded bg-gray-100 p-4 text-left text-sm">
              {error.message}
            </pre>
          )}
          <button
            onClick={() => reset()}
            className="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  )
}
