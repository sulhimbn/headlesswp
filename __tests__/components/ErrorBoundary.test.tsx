import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

const error = new Error('Test error')

const ThrowError = () => {
  throw error
}

const ErrorBoundaryWrapper = ({ children, fallback }: { children?: React.ReactNode; fallback?: React.ReactNode }) => (
  <ErrorBoundary fallback={fallback}>
    {children}
  </ErrorBoundary>
)

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn()
}))

describe('ErrorBoundary Component', () => {
  describe('Error Catching', () => {
    test('catches error and displays default fallback UI', () => {
      render(
        <ErrorBoundaryWrapper>
          <ThrowError />
        </ErrorBoundaryWrapper>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(screen.getByText(/Kami sedang memperbaiki masalah ini/)).toBeInTheDocument()
    })

    test('displays reset button in default fallback', () => {
      render(
        <ErrorBoundaryWrapper>
          <ThrowError />
        </ErrorBoundaryWrapper>
      )

      expect(screen.getByText('Coba Lagi')).toBeInTheDocument()
    })

    test('renders custom fallback when provided', () => {
      render(
        <ErrorBoundaryWrapper fallback={<div>Custom Error Fallback</div>}>
          <ThrowError />
        </ErrorBoundaryWrapper>
      )

      expect(screen.getByText('Custom Error Fallback')).toBeInTheDocument()
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })

    test('does not render children when error occurs', () => {
      render(
        <ErrorBoundaryWrapper>
          <ThrowError />
        </ErrorBoundaryWrapper>
      )

      expect(screen.queryByText(/Children content/)).not.toBeInTheDocument()
    })
  })

  describe('Reset Functionality', () => {
    test('reset button is clickable and re-renders children', () => {
      render(
        <ErrorBoundaryWrapper>
          <ThrowError />
        </ErrorBoundaryWrapper>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(screen.getByText('Coba Lagi')).toBeInTheDocument()

      const button = screen.getByText('Coba Lagi')
      expect(button.tagName).toBe('BUTTON')
    })

    test('reset button clears error state with valid children', () => {
      const { rerender } = render(
        <ErrorBoundaryWrapper>
          <div data-testid="initial">Initial</div>
        </ErrorBoundaryWrapper>
      )

      expect(screen.getByTestId('initial')).toBeInTheDocument()

      rerender(
        <ErrorBoundaryWrapper>
          <div data-testid="after-reset">After Reset</div>
        </ErrorBoundaryWrapper>
      )

      expect(screen.getByTestId('after-reset')).toBeInTheDocument()
    })
  })

  describe('Children Rendering', () => {
    test('renders children when no error', () => {
      render(
        <ErrorBoundaryWrapper>
          <div>Child Content</div>
        </ErrorBoundaryWrapper>
      )

      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    test('renders multiple children', () => {
      render(
        <ErrorBoundaryWrapper>
          <span>Child 1</span>
          <span>Child 2</span>
        </ErrorBoundaryWrapper>
      )

      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
    })

    test('renders nested children', () => {
      render(
        <ErrorBoundaryWrapper>
          <div>
            <span>Nested Child</span>
          </div>
        </ErrorBoundaryWrapper>
      )

      expect(screen.getByText('Nested Child')).toBeInTheDocument()
    })
  })

  describe('Error State Logging', () => {
    test('logs error to Sentry when error occurs', () => {
      const Sentry = require('@sentry/nextjs')

      render(
        <ErrorBoundaryWrapper>
          <ThrowError />
        </ErrorBoundaryWrapper>
      )

      expect(Sentry.captureException).toHaveBeenCalled()
    })
  })

  describe('Props Variants', () => {
    test('renders without fallback prop (uses default)', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('renders with null fallback (uses default)', () => {
      render(
        <ErrorBoundary fallback={null}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('renders with React element fallback', () => {
      render(
        <ErrorBoundary fallback={<span data-testid="custom-fallback">Custom</span>}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles error boundary with no children', () => {
      const { container } = render(<ErrorBoundary />)
      expect(container.firstChild).toBeNull()
    })

    test('handles multiple errors sequentially', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <div>Initial Content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Initial Content')).toBeInTheDocument()

      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })
  })
})