import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import * as Sentry from '@sentry/nextjs'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

const mockSentry = Sentry as jest.Mocked<typeof Sentry>

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    test('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Children Content</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('Children Content')).toBeInTheDocument()
    })

    test('does not render fallback UI when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Children Content</div>
        </ErrorBoundary>
      )
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })
  })

  describe('Error State Detection', () => {
    test('detects error via getDerivedStateFromError', () => {
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

    test('sets hasError to true when error occurs', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const heading = screen.getByRole('heading', { name: 'Terjadi kesalahan' })
      expect(heading).toBeInTheDocument()
    })
  })

  describe('Sentry Integration', () => {
    test('calls Sentry.captureException when error occurs', () => {
      const testError = new Error('Test error')
      const ThrowError = () => {
        throw testError
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockSentry.captureException).toHaveBeenCalledTimes(1)
      expect(mockSentry.captureException).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({
          extra: expect.objectContaining({
            componentStack: expect.anything(),
          }),
        })
      )
    })
  })

  describe('Fallback UI', () => {
    test('renders default fallback UI when error occurs', () => {
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

    test('renders retry button in fallback UI', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
    })
  })

  describe('Recovery Button', () => {
    test('resets error state when retry button is clicked', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()

      rerender(
        <ErrorBoundary>
          <div>Recovered Content</div>
        </ErrorBoundary>
      )

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('Recovered Content')).toBeInTheDocument()
      })
    })

    test('calls Sentry.captureMessage when recovering from error', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(mockSentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
      })
    })
  })

  describe('Custom Fallback Prop', () => {
    test('renders custom fallback when provided', () => {
      const CustomFallback = () => <div data-testid="custom-fallback">Custom Error Message</div>

      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Error Message')).toBeInTheDocument()
    })

    test('does not render default fallback when custom fallback is provided', () => {
      const CustomFallback = () => <div>Custom Error</div>

      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })
  })

  describe('Component Re-rendering', () => {
    test('re-renders children when error is cleared via rerender', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <div>Initial Content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Initial Content')).toBeInTheDocument()

      rerender(
        <ErrorBoundary>
          <div>New Content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('New Content')).toBeInTheDocument()
    })

    test('recovers from error when retry button is clicked and children no longer throw', async () => {
      let shouldThrow = true

      const ConditionalThrow = () => {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div data-testid="recovered">Recovered</div>
      }

      render(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      })

      shouldThrow = false

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByTestId('recovered')).toBeInTheDocument()
      })
    })
  })
})