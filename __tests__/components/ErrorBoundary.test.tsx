import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import * as Sentry from '@sentry/nextjs'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn()
}))

describe('ErrorBoundary Component', () => {
  const ChildComponent = () => <div>Child Content</div>
  
  const ErrorChild = ({ shouldThrow }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error')
    }
    return <div>Normal Content</div>
  }

  beforeEach(() => {
    jest.clearAllMocks()
    cleanup()
  })

  describe('Normal Rendering', () => {
    test('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ChildComponent />
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

  describe('Error State', () => {
    test('displays error UI when child throws', () => {
      expect(() => {
        render(
          <ErrorBoundary>
            <ErrorChild shouldThrow />
          </ErrorBoundary>
        )
      }).not.toThrow()
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('shows recovery message', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      expect(screen.getByText(/Silakan coba lagi nanti/i)).toBeInTheDocument()
    })

    test('shows try again button', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
    })

    test('error UI has correct layout', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      const container = screen.getByRole('button', { name: 'Coba Lagi' }).parentElement
      expect(container).toHaveStyle({ display: 'flex', textAlign: 'center' })
    })

    test('error heading exists with error text', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('error message exists with recovery text', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      expect(screen.getByText(/Silakan coba lagi nanti/i)).toBeInTheDocument()
    })
  })

  describe('Recovery Functionality', () => {
    test('try again button is clickable', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      const button = screen.getByRole('button', { name: 'Coba Lagi' })
      expect(() => fireEvent.click(button)).not.toThrow()
    })

    test('captures recovery message with Sentry on try again', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      
      fireEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
      
      expect(Sentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
    })

    test('can recover and then error again', () => {
      const ToggleError = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Toggle error')
        }
        return <div>Content</div>
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ToggleError shouldThrow={false} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Content')).toBeInTheDocument()
      
      rerender(
        <ErrorBoundary>
          <ToggleError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })
  })

  describe('Custom Fallback', () => {
    test('renders custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom Error UI</div>}>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
    })

    test('custom fallback takes precedence over default', () => {
      render(
        <ErrorBoundary fallback={<div>Custom Error UI</div>}>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })

    test('custom fallback does not show try again button', () => {
      render(
        <ErrorBoundary fallback={<div>Custom Error UI</div>}>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      expect(screen.queryByRole('button', { name: 'Coba Lagi' })).not.toBeInTheDocument()
    })

    test('renders default error UI when fallback is null', () => {
      render(
        <ErrorBoundary fallback={null}>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      expect(screen.queryByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
    })
  })

  describe('Sentry Integration', () => {
    test('captures exception with Sentry', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            componentStack: expect.any(String)
          })
        })
      )
    })

    test('captures error with correct component stack', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            componentStack: expect.stringContaining('ErrorChild')
          })
        })
      )
    })

    test('does not capture when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ChildComponent />
        </ErrorBoundary>
      )
      expect(Sentry.captureException).not.toHaveBeenCalled()
    })
  })

  describe('Button Styles', () => {
    test('try again button has padding', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      const button = screen.getByRole('button', { name: 'Coba Lagi' })
      expect(button).toHaveAttribute('style', expect.stringContaining('padding'))
    })

    test('button is clickable', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      const button = screen.getByRole('button', { name: 'Coba Lagi' })
      expect(button).not.toHaveAttribute('disabled')
    })
  })

  describe('Layout Styles', () => {
    test('container has min height style', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      const container = screen.getByRole('button', { name: 'Coba Lagi' }).parentElement
      expect(container).toHaveStyle({ minHeight: '400px' })
    })

    test('container uses flex column', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      const container = screen.getByRole('button', { name: 'Coba Lagi' }).parentElement
      expect(container).toHaveStyle({
        display: 'flex',
        flexDirection: 'column'
      })
    })

    test('heading exists with correct text', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('message exists with correct text', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      expect(screen.getByText(/Silakan coba lagi nanti/i)).toBeInTheDocument()
    })

    test('container has padding', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      const container = screen.getByRole('button', { name: 'Coba Lagi' }).parentElement
      expect(container).toHaveStyle({ padding: '2rem' })
    })
  })

  describe('Edge Cases', () => {
    test('handles error without message', () => {
      render(
        <ErrorBoundary>
          <ErrorChild shouldThrow />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('handles non-Error thrown values', () => {
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

    test('handles null in children', () => {
      const NullChild = () => null
      
      render(
        <ErrorBoundary>
          <NullChild />
        </ErrorBoundary>
      )
      expect(screen.queryByText('Child Content')).not.toBeInTheDocument()
    })

    test('handles undefined in children', () => {
      const UndefinedChild = () => undefined
      
      render(
        <ErrorBoundary>
          <UndefinedChild />
        </ErrorBoundary>
      )
      expect(() => {
        expect(screen.queryByText('Child Content')).not.toBeInTheDocument()
      }).not.toThrow()
    })
  })

  describe('Static Methods', () => {
    test('getDerivedStateFromError returns error state', () => {
      const error = new Error('Test error')
      const state = ErrorBoundary.getDerivedStateFromError(error)
      expect(state).toEqual({
        hasError: true,
        error
      })
    })

    test('getDerivedStateFromError handles different error types', () => {
      const nonError = 'String error'
      const state = ErrorBoundary.getDerivedStateFromError(nonError)
      expect(state).toEqual({
        hasError: true,
        error: nonError
      })
    })
  })
})