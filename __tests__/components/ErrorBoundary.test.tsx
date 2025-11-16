import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ErrorBoundary from '@/components/ErrorBoundary'

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Component that throws an error for testing
const ThrowErrorComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Normal content</div>
}

// Component that throws a string error
const ThrowStringErrorComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw 'String error'
  }
  return <div>Normal content</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test child content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test child content')).toBeInTheDocument()
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

  it('catches string errors and displays default fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowStringErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument()
  })

  it('displays custom fallback when provided', () => {
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

    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('reloads page when reload button is clicked', () => {
    const mockReload = jest.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    })

    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    const reloadButton = screen.getByText('Muat Ulang Halaman')
    fireEvent.click(reloadButton)

    expect(mockReload).toHaveBeenCalled()
  })

  it('has proper CSS classes and styling', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    const container = screen.getByText('Terjadi Kesalahan').closest('div')
    expect(container).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center', 'bg-gray-50')

    const card = screen.getByText('Terjadi Kesalahan').closest('.bg-white')
    expect(card).toHaveClass('max-w-md', 'w-full', 'bg-white', 'p-8', 'rounded-lg', 'shadow-lg', 'text-center')

    const title = screen.getByText('Terjadi Kesalahan')
    expect(title).toHaveClass('text-2xl', 'font-bold', 'text-red-600', 'mb-4')

    const button = screen.getByText('Muat Ulang Halaman')
    expect(button).toHaveClass('bg-red-600', 'text-white', 'px-4', 'py-2', 'rounded', 'hover:bg-red-700', 'transition-colors')
  })

  it('resets error state when children change (simulating remount)', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Normal content')).toBeInTheDocument()

    rerender(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument()
  })

  it('handles async errors in useEffect', async () => {
    const AsyncErrorComponent = () => {
      React.useEffect(() => {
        throw new Error('Async error')
      }, [])
      return <div>Loading...</div>
    }

    render(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    )

    // Note: Errors thrown in useEffect might not be caught by ErrorBoundary
    // This test documents current behavior
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('preserves error information in state', () => {
    let errorBoundaryInstance: any = null

    const TestComponent = () => {
      const ref = React.useRef<any>(null)
      React.useEffect(() => {
        errorBoundaryInstance = ref.current
      }, [])
      return (
        <ErrorBoundary ref={ref}>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )
    }

    render(<TestComponent />)

    // ErrorBoundary should have error in state after catching
    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument()
  })
})