import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Component } from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

function BrokenComponent() {
  throw new Error('Render error')
  return null
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', async () => {
    render(
      <ErrorBoundary>
        <div>Working content</div>
      </ErrorBoundary>
    )
    await waitFor(() => {
      expect(screen.getByText('Working content')).toBeInTheDocument()
    })
  })

  it('catches errors and shows fallback', async () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })
  })

  it('shows custom fallback when provided', async () => {
    const customFallback = <div data-testid="custom">Custom error</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <BrokenComponent />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(screen.getByTestId('custom')).toBeInTheDocument()
    })
  })
})