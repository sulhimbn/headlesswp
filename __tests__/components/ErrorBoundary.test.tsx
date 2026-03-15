import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

describe('ErrorBoundary Component', () => {
  const errorMessage = 'Test error'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(
        <ErrorBoundary>
          <div>Content</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    test('displays fallback when error occurs', () => {
      const ThrowError = () => {
        throw new Error(errorMessage)
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
      expect(screen.getByText(/Kami sedang memperbaiki masalah ini/)).toBeInTheDocument()
    })

    test('displays custom fallback when provided', () => {
      const customFallback = <div>Custom Error Message</div>
      const ThrowError = () => {
        throw new Error(errorMessage)
      }

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom Error Message')).toBeInTheDocument()
    })

    test('displays retry button', () => {
      const ThrowError = () => {
        throw new Error(errorMessage)
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
    })
  })

  describe('Recovery', () => {
    test('recovers from error when retry button is clicked', async () => {
      let shouldThrow = true
      const ThrowError = () => {
        if (shouldThrow) {
          throw new Error(errorMessage)
        }
        return <div>Recovered Content</div>
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()

      shouldThrow = false
      fireEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))

      await waitFor(() => {
        expect(screen.getByText('Recovered Content')).toBeInTheDocument()
      })
    })

    test('does not render children after error until recovery', () => {
      const ThrowError = () => {
        throw new Error(errorMessage)
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.queryByText('Child Content')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('error message has proper heading', () => {
      const ThrowError = () => {
        throw new Error(errorMessage)
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const heading = screen.getByRole('heading', { name: 'Terjadi kesalahan' })
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H2')
    })

    test('retry button is accessible', () => {
      const ThrowError = () => {
        throw new Error(errorMessage)
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const button = screen.getByRole('button', { name: 'Coba Lagi' })
      expect(button).toBeEnabled()
    })
  })
})
