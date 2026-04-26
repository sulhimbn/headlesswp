'use client'

import { Component, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'

interface Props {
  children?: ReactNode
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
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)', color: '#dc2626' }}>
            Terjadi kesalahan
          </h2>
          <p style={{ color: '#6b7280', marginBottom: 'var(--spacing-lg)' }}>
            Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              Sentry.captureMessage('User recovered from error')
            }}
            style={{
              padding: '0.75rem var(--spacing-md)',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
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
