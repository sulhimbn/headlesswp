import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ClientLayout from '@/components/ClientLayout'

// Mock ErrorBoundary to isolate testing
jest.mock('@/components/ErrorBoundary', () => {
  return function MockErrorBoundary({ children }: { children: React.ReactNode }) {
    return <div data-testid="error-boundary">{children}</div>
  }
})

describe('ClientLayout', () => {
  it('should render children correctly', () => {
    render(
      <ClientLayout>
        <div>Test Content</div>
      </ClientLayout>
    )
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should wrap children in ErrorBoundary', () => {
    render(
      <ClientLayout>
        <div>Test Content</div>
      </ClientLayout>
    )
    
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should handle multiple children', () => {
    render(
      <ClientLayout>
        <div>First Child</div>
        <div>Second Child</div>
        <div>Third Child</div>
      </ClientLayout>
    )
    
    expect(screen.getByText('First Child')).toBeInTheDocument()
    expect(screen.getByText('Second Child')).toBeInTheDocument()
    expect(screen.getByText('Third Child')).toBeInTheDocument()
  })

  it('should handle empty children', () => {
    const { container } = render(<ClientLayout />)
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should handle null children', () => {
    const { container } = render(<ClientLayout>{null}</ClientLayout>)
    
    expect(container.firstChild).toBeInTheDocument()
  })
})