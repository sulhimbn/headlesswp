'use client'

import { Component, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
          <h2 className="mb-4 text-[hsl(var(--color-primary))]">
            Terjadi kesalahan
          </h2>
          <p className="mb-6 text-[hsl(var(--color-text-secondary))]">
            Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              Sentry.captureMessage('User recovered from error')
            }}
            className="px-6 py-3 bg-[hsl(var(--color-primary))] text-white border-0 rounded-[var(--radius-md)] cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
