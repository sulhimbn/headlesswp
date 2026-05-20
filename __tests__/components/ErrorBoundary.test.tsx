import { render, screen, act, fireEvent } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import React from 'react'

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Normal content</div>
}

describe('ErrorBoundary Component', () => {
  describe('Happy Path - No Error', () => {
    test('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    test('renders children components correctly', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )
      expect(screen.getByText('Normal content')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('renders error message when child throws error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('renders fallback component when provided', () => {
      const Fallback = () => <div>Fallback content</div>
      render(
        <ErrorBoundary fallback={<Fallback />}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      expect(screen.getByText('Fallback content')).toBeInTheDocument()
    })

    test('allows recovery via retry button', async () => {
      let shouldThrow = true
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      
      shouldThrow = false
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )
      
      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      await act(async () => {
        fireEvent.click(retryButton)
      })
      expect(screen.getByText('Normal content')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('error message has proper heading structure', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Terjadi kesalahan')
    })

    test('retry button is present and has text', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' })
      expect(retryButton).toBeInTheDocument()
    })
  })
})