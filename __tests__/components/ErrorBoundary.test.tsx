import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import React from 'react'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

const ErrorComponent = () => {
  throw new Error('Test error')
}

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  test('catches and displays error state', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
  })

  test('renders retry button when error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    )
    expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
  })

  test('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ErrorComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
  })

  test('captures exception with Sentry', () => {
    const Sentry = require('@sentry/nextjs')
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    )
    expect(Sentry.captureException).toHaveBeenCalled()
  })

  test('recovers from error when retry button is clicked', () => {
    render(
      <ErrorBoundary>
        <div>Recovered content</div>
      </ErrorBoundary>
    )
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    )
    screen.getByRole('button', { name: 'Coba Lagi' }).click()
    expect(screen.getByText('Recovered content')).toBeInTheDocument()
  })
})
