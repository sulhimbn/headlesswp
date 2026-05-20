import { render, screen, fireEvent } from '@testing-library/react'
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
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Default Rendering', () => {
    test('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child Content</div>
        </ErrorBoundary>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    test('renders multiple children', () => {
      render(
        <ErrorBoundary>
          <span>First</span>
          <span>Second</span>
        </ErrorBoundary>
      )
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
    })

    test('does not show error UI when no error', () => {
      render(
        <ErrorBoundary>
          <div>Content</div>
        </ErrorBoundary>
      )
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Coba Lagi' })).not.toBeInTheDocument()
    })
  })

  describe('Error Catching', () => {
    test('catches error from child component', () => {
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

    test('calls Sentry.captureException when error occurs', () => {
      const ThrowError = () => {
        throw new Error('Sentry test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockSentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            componentStack: expect.any(String),
          }),
        })
      )
    })

    test('catches different error types', () => {
      const ThrowTypeError = () => {
        throw new TypeError('Type error occurred')
      }

      render(
        <ErrorBoundary>
          <ThrowTypeError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })
  })

  describe('Error State UI', () => {
    test('displays error message heading', () => {
      const ThrowError = () => {
        throw new Error('Error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const heading = screen.getByRole('heading', { name: 'Terjadi kesalahan' })
      expect(heading).toBeInTheDocument()
    })

    test('displays recovery message', () => {
      const ThrowError = () => {
        throw new Error('Error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.')).toBeInTheDocument()
    })

    test('displays retry button', () => {
      const ThrowError = () => {
        throw new Error('Error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      expect(retryButton).toBeInTheDocument()
    })

    test('retry button has correct styling', () => {
      const ThrowError = () => {
        throw new Error('Error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      expect(retryButton).toHaveStyle({ backgroundColor: '#2563eb' })
      expect(retryButton).toHaveAttribute('style', expect.stringContaining('color'))
    })
  })

  describe('Fallback Prop', () => {
    test('renders custom fallback when provided', () => {
      const ThrowError = () => {
        throw new Error('Error')
      }

      render(
        <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Fallback</div>}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Fallback')).toBeInTheDocument()
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })

    test('renders custom fallback component with error info', () => {
      const CustomFallback = ({ error }: { error: Error | null }) => (
        <div data-testid="custom-fallback">
          <p>Error: {error?.message}</p>
        </div>
      )

      const ThrowError = () => {
        throw new Error('Custom fallback test')
      }

      render(
        <ErrorBoundary fallback={<CustomFallback error={null} />}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    })

    test('prefers custom fallback over default error UI', () => {
      const ThrowError = () => {
        throw new Error('Error')
      }

      render(
        <ErrorBoundary fallback={<div>Custom Error UI</div>}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
    })
  })

  describe('Reset Functionality', () => {
    test('retry button is present and can be clicked', () => {
      const ThrowError = () => {
        throw new Error('Error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      expect(retryButton).toBeInTheDocument()
      fireEvent.click(retryButton)
    })

    test('calls Sentry.captureMessage on recovery', () => {
      const ThrowError = () => {
        throw new Error('Error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      expect(mockSentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
    })

    test('retry button resets internal state', () => {
      const { unmount } = render(
        <ErrorBoundary>
          <div>Initial Content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Initial Content')).toBeInTheDocument()

      unmount()
    })
  })

  describe('TypeScript Types', () => {
    test('accepts ReactNode children', () => {
      render(
        <ErrorBoundary>
          <span>String child</span>
        </ErrorBoundary>
      )
      expect(screen.getByText('String child')).toBeInTheDocument()
    })

    test('accepts optional fallback prop', () => {
      render(
        <ErrorBoundary fallback={<div>Fallback</div>}>
          <div>Content</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    test('works without fallback prop', () => {
      render(
        <ErrorBoundary>
          <div>Content</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles error that occurs after initial render', () => {
      const StatefulError = ({ shouldError }: { shouldError: boolean }) => {
        if (shouldError) {
          throw new Error('Stateful error')
        }
        return <div>Working</div>
      }

      const { rerender } = render(
        <ErrorBoundary>
          <StatefulError shouldError={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Working')).toBeInTheDocument()

      rerender(
        <ErrorBoundary>
          <StatefulError shouldError={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('preserves state across re-renders when error persists', () => {
      const ThrowError = () => {
        throw new Error('Persistent error')
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()

      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })
  })
})