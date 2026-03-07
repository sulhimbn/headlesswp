import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import * as Sentry from '@sentry/nextjs'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Error state detection', () => {
    test('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Normal content')).toBeInTheDocument()
    })

    test('catches error from child component', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      })
      
      unmount()
    })

    test('detects different error types', async () => {
      const ThrowTypeError = () => {
        throw new TypeError('Type error')
      }

      const { unmount } = render(
        <ErrorBoundary>
          <ThrowTypeError />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      })
      
      unmount()
    })
  })

  describe('Fallback UI rendering', () => {
    test('renders default fallback UI', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
        expect(screen.getByText('Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
      })
      
      unmount()
    })

    test('renders custom fallback when provided', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { unmount } = render(
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowError />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText('Custom fallback')).toBeInTheDocument()
      })
      
      unmount()
    })
  })

  describe('Error recovery (try again button)', () => {
    test('renders try again button in fallback', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
      })
      
      unmount()
    })

    test('recovers from error when try again is clicked', async () => {
      const { unmount } = render(
        <ErrorBoundary>
          <div>Content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
      unmount()
    })
  })

  describe('Sentry integration', () => {
    test('calls captureException on error', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(Sentry.captureException).toHaveBeenCalled()
      })
      
      unmount()
    })

    test('calls captureMessage on recovery', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
        fireEvent.click(retryButton)
      })

      expect(Sentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
      unmount()
    })
  })

  describe('State reset behavior', () => {
    test('clicking retry resets error state', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(Sentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
      })
      unmount()
    })
  })

  describe('Props handling', () => {
    test('handles null children', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      )
    })

    test('handles undefined children', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      )
    })
  })
})
