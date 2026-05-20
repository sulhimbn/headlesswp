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
  })

  describe('Rendering', () => {
    test('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    test('renders without crashing with null children', () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>)
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })
  })

  describe('Error state detection', () => {
    test('shows fallback when child throws an error', () => {
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

    test('captures error with Sentry when error occurs', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockSentry.captureException).toHaveBeenCalledTimes(1)
      expect(mockSentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            componentStack: expect.any(String),
          }),
        })
      )
    })
  })

  describe('Fallback UI rendering', () => {
    test('renders custom fallback when provided', () => {
      const CustomFallback = () => <div data-testid="custom-fallback">Custom Error</div>

      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })

    test('renders default fallback when no custom fallback provided', () => {
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
      expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
    })
  })

  describe('Error recovery (try again button)', () => {
    test('try again button has correct click handler', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const tryAgainButton = screen.getByRole('button', { name: 'Coba Lagi' })
      
      expect(() => fireEvent.click(tryAgainButton)).not.toThrow()
    })

    test('calls Sentry.captureMessage when try again button is clicked', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const tryAgainButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(tryAgainButton)

      expect(mockSentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
    })
  })

  describe('Sentry integration', () => {
    test('captureException is called with error and component stack', () => {
      const error = new Error('Test error')

      const ThrowError = () => {
        throw error
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockSentry.captureException).toHaveBeenCalledWith(error, {
        extra: {
          componentStack: expect.any(String),
        },
      })
    })

    test('captureMessage is called on error recovery', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const tryAgainButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(tryAgainButton)

      expect(mockSentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
    })
  })

  describe('State behavior', () => {
    test('state is initialized with hasError false and error null', () => {
      render(
        <ErrorBoundary>
          <div>Content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    test('component maintains error state correctly', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      
      unmount()
      
      expect(mockSentry.captureException).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge cases', () => {
    test('handles Error type', () => {
      const ThrowError = () => {
        throw new Error('Regular error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(mockSentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Regular error' }),
        expect.any(Object)
      )
    })

    test('handles TypeError', () => {
      const ThrowError = () => {
        throw new TypeError('Type error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(mockSentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Type error' }),
        expect.any(Object)
      )
    })

    test('handles RangeError', () => {
      const ThrowError = () => {
        throw new RangeError('Range error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(mockSentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Range error' }),
        expect.any(Object)
      )
    })
  })
})