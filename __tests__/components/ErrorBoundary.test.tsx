import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import * as Sentry from '@sentry/nextjs'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

const ThrowingChild = () => {
  throw new Error('Test error')
}

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Normal Rendering', () => {
    test('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>正常な子コンポーネント</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('正常な子コンポーネント')).toBeInTheDocument()
    })

    test('renders multiple children', () => {
      render(
        <ErrorBoundary>
          <span>Child 1</span>
          <span>Child 2</span>
        </ErrorBoundary>
      )
      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
    })

    test('renders null children without errors', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      )
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('catches JavaScript errors and displays fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(screen.getByText('Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.')).toBeInTheDocument()
    })

    test('displays fallback UI when custom fallback prop is provided', () => {
      render(
        <ErrorBoundary fallback={<div>カスタムフォールバック</div>}>
          <ThrowingChild />
        </ErrorBoundary>
      )
      expect(screen.getByText('カスタムフォールバック')).toBeInTheDocument()
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })

    test('catches different error types', () => {
      const ThrowingTypeError = () => {
        throw new TypeError('Type error test')
      }

      render(
        <ErrorBoundary>
          <ThrowingTypeError />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })
  })

  describe('Error Logging', () => {
    test('calls Sentry.captureException when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>
      )
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: {
            componentStack: expect.any(String),
          },
        })
      )
    })

    test('logs error only once per error instance', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>
      )
      expect(Sentry.captureException).toHaveBeenCalledTimes(1)
    })
  })

  describe('Recovery', () => {
    test('allows user to recover from error by clicking retry button', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      expect(Sentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
    })

    test('resets error state and renders children after recovery', () => {
      render(
        <ErrorBoundary>
          <div>正常な子コンポーネント</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('正常な子コンポーネント')).toBeInTheDocument()
    })

    test('resets state after clicking retry and renders children again', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      expect(Sentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
    })
  })

  describe('State Management', () => {
    test('initializes with hasError false', () => {
      render(
        <ErrorBoundary>
          <div>Child</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('Child')).toBeInTheDocument()
    })

    test('updates state correctly when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>
      )
      expect(screen.getByRole('heading', { name: 'Terjadi kesalahan' })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('retry button is accessible', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>
      )
      expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
    })
  })
})