import { render, screen, fireEvent } from '@testing-library/react'
import * as Sentry from '@sentry/nextjs'
import ErrorBoundary from '@/components/ErrorBoundary'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

const mockSentry = Sentry as jest.Mocked<typeof Sentry>

describe('ErrorBoundary Component', () => {
  const originalError = console.error

  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
  })

  afterEach(() => {
    console.error = originalError
  })

  describe('Error State Detection', () => {
    test('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>正常工作的内容</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('正常工作的内容')).toBeInTheDocument()
    })

    test('catches error and shows fallback when child throws', () => {
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

    test('sets error state correctly when error occurs', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(container.querySelector('h2')?.textContent).toBe('Terjadi kesalahan')
    })
  })

  describe('Fallback UI Rendering', () => {
    test('renders custom fallback when provided and error occurs', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const CustomFallback = () => <div data-testid="custom-fallback">Custom Error Display</div>

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Error Display')).toBeInTheDocument()
    })

    test('does not render fallback when no error occurs', () => {
      const CustomFallback = () => <div data-testid="custom-fallback">Custom Error Display</div>

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <div>Normal content</div>
        </ErrorBoundary>
      )

      expect(screen.queryByTestId('custom-fallback')).not.toBeInTheDocument()
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

  describe('Error Recovery (Try Again Button)', () => {
    test('try again button resets error state and shows children', () => {
      let shouldThrow = true

      const ConditionalThrow = () => {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div>Recovered content</div>
      }

      render(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()

      shouldThrow = false

      const tryAgainButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(tryAgainButton)

      expect(screen.getByText('Recovered content')).toBeInTheDocument()
    })

    test('try again button is accessible with proper role and label', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const button = screen.getByRole('button', { name: 'Coba Lagi' })
      expect(button).toBeInTheDocument()
      expect(button).not.toBeDisabled()
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

      const button = screen.getByRole('button', { name: 'Coba Lagi' })
      expect(button).toHaveStyle({ padding: '0.75rem 1.5rem' })
      expect(button).toHaveStyle({ backgroundColor: '#2563eb' })
      expect(button).toHaveStyle({ cursor: 'pointer' })
      expect(button).not.toBeDisabled()
    })
  })

  describe('Sentry Integration', () => {
    test('calls Sentry.captureException when error occurs', () => {
      const ThrowError = () => {
        throw new Error('Test error for Sentry')
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

    test('calls Sentry.captureMessage when user recovers from error', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockSentry.captureException).toHaveBeenCalledTimes(1)

      const tryAgainButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(tryAgainButton)

      expect(mockSentry.captureMessage).toHaveBeenCalledTimes(1)
      expect(mockSentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
    })

    test('does not call Sentry when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      )

      expect(mockSentry.captureException).not.toHaveBeenCalled()
      expect(mockSentry.captureMessage).not.toHaveBeenCalled()
    })
  })

  describe('State Reset Behavior', () => {
    test('state is reset after successful recovery', () => {
      let shouldThrow = true

      const ConditionalThrow = () => {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div data-testid="success-content">Success</div>
      }

      render(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()

      shouldThrow = false

      const tryAgainButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(tryAgainButton)

      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
      expect(screen.getByTestId('success-content')).toBeInTheDocument()
    })

    test('error state is properly cleared on try again and triggers re-render', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()

      const tryAgainButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(tryAgainButton)

      expect(mockSentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
    })

    test('error state resets properly on rerender with new error boundary', () => {
      let shouldThrow = true

      const ConditionalThrow = () => {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div>Content after recovery</div>
      }

      render(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()

      shouldThrow = false

      render(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )

      expect(screen.getByText('Content after recovery')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles multiple children with error in one child', () => {
      const ThrowError = () => {
        throw new Error('Child error')
      }

      render(
        <ErrorBoundary>
          <div>Working child</div>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('handles error with custom error message', () => {
      const CustomErrorMessage = () => {
        throw new Error('Custom error message for testing')
      }

      render(
        <ErrorBoundary>
          <CustomErrorMessage />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(mockSentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom error message for testing',
        }),
        expect.any(Object)
      )
    })

    test('handles nested ErrorBoundary components', () => {
      const InnerThrowError = () => {
        throw new Error('Inner error')
      }

      render(
        <ErrorBoundary>
          <ErrorBoundary>
            <InnerThrowError />
          </ErrorBoundary>
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })
  })
})
