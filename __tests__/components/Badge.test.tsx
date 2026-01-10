import { render, screen } from '@testing-library/react'
import Badge from '@/components/ui/Badge'

describe('Badge Component', () => {
  describe('Rendering', () => {
    test('renders badge with text content', () => {
      render(<Badge>Category</Badge>)
      expect(screen.getByText('Category')).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<Badge className="custom-class">Category</Badge>)
      const badge = screen.getByText('Category')
      expect(badge).toHaveClass('custom-class')
    })

    test('renders with children as element', () => {
      const { container } = render(
        <Badge>
          <span>Icon</span> Category
        </Badge>
      )
      const badge = container.querySelector('span, a')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('Icon Category')
    })
  })

  describe('Variants', () => {
    test('renders default variant by default', () => {
      render(<Badge>Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass(
        'bg-[hsl(var(--color-secondary-dark))]',
        'text-[hsl(var(--color-text-secondary))]'
      )
    })

    test('renders category variant', () => {
      render(<Badge variant="category">Category</Badge>)
      const badge = screen.getByText('Category')
      expect(badge).toHaveClass(
        'bg-[hsl(var(--color-primary-light))]',
        'text-[hsl(var(--color-primary-dark))]',
        'font-medium'
      )
    })

    test('renders tag variant', () => {
      render(<Badge variant="tag">Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass(
        'bg-[hsl(var(--color-secondary-dark))]',
        'text-[hsl(var(--color-text-secondary))]'
      )
    })

    test('renders default variant explicitly', () => {
      render(<Badge variant="default">Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass(
        'bg-[hsl(var(--color-secondary-dark))]',
        'text-[hsl(var(--color-text-secondary))]'
      )
    })
  })

  describe('Link Behavior', () => {
    test('renders as span without href', () => {
      render(<Badge>Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge.tagName).toBe('SPAN')
    })

    test('renders as Link when href is provided', () => {
      render(<Badge href="/category/test">Category</Badge>)
      const badge = screen.getByText('Category')
      expect(badge.tagName).toBe('A')
      expect(badge).toHaveAttribute('href', '/category/test')
    })

    test('has hover effect when href is provided', () => {
      render(<Badge href="/tag/test">Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass('hover:opacity-80', 'transition-opacity', 'duration-[var(--transition-fast)]')
    })

    test('has focus ring when href is provided', () => {
      render(<Badge href="/category/test">Category</Badge>)
      const badge = screen.getByText('Category')
      expect(badge).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2',
        'focus:ring-[hsl(var(--color-primary))]'
      )
    })
  })

  describe('Base Styles', () => {
    test('has inline-flex class', () => {
      render(<Badge>Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass('inline-flex')
    })

    test('has items-center class', () => {
      render(<Badge>Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass('items-center')
    })

    test('has text-xs class', () => {
      render(<Badge>Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass('text-xs')
    })

    test('has px-2 py-1 padding classes', () => {
      render(<Badge>Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass('px-2', 'py-1')
    })

    test('has rounded-full class', () => {
      render(<Badge>Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass('rounded-full')
    })
  })

  describe('Design Tokens', () => {
    test('category variant uses primary light background token', () => {
      render(<Badge variant="category">Category</Badge>)
      const badge = screen.getByText('Category')
      expect(badge).toHaveClass('bg-[hsl(var(--color-primary-light))]')
    })

    test('category variant uses primary dark text token', () => {
      render(<Badge variant="category">Category</Badge>)
      const badge = screen.getByText('Category')
      expect(badge).toHaveClass('text-[hsl(var(--color-primary-dark))]')
    })

    test('tag variant uses secondary dark background token', () => {
      render(<Badge variant="tag">Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass('bg-[hsl(var(--color-secondary-dark))]')
    })

    test('tag variant uses text secondary token', () => {
      render(<Badge variant="tag">Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })

    test('hover transition uses fast token', () => {
      render(<Badge href="/test">Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass('duration-[var(--transition-fast)]')
    })

    test('focus ring uses primary token', () => {
      render(<Badge href="/test">Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass('focus:ring-[hsl(var(--color-primary))]')
    })
  })

  describe('Edge Cases', () => {
    test('renders with empty className', () => {
      render(<Badge className="">Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toBeInTheDocument()
      expect(badge).not.toHaveClass('custom-class')
    })

    test('renders with multiple custom classes', () => {
      render(<Badge className="class1 class2 class3">Tag</Badge>)
      const badge = screen.getByText('Tag')
      expect(badge).toHaveClass('class1', 'class2', 'class3')
    })

    test('renders with number as children (converted to string)', () => {
      render(<Badge>123</Badge>)
      const badge = screen.getByText('123')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Combined Props', () => {
    test('renders with category variant, href, and className', () => {
      render(
        <Badge variant="category" href="/category/test" className="custom-class">
          Test Category
        </Badge>
      )
      const badge = screen.getByText('Test Category')
      expect(badge.tagName).toBe('A')
      expect(badge).toHaveAttribute('href', '/category/test')
      expect(badge).toHaveClass(
        'bg-[hsl(var(--color-primary-light))]',
        'text-[hsl(var(--color-primary-dark))]',
        'custom-class'
      )
    })

    test('renders with tag variant and className', () => {
      render(
        <Badge variant="tag" className="custom-class">
          Test Tag
        </Badge>
      )
      const badge = screen.getByText('Test Tag')
      expect(badge.tagName).toBe('SPAN')
      expect(badge).toHaveClass(
        'bg-[hsl(var(--color-secondary-dark))]',
        'text-[hsl(var(--color-text-secondary))]',
        'custom-class'
      )
    })
  })
})
