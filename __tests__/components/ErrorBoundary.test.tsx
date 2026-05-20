'use client'

import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child Content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })

  it('should render default fallback when error occurs', async () => {
    const BadComponent = () => {
      throw new Error('Test error')
    }

    render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    )

    await new Promise(resolve => setTimeout(resolve, 100))
    expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
  })

  it('should render custom fallback when provided', async () => {
    const BadComponent = () => {
      throw new Error('Test error')
    }

    render(
      <ErrorBoundary fallback={<div>Custom Fallback</div>}>
        <BadComponent />
      </ErrorBoundary>
    )

    await new Promise(resolve => setTimeout(resolve, 100))
    expect(screen.getByText('Custom Fallback')).toBeInTheDocument()
  })
})