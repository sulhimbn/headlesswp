import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

describe('ErrorBoundary Component', () => {
  describe('Normal Rendering', () => {
    test('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child Content</div>
        </ErrorBoundary>
      )
      
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    test('renders multiple children', () => {
      render(
        <ErrorBoundary>
          <span>First</span>
          <span>Second</span>
        </ErrorBoundary>
      )
      
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
    })

    test('renders nested children', () => {
      render(
        <ErrorBoundary>
          <div>
            <span>Nested</span>
          </div>
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Nested')).toBeInTheDocument()
    })
  })
})
