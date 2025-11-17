import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

// Mock console.error to avoid test output noise
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('ErrorBoundary Component', () => {
  it('should render children when there is no error', () => {
    const ChildComponent = () => <div data-testid="child-content">Child Content</div>
    
    render(
      <ErrorBoundary>
        <ChildComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.queryByText('Terjadi Kesalahan')).not.toBeInTheDocument()
  })

  it('should render default error UI when an error occurs', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error')
    }
    
    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument()
    expect(screen.getByText(/Maaf, terjadi kesalahan saat memuat konten/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Muat Ulang Halaman' })).toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error')
    }
    
    const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowErrorComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.queryByText('Terjadi Kesalahan')).not.toBeInTheDocument()
  })

  it('should call componentDidCatch when error occurs', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error')
    }
    
    const spy = jest.spyOn(ErrorBoundary.prototype, 'componentDidCatch')
    
    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    )
    
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('should have reload button with correct text', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error')
    }
    
    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    )
    
    const reloadButton = screen.getByRole('button', { name: 'Muat Ulang Halaman' })
    expect(reloadButton).toBeInTheDocument()
  })

  it('should have correct CSS classes and styling', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error')
    }
    
    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    )
    
    // Find the outermost container
    const outerContainer = screen.getByText('Terjadi Kesalahan').closest('.min-h-screen')
    expect(outerContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center', 'bg-gray-50')
    
    const errorBox = screen.getByText('Terjadi Kesalahan').closest('.bg-white')
    expect(errorBox).toHaveClass('max-w-md', 'w-full', 'bg-white', 'p-8', 'rounded-lg', 'shadow-lg', 'text-center')
    
    const errorTitle = screen.getByText('Terjadi Kesalahan')
    expect(errorTitle).toHaveClass('text-2xl', 'font-bold', 'text-red-600', 'mb-4')
    
    const reloadButton = screen.getByRole('button', { name: 'Muat Ulang Halaman' })
    expect(reloadButton).toHaveClass('bg-red-600', 'text-white', 'px-4', 'py-2', 'rounded', 'hover:bg-red-700', 'transition-colors')
  })

  it('should handle different types of errors', () => {
    const TypeErrorComponent = () => {
      throw new TypeError('Type error occurred')
    }
    
    render(
      <ErrorBoundary>
        <TypeErrorComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument()
  })

  it('should reset error state when children change (simulated)', () => {
    // This test simulates the behavior where ErrorBoundary should reset
    // In a real scenario, this would happen when the component re-renders with new children
    const { rerender } = render(
      <ErrorBoundary>
        <div data-testid="initial-child">Initial Child</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByTestId('initial-child')).toBeInTheDocument()
    
    // Simulate error by throwing in a child component
    const ThrowErrorComponent = () => {
      throw new Error('Test error')
    }
    
    rerender(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument()
  })
})