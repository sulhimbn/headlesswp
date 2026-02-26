'use client'

import React from 'react'
import * as Sentry from '@sentry/nextjs'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Terjadi kesalahan
          </h2>
          <p className="mb-6 text-gray-600">
            Maaf, terjadi kesalahan yang tidak terduga. Tim telah diberitahu.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mb-6 max-w-full overflow-auto rounded bg-gray-100 p-4 text-left text-sm">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Coba lagi
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
