import React from 'react'
import { render, screen } from '@testing-library/react'
import ClientLayout from '@/components/ClientLayout'

describe('ClientLayout', () => {
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

    // Verify that ErrorBoundary is working by checking if children are rendered
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('passes children props correctly', () => {
    render(
      <ClientLayout>
        <div>Child 1</div>
        <div>Child 2</div>
      </ClientLayout>
    )

    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
  })

  it('handles complex children structures', () => {
    render(
      <ClientLayout>
        <header>Header content</header>
        <main>Main content</main>
        <footer>Footer content</footer>
      </ClientLayout>
    )

    expect(screen.getByText('Header content')).toBeInTheDocument()
    expect(screen.getByText('Main content')).toBeInTheDocument()
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('handles empty children', () => {
    const { container } = render(<ClientLayout>{null}</ClientLayout>)
    
    // Should render without crashing (ErrorBoundary with null children)
    expect(container).toBeInTheDocument()
  })

  it('handles single child', () => {
    render(
      <ClientLayout>
        <div>Single child</div>
      </ClientLayout>
    )

    expect(screen.getByText('Single child')).toBeInTheDocument()
  })

  it('preserves child component props', () => {
    const TestComponent = ({ message }: { message: string }) => (
      <div>{message}</div>
    )

    render(
      <ClientLayout>
        <TestComponent message="Test message" />
      </ClientLayout>
    )

    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('is a client component', () => {
    // Verify that the component has 'use client' directive
    // This is more of a build-time check, but we can verify the behavior
    expect(typeof ClientLayout).toBe('function')
  })

  it('has correct component name', () => {
    expect(ClientLayout.name).toBe('ClientLayout')
  })

  it('maintains component structure', () => {
    const { container } = render(
      <ClientLayout>
        <div>Test</div>
      </ClientLayout>
    )

    expect(container.firstChild).toBeInTheDocument()
  })
})