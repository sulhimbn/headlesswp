import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

const mockSentryCaptureException = jest.fn()
const mockSentryCaptureMessage = jest.fn()

jest.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => mockSentryCaptureException(...args),
  captureMessage: (...args: unknown[]) => mockSentryCaptureMessage(...args),
}))

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Normal Rendering', () => {
    test('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child Content</div>
        </ErrorBoundary>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    test('renders multiple children correctly', () => {
      render(
        <ErrorBoundary>
          <span>First</span>
          <span>Second</span>
        </ErrorBoundary>
      )
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
    })
  })

  describe('Error Catching', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }

    test('catches error thrown in child component', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(screen.getByText('Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.')).toBeInTheDocument()
    })

    test('does not render children when error occurs', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <div data-testid="child">Should not render</div>
          <ThrowError />
        </ErrorBoundary>
      )
      expect(screen.queryByTestId('child')).not.toBeInTheDocument()
    })

    test('captures error with Sentry', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockSentryCaptureException).toHaveBeenCalledWith(
        expect.any(Error),
        {
          extra: {
            componentStack: expect.any(String),
          },
        }
      )
    })

    test('catches different types of errors', () => {
      const ThrowTypeError = () => {
        throw new TypeError('Type error')
      }

      render(
        <ErrorBoundary>
          <ThrowTypeError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(mockSentryCaptureException).toHaveBeenCalledWith(
        expect.any(TypeError),
        expect.any(Object)
      )
    })

    test('catches errors with custom messages', () => {
      const ThrowCustomError = () => {
        throw new Error('Custom error message')
      }

      render(
        <ErrorBoundary>
          <ThrowCustomError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })
  })

  describe('Fallback UI', () => {
    test('shows default fallback UI when no fallback prop is provided', () => {
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

    test('renders custom fallback when provided', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const CustomFallback = <div data-testid="custom-fallback">Custom Error</div>

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Error')).toBeInTheDocument()
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })

    test('renders custom fallback with React elements', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary fallback={<div>Custom Error Message</div>}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom Error Message')).toBeInTheDocument()
    })

    test('renders custom fallback with button', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary fallback={<button>Retry</button>}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })
  })

  describe('Reset Capability', () => {
    test('resets error state when "Coba Lagi" button is clicked', async () => {
      let shouldThrow = true

      const ConditionalThrow = () => {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div data-testid="recovered">Recovered</div>
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()

      shouldThrow = false

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      expect(mockSentryCaptureMessage).toHaveBeenCalledWith('User recovered from error')

      rerender(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('recovered')).toBeInTheDocument()
    })

    test('reset button is clickable and functional', () => {
      let shouldThrow = true

      const ConditionalThrow = () => {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div>Working</div>
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )

      const button = screen.getByRole('button', { name: 'Coba Lagi' })
      expect(button).toBeEnabled()

      shouldThrow = false
      rerender(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )

      fireEvent.click(button)
    })
  })

  describe('Accessibility', () => {
    test('retry button has accessible name', () => {
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

    test('error message is properly structured', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Terjadi kesalahan')
    })
  })

  describe('Edge Cases', () => {
    test('handles error thrown during render', () => {
      const ThrowImmediately = () => {
        throw new Error('Immediate error')
      }

      render(
        <ErrorBoundary>
          <ThrowImmediately />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('handles null children', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      )

      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })

    test('handles undefined children', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      )

      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })

    test('handles empty fragment', () => {
      render(
        <ErrorBoundary>
          <></>
        </ErrorBoundary>
      )

      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })

    test('preserves state across multiple errors', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(mockSentryCaptureException).toHaveBeenCalledTimes(2)
    })
  })

  describe('Default Props', () => {
    test('works without explicit fallback prop', () => {
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
  })
})
