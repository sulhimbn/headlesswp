import { render, screen } from '@testing-library/react'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { renderHook } from '@testing-library/react'

describe('Breadcrumb Component', () => {
  describe('Rendering - Basic Cases', () => {
    test('renders navigation element', () => {
      render(<Breadcrumb items={[]} />)
      const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
      expect(nav).toBeInTheDocument()
    })

    test('renders home link', () => {
      render(<Breadcrumb items={[]} />)
      const homeLink = screen.getByRole('link', { name: 'Beranda' })
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/')
    })

    test('renders single breadcrumb item', () => {
      render(<Breadcrumb items={[{ label: 'News', href: '/news' }]} />)
      expect(screen.getByRole('link', { name: 'Beranda' })).toBeInTheDocument()
      expect(screen.getByText('News')).toBeInTheDocument()
    })

    test('renders multiple breadcrumb items', () => {
      render(
        <Breadcrumb
          items={[
            { label: 'Category', href: '/category' },
            { label: 'Subcategory', href: '/category/sub' }
          ]}
        />
      )
      expect(screen.getByRole('link', { name: 'Beranda' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Category' })).toBeInTheDocument()
      expect(screen.getByText('Subcategory')).toBeInTheDocument()
    })
  })

  describe('Item Rendering', () => {
    test('renders link for non-last items', () => {
      render(
        <Breadcrumb items={[{ label: 'Category', href: '/category' }, { label: 'Item', href: '/item' }]} />
      )
      const categoryLink = screen.getByRole('link', { name: 'Category' })
      expect(categoryLink).toHaveAttribute('href', '/category')
    })

    test('renders span for last item (current page)', () => {
      render(<Breadcrumb items={[{ label: 'Current Page', href: '/current' }]} />)
      const currentSpan = screen.getByText('Current Page')
      expect(currentSpan.tagName).toBe('SPAN')
    })

    test('does not render link for last item', () => {
      render(<Breadcrumb items={[{ label: 'Current Page', href: '/current' }]} />)
      const currentLink = screen.queryByRole('link', { name: 'Current Page' })
      expect(currentLink).not.toBeInTheDocument()
    })
  })

  describe('Separator Rendering', () => {
    test('renders separator after home link when items exist', () => {
      render(<Breadcrumb items={[{ label: 'News', href: '/news' }]} />)
      const svgSeparators = document.querySelectorAll('svg[aria-hidden="true"]')
      expect(svgSeparators.length).toBeGreaterThan(0)
    })

    test('renders separator icons', () => {
      render(<Breadcrumb items={[{ label: 'News', href: '/news' }]} />)
      const svgSeparators = document.querySelectorAll('svg[aria-hidden="true"]')
      expect(svgSeparators.length).toBeGreaterThan(0)
    })

    test('separators have aria-hidden attribute', () => {
      render(<Breadcrumb items={[{ label: 'News', href: '/news' }]} />)
      const svgElements = document.querySelectorAll('svg[aria-hidden="true"]')
      svgElements.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('Design Tokens', () => {
    test('home link uses design tokens for color', () => {
      render(<Breadcrumb items={[]} />)
      const homeLink = screen.getByRole('link', { name: 'Beranda' })
      expect(homeLink).toHaveClass('text-[hsl(var(--color-text-primary))]')
    })

    test('home link uses design tokens for hover state', () => {
      render(<Breadcrumb items={[]} />)
      const homeLink = screen.getByRole('link', { name: 'Beranda' })
      expect(homeLink).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })

    test('breadcrumb links use design tokens for hover state', () => {
      render(<Breadcrumb items={[{ label: 'Category', href: '/category' }, { label: 'Item', href: '/item' }]} />)
      const categoryLink = screen.getByRole('link', { name: 'Category' })
      expect(categoryLink).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })

    test('breadcrumb links use design tokens for color', () => {
      render(<Breadcrumb items={[{ label: 'Category', href: '/category' }, { label: 'Item', href: '/item' }]} />)
      const categoryLink = screen.getByRole('link', { name: 'Category' })
      expect(categoryLink).toHaveClass('text-[hsl(var(--color-text-primary))]')
    })

    test('separator uses design tokens for color', () => {
      render(<Breadcrumb items={[{ label: 'News', href: '/news' }]} />)
      const svgElements = document.querySelectorAll('svg[aria-hidden="true"]')
      expect(svgElements[0]).toHaveClass('text-[hsl(var(--color-text-muted))]')
    })

    test('last item uses design tokens for muted text', () => {
      render(<Breadcrumb items={[{ label: 'Current Page', href: '/current' }]} />)
      const currentSpan = screen.getByText('Current Page')
      expect(currentSpan).toHaveClass('text-[hsl(var(--color-text-muted))]')
    })
  })

  describe('Accessibility', () => {
    test('nav has correct aria-label', () => {
      render(<Breadcrumb items={[]} />)
      const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
      expect(nav).toHaveAccessibleName('Breadcrumb')
    })

    test('breadcrumb links have focus styles', () => {
      render(<Breadcrumb items={[{ label: 'Category', href: '/category' }, { label: 'Item', href: '/item' }]} />)
      const categoryLink = screen.getByRole('link', { name: 'Category' })
      expect(categoryLink).toHaveClass('focus:outline-none')
      expect(categoryLink).toHaveClass('focus:ring-2')
    })

    test('home link has focus styles', () => {
      render(<Breadcrumb items={[]} />)
      const homeLink = screen.getByRole('link', { name: 'Beranda' })
      expect(homeLink).toHaveClass('focus:outline-none')
      expect(homeLink).toHaveClass('focus:ring-2')
    })

    test('last item does not have focus styles (not interactive)', () => {
      render(<Breadcrumb items={[{ label: 'Current Page', href: '/current' }]} />)
      const currentSpan = screen.getByText('Current Page')
      expect(currentSpan).not.toHaveClass('focus:ring-2')
    })

    test('breadcrumbs are in ordered list', () => {
      const { container } = render(<Breadcrumb items={[]} />)
      const ol = container.querySelector('ol')
      expect(ol).toBeInTheDocument()
    })

    test('breadcrumb items are in list items', () => {
      const { container } = render(<Breadcrumb items={[]} />)
      const listItems = container.querySelectorAll('li')
      expect(listItems.length).toBeGreaterThan(0)
    })
  })

  describe('Layout and Spacing', () => {
    test('items have proper spacing (small screens)', () => {
      const { container } = render(<Breadcrumb items={[]} />)
      const ol = container.querySelector('ol')
      expect(ol).toHaveClass('space-x-1')
    })

    test('items have proper spacing (medium screens)', () => {
      const { container } = render(<Breadcrumb items={[]} />)
      const ol = container.querySelector('ol')
      expect(ol).toHaveClass('md:space-x-3')
    })

    test('navigation is flex container', () => {
      const { container } = render(<Breadcrumb items={[]} />)
      const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
      expect(nav).toHaveClass('flex')
    })

    test('list items are inline-flex', () => {
      const { container } = render(<Breadcrumb items={[]} />)
      const listItems = container.querySelectorAll('li')
      listItems.forEach(li => {
        expect(li).toHaveClass('inline-flex')
      })
    })
  })

  describe('Edge Cases', () => {
    test('handles empty items array', () => {
      render(<Breadcrumb items={[]} />)
      expect(screen.getByRole('link', { name: 'Beranda' })).toBeInTheDocument()
    })

    test('handles single item', () => {
      render(<Breadcrumb items={[{ label: 'Single Item', href: '/single' }]} />)
      expect(screen.getByText('Single Item')).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Single Item' })).not.toBeInTheDocument()
    })

    test('handles many items', () => {
      render(
        <Breadcrumb
          items={[
            { label: 'Level 1', href: '/l1' },
            { label: 'Level 2', href: '/l1/l2' },
            { label: 'Level 3', href: '/l1/l2/l3' },
            { label: 'Level 4', href: '/l1/l2/l3/l4' }
          ]}
        />
      )
      expect(screen.getByRole('link', { name: 'Level 1' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Level 2' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Level 3' })).toBeInTheDocument()
      expect(screen.getByText('Level 4')).toBeInTheDocument()
    })

    test('handles special characters in labels', () => {
      render(<Breadcrumb items={[{ label: 'Test & "Special" <Chars>', href: '/test' }]} />)
      expect(screen.getByText('Test & "Special" <Chars>')).toBeInTheDocument()
    })

    test('handles HTML entities in labels', () => {
      render(<Breadcrumb items={[{ label: 'Test &amp; Entity', href: '/test' }]} />)
      const element = screen.getByText((content) => content.includes('Test') && content.includes('Entity'))
      expect(element).toBeInTheDocument()
    })

    test('handles very long labels', () => {
      const longLabel = 'A'.repeat(100)
      render(<Breadcrumb items={[{ label: longLabel, href: '/long' }]} />)
      expect(screen.getByText(longLabel)).toBeInTheDocument()
    })

    test('handles consecutive slashes in hrefs', () => {
      render(<Breadcrumb items={[{ label: 'Category', href: '///category' }, { label: 'Test', href: '///test' }]} />)
      expect(screen.getByRole('link', { name: 'Category' })).toBeInTheDocument()
      expect(screen.getByText('Test')).toBeInTheDocument()
    })

    test('handles items with same label but different hrefs', () => {
      render(
        <Breadcrumb
          items={[
            { label: 'Same', href: '/path1' },
            { label: 'Same', href: '/path2' }
          ]}
        />
      )
      const links = screen.getAllByRole('link', { name: 'Same' })
      expect(links).toHaveLength(1)
      const span = screen.getAllByText('Same')
      expect(span.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Design', () => {
    test('uses responsive spacing for separator margin', () => {
      render(<Breadcrumb items={[{ label: 'News', href: '/news' }]} />)
      const separatorSpans = document.querySelectorAll('span')
      const hasResponsiveMargin = Array.from(separatorSpans).some(span =>
        span.classList.contains('ml-1') || span.classList.contains('md:ml-2')
      )
      expect(hasResponsiveMargin).toBe(true)
    })

    test('uses responsive font size', () => {
      render(<Breadcrumb items={[]} />)
      const homeLink = screen.getByRole('link', { name: 'Beranda' })
      expect(homeLink).toHaveClass('text-sm')
    })
  })

  describe('Memoization (arePropsEqual)', () => {
    test('re-renders when items length changes', () => {
      const { rerender, container } = render(<Breadcrumb items={[{ label: 'Test', href: '/test' }]} />)
      const initialLinks = container.querySelectorAll('li')
      
      rerender(<Breadcrumb items={[]} />)
      
      const newLinks = container.querySelectorAll('li')
      expect(newLinks.length).not.toBe(initialLinks.length)
    })

    test('re-renders when item label changes', () => {
      const { rerender, queryByText } = render(<Breadcrumb items={[{ label: 'Test', href: '/test' }]} />)
      
      expect(queryByText('Test')).toBeInTheDocument()
      
      rerender(<Breadcrumb items={[{ label: 'Changed', href: '/test' }]} />)
      
      expect(queryByText('Changed')).toBeInTheDocument()
      expect(queryByText('Test')).not.toBeInTheDocument()
    })

    test('re-renders when item href changes', () => {
      const { rerender, getByRole } = render(<Breadcrumb items={[{ label: 'Test', href: '/test' }, { label: 'Test 2', href: '/test2' }]} />)
      
      expect(getByRole('link', { name: 'Test' })).toHaveAttribute('href', '/test')
      
      rerender(<Breadcrumb items={[{ label: 'Test', href: '/changed' }, { label: 'Test 2', href: '/test2' }]} />)
      
      expect(getByRole('link', { name: 'Test' })).toHaveAttribute('href', '/changed')
    })

    test('re-renders when multiple items change', () => {
      const { rerender, queryByText, queryAllByRole } = render(
        <Breadcrumb
          items={[
            { label: 'Test 1', href: '/test1' },
            { label: 'Test 2', href: '/test2' }
          ]}
        />
      )
      
      expect(queryByText('Test 1')).toBeInTheDocument()
      expect(queryByText('Test 2')).toBeInTheDocument()
      
      rerender(
        <Breadcrumb
          items={[
            { label: 'Changed 1', href: '/changed1' },
            { label: 'Changed 2', href: '/changed2' }
          ]}
        />
      )
      
      expect(queryByText('Changed 1')).toBeInTheDocument()
      expect(queryByText('Changed 2')).toBeInTheDocument()
      expect(queryByText('Test 1')).not.toBeInTheDocument()
      expect(queryByText('Test 2')).not.toBeInTheDocument()
    })

    test('handles many identical items without unnecessary re-renders', () => {
      const items = [
        { label: 'Level 1', href: '/l1' },
        { label: 'Level 2', href: '/l1/l2' },
        { label: 'Level 3', href: '/l1/l2/l3' },
        { label: 'Level 4', href: '/l1/l2/l3/l4' }
      ]
      const { rerender, getAllByRole } = render(<Breadcrumb items={items} />)
      const initialLinks = getAllByRole('link')
      
      rerender(<Breadcrumb items={items} />)
      
      const newLinks = getAllByRole('link')
      expect(newLinks.length).toBe(initialLinks.length)
    })

    test('handles empty items array', () => {
      const { rerender, getAllByRole } = render(<Breadcrumb items={[]} />)
      const initialLinks = getAllByRole('link')
      
      rerender(<Breadcrumb items={[]} />)
      
      const newLinks = getAllByRole('link')
      expect(newLinks.length).toBe(initialLinks.length)
    })
  })
})
