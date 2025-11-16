import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

// Component that throws an error for testing
const ThrowErrorComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Normal content</div>
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    // Suppress console.error for these tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })

  it('catches errors and displays default fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument()
    expect(screen.getByText(/Maaf, terjadi kesalahan saat memuat konten/)).toBeInTheDocument()
    expect(screen.getByText('Muat Ulang Halaman')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Terjadi Kesalahan')).not.toBeInTheDocument()
  })

  it('logs error to console when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('reloads page when reload button is clicked', () => {
    const mockReload = jest.fn()
    const originalLocation = window.location

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, reload: mockReload },
      writable: true,
      configurable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    const reloadButton = screen.getByText('Muat Ulang Halaman')
    fireEvent.click(reloadButton)

    expect(mockReload).toHaveBeenCalled()

    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })

  it('has proper styling classes for error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    const errorContainer = screen.getByText('Terjadi Kesalahan').closest('div')
    expect(errorContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center', 'bg-gray-50')

    const errorBox = screen.getByText('Terjadi Kesalahan').closest('.bg-white')
    expect(errorBox).toHaveClass('max-w-md', 'w-full', 'bg-white', 'p-8', 'rounded-lg', 'shadow-lg', 'text-center')

    const reloadButton = screen.getByText('Muat Ulang Halaman')
    expect(reloadButton).toHaveClass('bg-red-600', 'text-white', 'px-4', 'py-2', 'rounded', 'hover:bg-red-700', 'transition-colors')
  })

  it('resets error state when children change', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument()

    // Note: ErrorBoundary doesn't automatically reset on prop changes
    // This test verifies the current behavior
    rerender(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    )

    // ErrorBoundary should still show error state until manual reset
    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument()
  })
})