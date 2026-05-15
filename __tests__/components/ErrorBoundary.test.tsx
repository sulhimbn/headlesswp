import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ErrorBoundary from '@/components/ErrorBoundary'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

import * as Sentry from '@sentry/nextjs'

const mockSentry = Sentry as jest.Mocked<typeof Sentry>

describe('ErrorBoundary Component', () => {
  describe('Initial State (No Error)', () => {
    test('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-content">Child Content</div>
        </ErrorBoundary>
      )
      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    test('initial state has hasError as false', () => {
      const { container } = render(
        <ErrorBoundary>
          <div>Test</div>
        </ErrorBoundary>
      )
      expect(container.firstChild).toBeTruthy()
    })
  })

  describe('Error State Detection', () => {
    test('detects error via getDerivedStateFromError', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(container.querySelector('h2')).toHaveTextContent('Terjadi kesalahan')
    })

    test('componentDidCatch is called when child throws', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const ThrowError = () => {
        throw new Error('Test error for componentDidCatch')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockSentry.captureException).toHaveBeenCalled()
      consoleError.mockRestore()
    })
  })

  describe('Sentry Integration', () => {
    test('Sentry captureException is called with error and componentStack', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
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
      consoleError.mockRestore()
    })
  })

  describe('Fallback UI', () => {
    test('renders default fallback UI when error occurs', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const ThrowError = () => {
        throw new Error('Fallback test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('heading', { name: 'Terjadi kesalahan' })).toBeInTheDocument()
      expect(screen.getByText('Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
      consoleError.mockRestore()
    })
  })

  describe('Recovery', () => {
    test('recovery button resets error state', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Recovery test error')
        }
        return <div>Recovered content</div>
      }

      let shouldThrow = true

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('heading', { name: 'Terjadi kesalahan' })).toBeInTheDocument()

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      fireEvent.click(retryButton)

      expect(mockSentry.captureMessage).toHaveBeenCalledWith('User recovered from error')
      consoleError.mockRestore()
    })
  })

  describe('Custom Fallback Prop', () => {
    test('renders custom fallback when provided', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const ThrowError = () => {
        throw new Error('Custom fallback test')
      }

      const CustomFallback = () => (
        <div data-testid="custom-fallback">Custom Error Message</div>
      )

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Error Message')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Terjadi kesalahan' })).not.toBeInTheDocument()
      consoleError.mockRestore()
    })

    test('custom fallback takes precedence over default fallback', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const ThrowError = () => {
        throw new Error('Precedence test')
      }

      const CustomFallback = () => (
        <p>Custom fallback only</p>
      )

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom fallback only')).toBeInTheDocument()
      expect(screen.queryByText('Coba Lagi')).not.toBeInTheDocument()
      consoleError.mockRestore()
    })
  })
})