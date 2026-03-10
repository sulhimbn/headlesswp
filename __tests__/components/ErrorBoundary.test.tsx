import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import * as Sentry from '@sentry/nextjs'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Normal rendering', () => {
    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    const ErrorThrowingComponent = () => {
      throw new Error('Test error')
    }

    it('should catch errors and show fallback', () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    it('should report error to Sentry', () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      )
      
      expect(Sentry.captureException).toHaveBeenCalled()
    })

    it('should show retry button', () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      )
      
      expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
    })

    it('should render custom fallback when provided', () => {
      const CustomFallback = () => <div>Custom error</div>
      
      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Custom error')).toBeInTheDocument()
    })
  })

  describe('Different error types', () => {
    it('should catch string errors', () => {
      const StringErrorComponent = () => {
        throw 'String error'
      }
      
      render(
        <ErrorBoundary>
          <StringErrorComponent />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })
  })

  describe('Class component behavior', () => {
    it('should be a class component', () => {
      const instance = new ErrorBoundary({ children: <div>Test</div> })
      expect(instance.state).toEqual({ hasError: false, error: null })
    })

    it('should have getDerivedStateFromError static method', () => {
      const newState = ErrorBoundary.getDerivedStateFromError(new Error('Test'))
      expect(newState).toEqual({
        hasError: true,
        error: expect.any(Error),
      })
    })
  })
})
