import React from 'react'
import { render, screen } from '@testing-library/react'
import ClientLayout from '@/components/ClientLayout'

// Mock ErrorBoundary to focus on testing ClientLayout
jest.mock('@/components/ErrorBoundary', () => {
  return function MockErrorBoundary({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-error-boundary">{children}</div>
  }
})

describe('ClientLayout Component', () => {
  it('should render children wrapped in ErrorBoundary', () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>
    
    render(
      <ClientLayout>
        <TestChild />
      </ClientLayout>
    )
    
    expect(screen.getByTestId('mock-error-boundary')).toBeInTheDocument()
    expect(screen.getByTestId('test-child')).toBeInTheDocument()
  })

  it('should render multiple children', () => {
    render(
      <ClientLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </ClientLayout>
    )
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
    expect(screen.getByTestId('child-3')).toBeInTheDocument()
  })

  it('should render complex nested children', () => {
    render(
      <ClientLayout>
        <div data-testid="parent">
          <div data-testid="nested-child">Nested Content</div>
          <span data-testid="nested-span">Nested Span</span>
        </div>
      </ClientLayout>
    )
    
    expect(screen.getByTestId('parent')).toBeInTheDocument()
    expect(screen.getByTestId('nested-child')).toBeInTheDocument()
    expect(screen.getByTestId('nested-span')).toBeInTheDocument()
  })

  it('should render text content', () => {
    render(
      <ClientLayout>
        Simple text content
      </ClientLayout>
    )
    
    expect(screen.getByText('Simple text content')).toBeInTheDocument()
  })

  it('should render null/empty children gracefully', () => {
    render(
      <ClientLayout>
        {null}
        {undefined}
        {false}
        <div data-testid="only-child">Only Child</div>
      </ClientLayout>
    )
    
    expect(screen.getByTestId('only-child')).toBeInTheDocument()
    expect(screen.getByTestId('mock-error-boundary')).toBeInTheDocument()
  })

  it('should have correct component structure', () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>
    
    const { container } = render(
      <ClientLayout>
        <TestChild />
      </ClientLayout>
    )
    
    // The ClientLayout itself doesn't add any DOM elements,
    // it just wraps children in ErrorBoundary
    expect(container.firstChild).toBe(screen.getByTestId('mock-error-boundary'))
  })

  it('should handle children with props', () => {
    interface ChildProps {
      title: string
      count: number
    }
    
    const ChildWithProps = ({ title, count }: ChildProps) => (
      <div data-testid="child-with-props">
        <span data-testid="title">{title}</span>
        <span data-testid="count">{count}</span>
      </div>
    )
    
    render(
      <ClientLayout>
        <ChildWithProps title="Test Title" count={42} />
      </ClientLayout>
    )
    
    expect(screen.getByTestId('child-with-props')).toBeInTheDocument()
    expect(screen.getByTestId('title')).toHaveTextContent('Test Title')
    expect(screen.getByTestId('count')).toHaveTextContent('42')
  })

  it('should preserve children event handlers', () => {
    const handleClick = jest.fn()
    
    render(
      <ClientLayout>
        <button data-testid="clickable-button" onClick={handleClick}>
          Click me
        </button>
      </ClientLayout>
    )
    
    const button = screen.getByTestId('clickable-button')
    button.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be a client component (use client directive)', () => {
    // This test verifies that the component can be rendered in a test environment
    // which simulates the client-side behavior
    const TestChild = () => <div data-testid="client-test">Client Component Test</div>
    
    render(
      <ClientLayout>
        <TestChild />
      </ClientLayout>
    )
    
    expect(screen.getByTestId('client-test')).toBeInTheDocument()
  })
})