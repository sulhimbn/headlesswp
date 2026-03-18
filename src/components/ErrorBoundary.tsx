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
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{ marginBottom: '1rem', color: 'hsl(var(--color-primary))' }}>
            Terjadi kesalahan
          </h2>
          <p style={{ color: 'hsl(var(--color-text-muted))', marginBottom: '1.5rem' }}>
            Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              Sentry.captureMessage('User recovered from error')
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'hsl(var(--color-accent))',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Coba Lagi
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
