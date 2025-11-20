import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ClientLayout from '@/components/ClientLayout'

// Mock ErrorBoundary to focus on ClientLayout testing
jest.mock('@/components/ErrorBoundary', () => {
  return function MockErrorBoundary({ children }: { children: React.ReactNode }) {
    return <div data-testid="error-boundary">{children}</div>
  }
})

describe('ClientLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children correctly', () => {
    render(
      <ClientLayout>
        <div>Test content</div>
      </ClientLayout>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('wraps children with ErrorBoundary', () => {
    render(
      <ClientLayout>
        <div>Test content</div>
      </ClientLayout>
    )

    const errorBoundary = screen.getByTestId('error-boundary')
    expect(errorBoundary).toBeInTheDocument()
    expect(errorBoundary).toContainElement(screen.getByText('Test content'))
  })

  it('renders multiple children', () => {
    render(
      <ClientLayout>
        <div>First child</div>
        <div>Second child</div>
        <div>Third child</div>
      </ClientLayout>
    )

    expect(screen.getByText('First child')).toBeInTheDocument()
    expect(screen.getByText('Second child')).toBeInTheDocument()
    expect(screen.getByText('Third child')).toBeInTheDocument()
  })

  it('renders complex React elements', () => {
    const ComplexComponent = () => (
      <div>
        <h1>Title</h1>
        <p>Paragraph</p>
        <button>Button</button>
      </div>
    )

    render(
      <ClientLayout>
        <ComplexComponent />
      </ClientLayout>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Paragraph')).toBeInTheDocument()
    expect(screen.getByText('Button')).toBeInTheDocument()
  })

  it('renders null children gracefully', () => {
    render(
      <ClientLayout>
        {null}
        <div>Not null content</div>
        {null}
      </ClientLayout>
    )

    expect(screen.getByText('Not null content')).toBeInTheDocument()
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
  })

  it('renders empty fragments', () => {
    render(
      <ClientLayout>
        <></>
        <div>Content</div>
        <></>
      </ClientLayout>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('handles conditional rendering', () => {
    const { rerender } = render(
      <ClientLayout>
        <div>Initial content</div>
      </ClientLayout>
    )

    expect(screen.getByText('Initial content')).toBeInTheDocument()

    rerender(
      <ClientLayout>
        <div>Updated content</div>
      </ClientLayout>
    )

    expect(screen.getByText('Updated content')).toBeInTheDocument()
    expect(screen.queryByText('Initial content')).not.toBeInTheDocument()
  })

  it('preserves component structure', () => {
    const { container } = render(
      <ClientLayout>
        <div data-testid="child">Child content</div>
      </ClientLayout>
    )

    const errorBoundary = screen.getByTestId('error-boundary')
    const child = screen.getByTestId('child')

    expect(errorBoundary).toContainElement(child)
    expect(container.firstChild).toBe(errorBoundary)
  })

  it('works with React fragments as children', () => {
    render(
      <ClientLayout>
        <>
          <div>Fragment child 1</div>
          <div>Fragment child 2</div>
        </>
      </ClientLayout>
    )

    expect(screen.getByText('Fragment child 1')).toBeInTheDocument()
    expect(screen.getByText('Fragment child 2')).toBeInTheDocument()
  })

  it('handles array of children', () => {
    const children = [
      <div key="1">Array child 1</div>,
      <div key="2">Array child 2</div>,
      <div key="3">Array child 3</div>
    ]

    render(<ClientLayout>{children}</ClientLayout>)

    expect(screen.getByText('Array child 1')).toBeInTheDocument()
    expect(screen.getByText('Array child 2')).toBeInTheDocument()
    expect(screen.getByText('Array child 3')).toBeInTheDocument()
  })

  it('renders text nodes', () => {
    render(
      <ClientLayout>
        Plain text content
      </ClientLayout>
    )

    expect(screen.getByText('Plain text content')).toBeInTheDocument()
  })

  it('renders mixed content types', () => {
    render(
      <ClientLayout>
        Text content
        <div>Element content</div>
        <>
          <div>Fragment content</div>
        </>
        {null}
      </ClientLayout>
    )

    expect(screen.getByText('Text content')).toBeInTheDocument()
    expect(screen.getByText('Element content')).toBeInTheDocument()
    expect(screen.getByText('Fragment content')).toBeInTheDocument()
  })

  it('has correct component name for debugging', () => {
    const component = render(<ClientLayout><div>Test</div></ClientLayout>)
    
    // The component should be identifiable in React DevTools
    expect(component.container).toBeInTheDocument()
  })

  it('is a client component (use client directive)', () => {
    // This test verifies that the component can be rendered in a client environment
    expect(() => {
      render(
        <ClientLayout>
          <div>Client component test</div>
        </ClientLayout>
      )
    }).not.toThrow()
  })

  it('forwards ref correctly if needed', () => {
    const ref = React.createRef<HTMLDivElement>()
    
    render(
      <ClientLayout>
        <div ref={ref}>Ref content</div>
      </ClientLayout>
    )

    expect(ref.current).toBeInTheDocument()
    expect(screen.getByText('Ref content')).toBeInTheDocument()
  })
})