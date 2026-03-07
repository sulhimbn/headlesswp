import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import React from 'react'

const mockCaptureException = jest.fn()
const mockCaptureMessage = jest.fn()

jest.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
}))

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Error state detection', () => {
    test('catches errors and shows fallback UI', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    test('does not show error UI when no error', () => {
      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      )
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })

    test('handles different error types', () => {
      const ThrowTypeError = () => {
        throw new TypeError('Type error test')
      }

      render(
        <ErrorBoundary>
          <ThrowTypeError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })
  })

  describe('Fallback UI rendering', () => {
    test('shows custom fallback when provided', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary fallback={<div>Custom Fallback</div>}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom Fallback')).toBeInTheDocument()
    })

    test('does not show custom fallback when no error', () => {
      render(
        <ErrorBoundary fallback={<div>Custom Fallback</div>}>
          <div>Child</div>
        </ErrorBoundary>
      )
      expect(screen.queryByText('Custom Fallback')).not.toBeInTheDocument()
    })

    test('shows default fallback with error message', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(screen.getByText('Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.')).toBeInTheDocument()
    })

    test('shows try again button in default fallback', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /Coba Lagi/i })).toBeInTheDocument()
    })
  })

  describe('Error recovery (try again button)', () => {
    test('try again button exists and is clickable', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const tryAgainButton = screen.getByRole('button', { name: /Coba Lagi/i })
      expect(tryAgainButton).toBeInTheDocument()
      fireEvent.click(tryAgainButton)
    })

    test('try again button calls Sentry captureMessage on recovery', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockCaptureException).toHaveBeenCalled()

      const tryAgainButton = screen.getByRole('button', { name: /Coba Lagi/i })
      fireEvent.click(tryAgainButton)

      expect(mockCaptureMessage).toHaveBeenCalledWith('User recovered from error')
    })
  })

  describe('Sentry integration', () => {
    test('calls captureException when error occurs', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.any(Error),
        {
          extra: {
            componentStack: expect.any(String),
          },
        }
      )
    })

    test('calls captureMessage when user recovers from error', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockCaptureException).toHaveBeenCalled()

      const tryAgainButton = screen.getByRole('button', { name: /Coba Lagi/i })
      fireEvent.click(tryAgainButton)

      expect(mockCaptureMessage).toHaveBeenCalledWith('User recovered from error')
    })

    test('captureException includes componentStack in extra', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            componentStack: expect.any(String),
          }),
        })
      )
    })
  })

  describe('Component structure', () => {
    test('default fallback has correct styling', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const errorContainer = screen.getByText('Terjadi kesalahan').parentElement
      expect(errorContainer).toHaveStyle({ padding: '2rem' })
      expect(errorContainer).toHaveStyle({ textAlign: 'center' })
    })

    test('try again button has correct styling', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const button = screen.getByRole('button', { name: /Coba Lagi/i })
      expect(button).toHaveStyle({ padding: '0.75rem 1.5rem' })
      expect(button).toHaveStyle({ cursor: 'pointer' })
    })
  })

  describe('Edge cases', () => {
    test('handles error with no message', () => {
      const ThrowError = () => {
        throw new Error()
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })
  })
})
