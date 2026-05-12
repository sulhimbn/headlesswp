import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

const MockChildComponent = () => <div data-testid="child">Child Content</div>

const ErrorProneComponent = () => {
  throw new Error('Test error')
}

describe('ErrorBoundary Component', () => {
  describe('Renders children when no error', () => {
    test('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <MockChildComponent />
        </ErrorBoundary>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    test('renders multiple children correctly', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('First child')).toBeInTheDocument()
      expect(screen.getByText('Second child')).toBeInTheDocument()
    })

    test('renders without children', () => {
      render(<ErrorBoundary />)
      expect(screen.queryByTestId('child')).not.toBeInTheDocument()
    })
  })

  describe('Renders error UI when error occurs', () => {
    test('renders error UI when child throws an error', () => {
      render(
        <ErrorBoundary>
          <ErrorProneComponent />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(screen.getByText('Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.')).toBeInTheDocument()
    })

    test('renders retry button when error occurs', () => {
      render(
        <ErrorBoundary>
          <ErrorProneComponent />
        </ErrorBoundary>
      )
      expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
    })

    test('renders custom fallback when provided', () => {
      const CustomFallback = () => <div data-testid="custom-fallback">Custom Error</div>
      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ErrorProneComponent />
        </ErrorBoundary>
      )
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })
  })

  describe('componentDidCatch lifecycle', () => {
    test('componentDidCatch is called when error occurs', async () => {
      const Sentry = require('@sentry/nextjs')
      Sentry.captureException.mockClear()

      render(
        <ErrorBoundary>
          <ErrorProneComponent />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(Sentry.captureException).toHaveBeenCalled()
      })

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            componentStack: expect.any(String),
          }),
        })
      )
    })

    test('componentDidCatch captures error info', async () => {
      const Sentry = require('@sentry/nextjs')
      Sentry.captureException.mockClear()

      render(
        <ErrorBoundary>
          <ErrorProneComponent />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(Sentry.captureException).toHaveBeenCalled()
      })
    })
  })

  describe('Reset functionality', () => {
    test('resets error state when retry button is clicked', async () => {
      const Sentry = require('@sentry/nextjs')
      Sentry.captureException.mockClear()
      Sentry.captureMessage.mockClear()

      render(
        <ErrorBoundary>
          <ErrorProneComponent />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      expect(Sentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
    })

    test('sends recovery message to Sentry on retry', async () => {
      const Sentry = require('@sentry/nextjs')
      Sentry.captureException.mockClear()
      Sentry.captureMessage.mockClear()

      render(
        <ErrorBoundary>
          <ErrorProneComponent />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(Sentry.captureException).toHaveBeenCalled()
      })

      Sentry.captureException.mockClear()

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(Sentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
      })
    })

    test('allows multiple reset cycles', async () => {
      const Sentry = require('@sentry/nextjs')
      Sentry.captureException.mockClear()
      Sentry.captureMessage.mockClear()

      const ErrorTrigger = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Triggered error')
        }
        return <div>Normal content</div>
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ErrorTrigger shouldThrow={true} />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      })

      let retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      expect(Sentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
      Sentry.captureMessage.mockClear()

      rerender(
        <ErrorBoundary>
          <ErrorTrigger shouldThrow={true} />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      })

      retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      expect(Sentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
    })
  })

  describe('State management', () => {
    test('initial state has no error', () => {
      const { container } = render(
        <ErrorBoundary>
          <MockChildComponent />
        </ErrorBoundary>
      )
      expect(container).toHaveTextContent('Child Content')
    })

    test('state correctly tracks error', () => {
      render(
        <ErrorBoundary>
          <ErrorProneComponent />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    test('handles error with custom error message', () => {
      const CustomErrorComponent = () => {
        throw new Error('Custom error message')
      }

      render(
        <ErrorBoundary>
          <CustomErrorComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('handles multiple errors sequentially', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ErrorProneComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      rerender(
        <ErrorBoundary>
          <ErrorProneComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('renders with empty fallback prop', () => {
      render(
        <ErrorBoundary fallback={null}>
          <MockChildComponent />
        </ErrorBoundary>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })
  })
})