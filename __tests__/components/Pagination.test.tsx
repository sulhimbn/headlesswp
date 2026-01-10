import { render, screen } from '@testing-library/react'
import Pagination from '@/components/ui/Pagination'

describe('Pagination Component', () => {
  const basePath = '/berita'

  describe('Rendering - Basic Cases', () => {
    test('renders navigation element', () => {
      render(<Pagination currentPage={1} totalPages={5} basePath={basePath} />)
      const nav = screen.getByRole('navigation', { name: 'Pagination' })
      expect(nav).toBeInTheDocument()
    })

    test('renders single page when totalPages is 1', () => {
      render(<Pagination currentPage={1} totalPages={1} basePath={basePath} />)
      const pageLink = screen.getByRole('link', { name: 'Page 1' })
      expect(pageLink).toBeInTheDocument()
    })

    test('renders all pages when totalPages <= MAX_VISIBLE_PAGES', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath={basePath} />)
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByRole('link', { name: `Page ${i}` })).toBeInTheDocument()
      }
    })
  })

  describe('Previous Button', () => {
    test('shows previous button when not on first page', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath={basePath} />)
      const prevButton = screen.getByRole('link', { name: 'Previous page' })
      expect(prevButton).toBeInTheDocument()
    })

    test('does not show previous button on first page', () => {
      render(<Pagination currentPage={1} totalPages={5} basePath={basePath} />)
      const prevButton = screen.queryByRole('link', { name: 'Previous page' })
      expect(prevButton).not.toBeInTheDocument()
    })

    test('previous button has correct href', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />)
      const prevButton = screen.getByRole('link', { name: 'Previous page' })
      expect(prevButton).toHaveAttribute('href', '/berita?page=2')
    })

    test('previous button has correct aria-label', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath={basePath} />)
      const prevButton = screen.getByRole('link', { name: 'Previous page' })
      expect(prevButton).toHaveAccessibleName('Previous page')
    })
  })

  describe('Next Button', () => {
    test('shows next button when not on last page', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath={basePath} />)
      const nextButton = screen.getByRole('link', { name: 'Next page' })
      expect(nextButton).toBeInTheDocument()
    })

    test('does not show next button on last page', () => {
      render(<Pagination currentPage={5} totalPages={5} basePath={basePath} />)
      const nextButton = screen.queryByRole('link', { name: 'Next page' })
      expect(nextButton).not.toBeInTheDocument()
    })

    test('next button has correct href', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />)
      const nextButton = screen.getByRole('link', { name: 'Next page' })
      expect(nextButton).toHaveAttribute('href', '/berita?page=4')
    })

    test('next button has correct aria-label', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath={basePath} />)
      const nextButton = screen.getByRole('link', { name: 'Next page' })
      expect(nextButton).toHaveAccessibleName('Next page')
    })
  })

  describe('Page Links', () => {
    test('highlights current page', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />)
      const currentPageLink = screen.getByRole('link', { name: 'Page 3' })
      expect(currentPageLink).toHaveClass('bg-[hsl(var(--color-primary))]')
      expect(currentPageLink).toHaveClass('text-white')
    })

    test('non-current pages have inactive styling', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />)
      const otherPageLink = screen.getByRole('link', { name: 'Page 1' })
      expect(otherPageLink).toHaveClass('bg-[hsl(var(--color-surface))]')
      expect(otherPageLink).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })

    test('current page has aria-current attribute', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />)
      const currentPageLink = screen.getByRole('link', { name: 'Page 3' })
      expect(currentPageLink).toHaveAttribute('aria-current', 'page')
    })

    test('non-current pages do not have aria-current attribute', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />)
      const otherPageLink = screen.getByRole('link', { name: 'Page 1' })
      expect(otherPageLink).not.toHaveAttribute('aria-current')
    })
  })

  describe('Ellipsis Display - Many Pages', () => {
    test('shows ellipsis when currentPage is near start (page 1-3)', () => {
      render(<Pagination currentPage={1} totalPages={10} basePath={basePath} />)
      const ellipsis = screen.getByText('...')
      expect(ellipsis).toBeInTheDocument()
    })

    test('shows ellipsis when currentPage is near end (last 3 pages)', () => {
      render(<Pagination currentPage={10} totalPages={10} basePath={basePath} />)
      const ellipsis = screen.getByText('...')
      expect(ellipsis).toBeInTheDocument()
    })

    test('shows both ellipses when currentPage is in middle', () => {
      render(<Pagination currentPage={5} totalPages={10} basePath={basePath} />)
      const ellipses = screen.getAllByText('...')
      expect(ellipses).toHaveLength(2)
    })

    test('does not show ellipsis when totalPages <= MAX_VISIBLE_PAGES', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />)
      const ellipsis = screen.queryByText('...')
      expect(ellipsis).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases - First Page', () => {
    test('first page shows correct pagination', () => {
      render(<Pagination currentPage={1} totalPages={10} basePath={basePath} />)
      
      expect(screen.queryByRole('link', { name: 'Previous page' })).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 2' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 3' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 4' })).toBeInTheDocument()
      expect(screen.getByText('...')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 10' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Next page' })).toBeInTheDocument()
    })

    test('first page has aria-current on page 1', () => {
      render(<Pagination currentPage={1} totalPages={10} basePath={basePath} />)
      const page1 = screen.getByRole('link', { name: 'Page 1' })
      expect(page1).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('Edge Cases - Last Page', () => {
    test('last page shows correct pagination', () => {
      render(<Pagination currentPage={10} totalPages={10} basePath={basePath} />)
      
      expect(screen.getByRole('link', { name: 'Previous page' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByText('...')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 7' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 8' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 9' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 10' })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Next page' })).not.toBeInTheDocument()
    })

    test('last page has aria-current on page 10', () => {
      render(<Pagination currentPage={10} totalPages={10} basePath={basePath} />)
      const page10 = screen.getByRole('link', { name: 'Page 10' })
      expect(page10).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('Edge Cases - Middle Pages', () => {
    test('middle page shows correct pagination', () => {
      render(<Pagination currentPage={5} totalPages={10} basePath={basePath} />)
      
      expect(screen.getByRole('link', { name: 'Previous page' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Next page' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getAllByText('...')).toHaveLength(2)
      expect(screen.getByRole('link', { name: 'Page 4' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 5' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 6' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 10' })).toBeInTheDocument()
    })
  })

  describe('Edge Cases - Page 2 and Page 3', () => {
    test('page 2 shows correct pagination', () => {
      render(<Pagination currentPage={2} totalPages={10} basePath={basePath} />)
      
      expect(screen.getByRole('link', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 2' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 3' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 4' })).toBeInTheDocument()
      expect(screen.getByText('...')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 10' })).toBeInTheDocument()
    })

    test('page 3 shows correct pagination', () => {
      render(<Pagination currentPage={3} totalPages={10} basePath={basePath} />)
      
      expect(screen.getByRole('link', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 2' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 3' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 4' })).toBeInTheDocument()
      expect(screen.getByText('...')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 10' })).toBeInTheDocument()
    })
  })

  describe('Edge Cases - Page 8 and Page 9 (Near Last)', () => {
    test('page 8 shows correct pagination', () => {
      render(<Pagination currentPage={8} totalPages={10} basePath={basePath} />)
      
      expect(screen.getByRole('link', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByText('...')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 7' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 8' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 9' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 10' })).toBeInTheDocument()
    })

    test('page 9 shows correct pagination', () => {
      render(<Pagination currentPage={9} totalPages={10} basePath={basePath} />)
      
      expect(screen.getByRole('link', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByText('...')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 7' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 8' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 9' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 10' })).toBeInTheDocument()
    })
  })

  describe('Design Tokens', () => {
    test('uses design tokens for current page background', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />)
      const currentPageLink = screen.getByRole('link', { name: 'Page 3' })
      expect(currentPageLink).toHaveClass('bg-[hsl(var(--color-primary))]')
    })

    test('uses design tokens for border radius', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />)
      const pageLink = screen.getByRole('link', { name: 'Page 3' })
      expect(pageLink).toHaveClass('rounded-[var(--radius-md)]')
    })

    test('uses design tokens for transition', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />)
      const pageLink = screen.getByRole('link', { name: 'Page 3' })
      expect(pageLink).toHaveClass('transition-colors')
      expect(pageLink).toHaveClass('duration-[var(--transition-fast)]')
    })
  })

  describe('Accessibility', () => {
    test('nav element has correct aria-label', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />)
      const nav = screen.getByRole('navigation', { name: 'Pagination' })
      expect(nav).toHaveAccessibleName('Pagination')
    })

    test('page links have correct aria-label', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />)
      const pageLink = screen.getByRole('link', { name: 'Page 3' })
      expect(pageLink).toHaveAccessibleName('Page 3')
    })

    test('focus management - all interactive elements are focusable', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveClass('focus:outline-none')
        expect(link).toHaveClass('focus:ring-2')
      })
    })
  })

  describe('Edge Cases - Extreme Values', () => {
    test('handles single page (totalPages = 1)', () => {
      render(<Pagination currentPage={1} totalPages={1} basePath={basePath} />)
      expect(screen.getByRole('link', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Previous page' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Next page' })).not.toBeInTheDocument()
    })

    test('handles two pages', () => {
      render(<Pagination currentPage={1} totalPages={2} basePath={basePath} />)
      expect(screen.getByRole('link', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 2' })).toBeInTheDocument()
    })

    test('handles very large totalPages', () => {
      render(<Pagination currentPage={50} totalPages={100} basePath={basePath} />)
      expect(screen.getByRole('link', { name: 'Page 50' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Page 100' })).toBeInTheDocument()
      expect(screen.getAllByText('...')).toHaveLength(2)
    })
  })
})
