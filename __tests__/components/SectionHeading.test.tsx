import { render, screen } from '@testing-library/react'
import SectionHeading from '@/components/ui/SectionHeading'

describe('SectionHeading Component', () => {
  describe('Rendering', () => {
    test('renders heading with text content', () => {
      render(<SectionHeading>Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading', { name: 'Test Heading' })
      expect(heading).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<SectionHeading className="custom-class">Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('custom-class')
    })

    test('renders with children as element', () => {
      render(
        <SectionHeading>
          <span>Span Text</span>
        </SectionHeading>
      )
      const heading = screen.getByRole('heading')
      expect(heading).toHaveTextContent('Span Text')
    })

    test('renders with complex children', () => {
      render(
        <SectionHeading>
          Text <strong>Strong</strong> Text
        </SectionHeading>
      )
      const heading = screen.getByRole('heading')
      expect(heading).toHaveTextContent('Text Strong Text')
    })
  })

  describe('Levels', () => {
    test('renders h2 by default', () => {
      render(<SectionHeading>Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading', { level: 2, name: 'Test Heading' })
      expect(heading).toBeInTheDocument()
    })

    test('renders h1 level', () => {
      render(<SectionHeading level="h1">Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading', { level: 1, name: 'Test Heading' })
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H1')
    })

    test('renders h2 level', () => {
      render(<SectionHeading level="h2">Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading', { level: 2, name: 'Test Heading' })
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H2')
    })

    test('renders h3 level', () => {
      render(<SectionHeading level="h3">Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading', { level: 3, name: 'Test Heading' })
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H3')
    })
  })

  describe('Sizes', () => {
    test('renders lg size by default', () => {
      render(<SectionHeading>Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('text-[var(--text-3xl)]', 'font-bold')
    })

    test('renders lg size', () => {
      render(<SectionHeading size="lg">Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('text-[var(--text-3xl)]', 'font-bold')
    })

    test('renders md size', () => {
      render(<SectionHeading size="md">Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('text-[var(--text-2xl)]', 'font-semibold')
    })

    test('renders sm size', () => {
      render(<SectionHeading size="sm">Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('text-[var(--text-xl)]', 'font-semibold')
    })
  })

  describe('ID Attribute', () => {
    test('renders without id when not provided', () => {
      render(<SectionHeading>Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).not.toHaveAttribute('id')
    })

    test('renders with custom id', () => {
      render(<SectionHeading id="test-id">Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveAttribute('id', 'test-id')
    })

    test('id enables anchor linking', () => {
      render(<SectionHeading id="featured">Featured Posts</SectionHeading>)
      const heading = screen.getByRole('heading', { name: 'Featured Posts' })
      expect(heading).toHaveAttribute('id', 'featured')
    })
  })

  describe('Design Tokens', () => {
    test('uses design token for text color', () => {
      render(<SectionHeading>Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('text-[hsl(var(--color-text-primary))]')
    })

    test('uses design token for lg size', () => {
      render(<SectionHeading size="lg">Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('text-[var(--text-3xl)]')
    })

    test('uses design token for md size', () => {
      render(<SectionHeading size="md">Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('text-[var(--text-2xl)]')
    })

    test('uses design token for sm size', () => {
      render(<SectionHeading size="sm">Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('text-[var(--text-xl)]')
    })
  })

  describe('Edge Cases', () => {
    test('renders with empty className', () => {
      render(<SectionHeading className="">Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toBeInTheDocument()
    })

    test('renders with multiple custom classes', () => {
      render(<SectionHeading className="class1 class2 class3">Test Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('class1', 'class2', 'class3')
    })

    test('renders with whitespace-only content', () => {
      render(<SectionHeading>   </SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toBeInTheDocument()
    })

    test('renders with number as children (converted to string)', () => {
      render(<SectionHeading>123</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveTextContent('123')
    })
  })

  describe('Combined Props', () => {
    test('renders with level h1, size md, id, and className', () => {
      render(
        <SectionHeading level="h1" size="md" id="test-id" className="custom-class">
          Test Heading
        </SectionHeading>
      )
      const heading = screen.getByRole('heading')
      expect(heading.tagName).toBe('H1')
      expect(heading).toHaveClass('text-[var(--text-2xl)]', 'font-semibold', 'custom-class')
      expect(heading).toHaveAttribute('id', 'test-id')
    })

    test('renders with level h3, size sm, and id', () => {
      render(
        <SectionHeading level="h3" size="sm" id="small-heading">
          Small Heading
        </SectionHeading>
      )
      const heading = screen.getByRole('heading', { name: 'Small Heading' })
      expect(heading.tagName).toBe('H3')
      expect(heading).toHaveClass('text-[var(--text-xl)]', 'font-semibold')
      expect(heading).toHaveAttribute('id', 'small-heading')
    })
  })
})
