import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import * as Sentry from '@sentry/nextjs'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

const mockSentryCaptureException = Sentry.captureException as jest.Mock
const mockSentryCaptureMessage = Sentry.captureMessage as jest.Mock

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Normal Rendering', () => {
    test('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    test('renders children with fallback prop', () => {
      render(
        <ErrorBoundary fallback={<div>Custom Fallback</div>}>
          <div>Child Content</div>
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    test('renders multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('displays error UI when child throws', () => {
      const ThrowError = () => {
        throw new Error('Test Error')
      }
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(screen.getByText(/Sedang memperbaiki/i)).toBeInTheDocument()
    })

    test('shows custom fallback when provided', () => {
      const ThrowError = () => {
        throw new Error('Test Error')
      }
      
      render(
        <ErrorBoundary fallback={<div>Custom Error Display</div>}>
          <ThrowError />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Custom Error Display')).toBeInTheDocument()
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })

    test('captures exception with Sentry', () => {
      const ThrowError = () => {
        throw new Error('Test Error')
      }
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      
      expect(mockSentryCaptureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: {
            componentStack: expect.any(String),
          },
        })
      )
    })

    test('captures error with additional info', () => {
      const error = new Error('Custom Error')
      const ThrowError = () => {
        throw error
      }
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      
      expect(mockSentryCaptureException).toHaveBeenCalledWith(error, expect.any(Object))
    })
  })

  describe('Recovery', () => {
    test('allows recovery via try again button', () => {
      let shouldThrow = true
      
      const ConditionalThrow = () => {
        if (shouldThrow) {
          throw new Error('Test Error')
        }
        return <div>Recovered</div>
      }
      
      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      
      shouldThrow = false
      
      const tryAgainButton = screen.getByRole('button', { name: /coba lagi/i })
      fireEvent.click(tryAgainButton)
      
      rerender(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Recovered')).toBeInTheDocument()
    })

    test('sends recovery message to Sentry on retry', () => {
      const ThrowError = () => {
        throw new Error('Test Error')
      }
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      
      const tryAgainButton = screen.getByRole('button', { name: /coba lagi/i })
      fireEvent.click(tryAgainButton)
      
      expect(mockSentryCaptureMessage).toHaveBeenCalledWith('User recovered from error')
    })
  })

  describe('Styling', () => {
    test('default error UI has correct structure', () => {
      const ThrowError = () => {
        throw new Error('Test Error')
      }
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(screen.getByText(/Sedang memperbaiki/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /coba lagi/i })).toBeInTheDocument()
    })

    test('retry button has click handler', () => {
      const ThrowError = () => {
        throw new Error('Test Error')
      }
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      
      const button = screen.getByRole('button', { name: /coba lagi/i })
      expect(button).toBeEnabled()
    })
  })

  describe('Accessibility', () => {
    test('error message is present', () => {
      const ThrowError = () => {
        throw new Error('Test Error')
      }
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('retry button is accessible', () => {
      const ThrowError = () => {
        throw new Error('Test Error')
      }
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      
      const button = screen.getByRole('button', { name: /coba lagi/i })
      expect(button).toBeEnabled()
    })
  })

  describe('Edge Cases', () => {
    test('handles non-Error exceptions', () => {
      const ThrowString = () => {
        throw 'String error'
      }
      
      render(
        <ErrorBoundary>
          <ThrowString />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('handles null error', () => {
      const ThrowNull = () => {
        throw null
      }
      
      render(
        <ErrorBoundary>
          <ThrowNull />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('maintains error state across re-renders', () => {
      const ThrowError = () => {
        throw new Error('Test Error')
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