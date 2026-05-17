import { render, screen, act, fireEvent } from '@testing-library/react'
import * as Sentry from '@sentry/nextjs'

jest.mock('@sentry/nextjs', () => ({
  ...jest.requireActual('@sentry/nextjs'),
  captureException: jest.fn(() => 'event-id'),
  captureMessage: jest.fn(() => 'message-id'),
}))

import ErrorBoundary from '@/components/ErrorBoundary'
import React from 'react'

describe('ErrorBoundary', () => {
  let captureExceptionSpy: jest.Mock
  let captureMessageSpy: jest.Mock

  beforeEach(() => {
    captureExceptionSpy = Sentry.captureException as jest.Mock
    captureMessageSpy = Sentry.captureMessage as jest.Mock
    captureExceptionSpy.mockClear()
    captureMessageSpy.mockClear()
  })

  describe('Error Capture', () => {
    it('captures exceptions when component throws', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(captureExceptionSpy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            componentStack: expect.any(String),
          }),
        })
      )
    })

    it('captures error with correct message', () => {
      const errorMessage = 'Component crashed'
      const ThrowError = () => {
        throw new Error(errorMessage)
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(captureExceptionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: errorMessage,
        }),
        expect.any(Object)
      )
    })

    it('passes component stack to Sentry extra context', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(captureExceptionSpy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            componentStack: expect.any(String),
          }),
        })
      )
    })

    it('returns event ID on capture', () => {
      captureExceptionSpy.mockReturnValueOnce('test-event-id')

      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(captureExceptionSpy).toHaveReturnedWith('test-event-id')
    })
  })

  describe('Error State', () => {
    it('sets hasError state to true when error occurs', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const errorText = await screen.findByText('Terjadi kesalahan')
      expect(errorText).toBeInTheDocument()
    })

    it('displays fallback UI on error', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(await screen.findByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(screen.getByText('Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.')).toBeInTheDocument()
    })

    it('renders fallback prop when provided', async () => {
      const customFallback = <div data-testid="custom-fallback">Custom Error</div>
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(await screen.findByTestId('custom-fallback')).toBeInTheDocument()
    })
  })

  describe('Recovery', () => {
    it('displays retry button in fallback UI', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      await screen.findByText('Terjadi kesalahan')
      expect(screen.getByText('Coba Lagi')).toBeInTheDocument()
    })

    it('sends recovery message to Sentry on retry click', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      await screen.findByText('Terjadi kesalahan')

      const retryButton = screen.getByText('Coba Lagi')
      fireEvent.click(retryButton)

      await screen.findByText('Coba Lagi')

      expect(captureMessageSpy).toHaveBeenCalledWith('User recovered from error')
    })

    it('resets error state when retry button is clicked', async () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(await screen.findByText('Terjadi kesalahan')).toBeInTheDocument()

      const retryButton = screen.getByText('Coba Lagi')
      fireEvent.click(retryButton)

      const cobaLagi = await screen.findByText('Coba Lagi')
      expect(cobaLagi).toBeInTheDocument()
    })
  })

  describe('Render Behavior', () => {
    it('renders children when no error occurs', () => {
      const ChildComponent = () => <div>Child content</div>

      const { container } = render(
        <ErrorBoundary>
          <ChildComponent />
        </ErrorBoundary>
      )

      expect(container.textContent).toBe('Child content')
    })

    it('maintains initial state when no error occurs', () => {
      const ChildComponent = () => <div>Child content</div>

      render(
        <ErrorBoundary>
          <ChildComponent />
        </ErrorBoundary>
      )

      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
      expect(captureExceptionSpy).not.toHaveBeenCalled()
    })
  })

  describe('Props', () => {
    it('accepts children prop', () => {
      const children = <div>Test children</div>

      const { container } = render(
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      )

      expect(container.textContent).toBe('Test children')
    })

    it('accepts optional fallback prop', async () => {
      const fallback = <div>Custom fallback</div>
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary fallback={fallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom fallback')).toBeInTheDocument()
    })
  })
})