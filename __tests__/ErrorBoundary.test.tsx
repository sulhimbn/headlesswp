import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import * as Sentry from '@sentry/nextjs'
import React from 'react'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const MockChild = () => <div data-testid="child">Child Component</div>
  const MockFallback = () => <div data-testid="fallback">Custom Fallback</div>

  class ErrorThrowingComponent extends React.Component<{ shouldThrow?: boolean }> {
    static getDerivedStateFromError() {
      return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack },
      })
    }

    render() {
      if (this.props.shouldThrow) {
        throw new Error('Test error')
      }
      return <div data-testid="child">Normal Child</div>
    }
  }

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <MockChild />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Child Component')).toBeInTheDocument()
  })

  it('should render custom fallback when error occurs', () => {
    const { container } = render(
      <ErrorBoundary fallback={<MockFallback />}>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('fallback')).toBeInTheDocument()
  })

  it('should render default fallback when no custom fallback is provided', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    expect(screen.getByText('Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.')).toBeInTheDocument()
    expect(screen.getByText('Coba Lagi')).toBeInTheDocument()
  })

  it('should call Sentry.captureException when error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({
          componentStack: expect.any(String),
        }),
      })
    )
  })

  it('should not render fallback until error occurs', () => {
    render(
      <ErrorBoundary>
        <MockChild />
      </ErrorBoundary>
    )

    expect(screen.getByText('Child Component')).toBeInTheDocument()
    expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
  })
})