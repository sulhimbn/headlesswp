import { render, screen } from '@testing-library/react'
import EmptyState from '@/components/ui/EmptyState'

describe('EmptyState Component', () => {
  describe('Rendering - Basic Cases', () => {
    test('renders title', () => {
      render(<EmptyState title="No results found" />)
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })

    test('renders with status role', () => {
      const { container } = render(<EmptyState title="No results" />)
      const statusElement = container.querySelector('[role="status"]')
      expect(statusElement).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      const { container } = render(<EmptyState title="No results" className="custom-class" />)
      const statusElement = container.querySelector('[role="status"]')
      expect(statusElement).toHaveClass('custom-class')
    })
  })

  describe('Description Rendering', () => {
    test('renders description when provided', () => {
      render(<EmptyState title="No results" description="Try adjusting your search" />)
      expect(screen.getByText('Try adjusting your search')).toBeInTheDocument()
    })

    test('does not render description when not provided', () => {
      render(<EmptyState title="No results" />)
      const statusElement = screen.getByRole('status')
      expect(statusElement).not.toHaveTextContent(/adjusting/i)
    })

    test('renders long description correctly', () => {
      const longDescription = 'This is a very long description that should be displayed correctly in the empty state component.'
      render(<EmptyState title="No results" description={longDescription} />)
      expect(screen.getByText(longDescription)).toBeInTheDocument()
    })
  })

  describe('Icon Rendering', () => {
    test('renders icon when provided', () => {
      const TestIcon = () => <svg data-testid="test-icon" />
      render(<EmptyState title="No results" icon={<TestIcon />} />)
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    test('icon has aria-hidden attribute', () => {
      const TestIcon = () => <svg data-testid="test-icon" />
      const { container } = render(<EmptyState title="No results" icon={<TestIcon />} />)
      const iconContainer = container.querySelector('[aria-hidden="true"]')
      expect(iconContainer).toBeInTheDocument()
      expect(iconContainer).toContainElement(screen.getByTestId('test-icon'))
    })

    test('does not render icon when not provided', () => {
      const { container } = render(<EmptyState title="No results" />)
      const iconContainer = container.querySelector('[aria-hidden="true"]')
      expect(iconContainer).not.toBeInTheDocument()
    })
  })

  describe('Action Button', () => {
    test('renders action link when provided', () => {
      render(<EmptyState title="No results" action={{ label: 'Go Home', href: '/' }} />)
      const actionLink = screen.getByRole('link', { name: 'Go Home' })
      expect(actionLink).toBeInTheDocument()
      expect(actionLink).toHaveAttribute('href', '/')
    })

    test('action link has correct styling', () => {
      render(<EmptyState title="No results" action={{ label: 'Go Home', href: '/' }} />)
      const actionLink = screen.getByRole('link', { name: 'Go Home' })
      expect(actionLink).toHaveClass('bg-[hsl(var(--color-primary))]')
      expect(actionLink).toHaveClass('text-white')
    })

    test('does not render action link when not provided', () => {
      render(<EmptyState title="No results" />)
      const actionLink = screen.queryByRole('link')
      expect(actionLink).not.toBeInTheDocument()
    })

    test('action link has focus styles', () => {
      render(<EmptyState title="No results" action={{ label: 'Go Home', href: '/' }} />)
      const actionLink = screen.getByRole('link', { name: 'Go Home' })
      expect(actionLink).toHaveClass('focus:outline-none')
      expect(actionLink).toHaveClass('focus:ring-2')
    })
  })

  describe('Design Tokens', () => {
    test('title uses design tokens for color', () => {
      const { container } = render(<EmptyState title="No results" />)
      const title = container.querySelector('h3')
      expect(title).toHaveClass('text-[hsl(var(--color-text-primary))]')
    })

    test('description uses design tokens for color', () => {
      render(<EmptyState title="No results" description="Test description" />)
      const description = screen.getByText('Test description')
      expect(description).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })

    test('icon uses design tokens for color', () => {
      const TestIcon = () => <svg data-testid="test-icon" />
      const { container } = render(<EmptyState title="No results" icon={<TestIcon />} />)
      const iconContainer = container.querySelector('[aria-hidden="true"]')
      expect(iconContainer).toHaveClass('text-[hsl(var(--color-text-muted))]')
    })

    test('action link uses design tokens for hover state', () => {
      render(<EmptyState title="No results" action={{ label: 'Go Home', href: '/' }} />)
      const actionLink = screen.getByRole('link', { name: 'Go Home' })
      expect(actionLink).toHaveClass('hover:bg-[hsl(var(--color-primary-dark))]')
    })

    test('action link uses design tokens for border radius', () => {
      render(<EmptyState title="No results" action={{ label: 'Go Home', href: '/' }} />)
      const actionLink = screen.getByRole('link', { name: 'Go Home' })
      expect(actionLink).toHaveClass('rounded-[var(--radius-md)]')
    })
  })

  describe('Accessibility', () => {
    test('has role="status"', () => {
      render(<EmptyState title="No results" />)
      const statusElement = screen.getByRole('status')
      expect(statusElement).toBeInTheDocument()
    })

    test('icon is hidden from screen readers', () => {
      const TestIcon = () => <svg data-testid="test-icon" />
      const { container } = render(<EmptyState title="No results" icon={<TestIcon />} />)
      const iconContainer = container.querySelector('[aria-hidden="true"]')
      expect(iconContainer).toHaveAttribute('aria-hidden', 'true')
    })

    test('action link is keyboard accessible', () => {
      render(<EmptyState title="No results" action={{ label: 'Go Home', href: '/' }} />)
      const actionLink = screen.getByRole('link', { name: 'Go Home' })
      expect(actionLink).toHaveAttribute('href')
    })
  })

  describe('Layout and Spacing', () => {
    test('has proper padding', () => {
      const { container } = render(<EmptyState title="No results" />)
      const statusElement = container.querySelector('[role="status"]')
      expect(statusElement).toHaveClass('py-12')
      expect(statusElement).toHaveClass('px-4')
    })

    test('is centered', () => {
      const { container } = render(<EmptyState title="No results" />)
      const statusElement = container.querySelector('[role="status"]')
      expect(statusElement).toHaveClass('text-center')
    })

    test('icon has proper margin', () => {
      const TestIcon = () => <svg data-testid="test-icon" />
      const { container } = render(<EmptyState title="No results" icon={<TestIcon />} />)
      const iconContainer = container.querySelector('[aria-hidden="true"]')
      expect(iconContainer).toHaveClass('mb-4')
    })

    test('title has proper margin', () => {
      const { container } = render(<EmptyState title="No results" />)
      const title = container.querySelector('h3')
      expect(title).toHaveClass('mb-2')
    })

    test('description has proper margin', () => {
      render(<EmptyState title="No results" description="Test description" />)
      const description = screen.getByText('Test description')
      expect(description).toHaveClass('mb-4')
    })
  })

  describe('Edge Cases', () => {
    test('handles empty description string', () => {
      render(<EmptyState title="No results" description="" />)
      expect(screen.getByText('No results')).toBeInTheDocument()
    })

    test('handles special characters in title', () => {
      render(<EmptyState title="No results & special <chars>" />)
      expect(screen.getByText((content) => content.includes('No results') && content.includes('special') && content.includes('chars'))).toBeInTheDocument()
    })

    test('handles special characters in description', () => {
      render(<EmptyState title="No results" description="Test & description with 'quotes'" />)
      expect(screen.getByText("Test & description with 'quotes'")).toBeInTheDocument()
    })

    test('handles very long title', () => {
      const longTitle = 'A'.repeat(200)
      render(<EmptyState title={longTitle} />)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    test('handles all props combined', () => {
      const TestIcon = () => <svg data-testid="test-icon" />
      render(
        <EmptyState
          title="No results found"
          description="Try adjusting your search or filters"
          icon={<TestIcon />}
          action={{ label: 'Go Home', href: '/' }}
          className="extra-class"
        />
      )

      expect(screen.getByText('No results found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument()
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Go Home' })).toBeInTheDocument()
    })

    test('handles action with special characters in label', () => {
      render(<EmptyState title="No results" action={{ label: 'Go & Explore', href: '/' }} />)
      expect(screen.getByRole('link', { name: 'Go & Explore' })).toBeInTheDocument()
    })
  })
})
