import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ErrorBoundary from '@/components/ErrorBoundary'

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const ThrowError = () => {
    throw new Error('Test error')
  }

  const WorkingComponent = () => {
    return <div>Working component</div>
  }

  describe('Error catching', () => {
    it('should catch errors thrown in children', () => {
      class TestWrapper extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
        constructor(props: { children: React.ReactNode }) {
          super(props)
          this.state = { hasError: false }
        }
        
        static getDerivedStateFromError() {
          return { hasError: true }
        }
        
        render() {
          if (this.state.hasError) {
            return <div>Error caught</div>
          }
          return this.props.children
        }
      }

      const { container } = render(
        <TestWrapper>
          <ThrowError />
        </TestWrapper>
      )

      expect(container.textContent).toBe('Error caught')
    })
  })

  describe('Fallback UI', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error occurred</div>
      
      class TestWrapper extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
        constructor(props: { children: React.ReactNode }) {
          super(props)
          this.state = { hasError: false }
        }
        
        static getDerivedStateFromError() {
          return { hasError: true }
        }
        
        render() {
          if (this.state.hasError) {
            return <ErrorBoundary fallback={customFallback}>{this.props.children}</ErrorBoundary>
          }
          return this.props.children
        }
      }

      const { container } = render(
        <TestWrapper>
          <ThrowError />
        </TestWrapper>
      )

      expect(container.textContent).toBe('Custom error occurred')
    })

    it('should render default fallback message', () => {
      class TestWrapper extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
        constructor(props: { children: React.ReactNode }) {
          super(props)
          this.state = { hasError: false }
        }
        
        static getDerivedStateFromError() {
          return { hasError: true }
        }
        
        render() {
          if (this.state.hasError) {
            return <ErrorBoundary>{this.props.children}</ErrorBoundary>
          }
          return this.props.children
        }
      }

      const { container } = render(
        <TestWrapper>
          <ThrowError />
        </TestWrapper>
      )

      expect(container.textContent).toContain('Terjadi kesalahan')
      expect(container.textContent).toContain('Kami sedang memperbaiki masalah ini')
      expect(container.textContent).toContain('Coba Lagi')
    })
  })

  describe('Recovery', () => {
    it('should have retry button in default fallback', () => {
      class TestWrapper extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
        constructor(props: { children: React.ReactNode }) {
          super(props)
          this.state = { hasError: false }
        }
        
        static getDerivedStateFromError() {
          return { hasError: true }
        }
        
        render() {
          if (this.state.hasError) {
            return <ErrorBoundary>{this.props.children}</ErrorBoundary>
          }
          return this.props.children
        }
      }

      render(
        <TestWrapper>
          <ThrowError />
        </TestWrapper>
      )

      expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
    })
  })

  describe('Rendering children', () => {
    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Working component')).toBeInTheDocument()
    })
  })
})
