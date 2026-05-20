import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import React from 'react'

const ThrowError = () => {
  throw new Error('Test error')
}

const WorkingComponent = () => <div>Working</div>

describe('ErrorBoundary Component', () => {
  describe('Rendering - Basic Cases', () => {
    test('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    test('does not show error UI when children render successfully', () => {
      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      )
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    test('displays error message when child throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('displays retry message', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      expect(screen.getByText('Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.')).toBeInTheDocument()
    })

    test('displays retry button', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
    })
  })

  describe('Fallback Prop', () => {
    test('renders custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom Error</div>}>
          <ThrowError />
        </ErrorBoundary>
      )
      expect(screen.getByText('Custom Error')).toBeInTheDocument()
    })

    test('custom fallback overrides default error UI', () => {
      render(
        <ErrorBoundary fallback={<div>Custom Error</div>}>
          <ThrowError />
        </ErrorBoundary>
      )
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('error message is displayed', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      expect(screen.getByRole('heading', { name: 'Terjadi kesalahan' })).toBeInTheDocument()
    })

    test('retry button exists', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      const button = screen.getByRole('button', { name: 'Coba Lagi' })
      expect(button).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles non-Error exceptions', () => {
      const ThrowString = () => {
        throw 'String error'
      }
      render(
        <ErrorBoundary>
          <ThrowString />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('handles null error', () => {
      const ThrowNull = () => {
        throw null
      }
      render(
        <ErrorBoundary>
          <ThrowNull />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('handles undefined error', () => {
      const ThrowUndefined = () => {
        throw undefined
      }
      render(
        <ErrorBoundary>
          <ThrowUndefined />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('handles object error', () => {
      const ThrowObject = () => {
        throw { message: 'Object error' }
      }
      render(
        <ErrorBoundary>
          <ThrowObject />
        </ErrorBoundary>
      )
      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument()
    })

    test('renders working component without error', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      )
      expect(screen.getByText('Working')).toBeInTheDocument()
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument()
    })
  })
})