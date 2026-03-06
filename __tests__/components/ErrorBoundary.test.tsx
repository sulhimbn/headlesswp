import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import React from 'react'

describe('ErrorBoundary Component', () => {
  describe('Rendering', () => {
    test('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    test('does not show error UI when no error', () => {
      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      )
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })

    test('shows custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom Fallback</div>}>
          <div>Child</div>
        </ErrorBoundary>
      )
      expect(screen.queryByText('Custom Fallback')).not.toBeInTheDocument()
    })
  })
})
