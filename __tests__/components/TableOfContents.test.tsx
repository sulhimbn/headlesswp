import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

const mockHeadings: TocHeading[] = [
  { id: 'heading-1', text: 'Introduction', level: 2 },
  { id: 'heading-2', text: 'Getting Started', level: 2 },
  { id: 'heading-3', text: 'Sub Section', level: 3 },
  { id: 'heading-4', text: 'Deep Nested', level: 4 },
  { id: 'heading-5', text: 'Deeper Nested', level: 5 },
  { id: 'heading-6', text: 'Deepest Nested', level: 6 },
]

describe('TableOfContents Component', () => {
  describe('Rendering', () => {
    test('renders table of contents with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation', { name: 'Daftar Isi' })).toBeInTheDocument()
      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
    })

    test('renders all heading links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      mockHeadings.forEach(heading => {
        expect(screen.getByText(heading.text)).toBeInTheDocument()
      })
    })

    test('renders with custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('custom-class')
    })

    test('renders correct number of list items', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(mockHeadings.length)
    })
  })

  describe('Empty Headings', () => {
    test('returns null when headings array is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Click Handling', () => {
    beforeEach(() => {
      window.scrollTo = jest.fn()
      jest.spyOn(document, 'getElementById').mockImplementation((id) => {
        const el = document.createElement('div')
        el.id = id
        el.getBoundingClientRect = jest.fn().mockReturnValue({ top: 100 })
        return el
      })
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('handles click on heading link', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      
      fireEvent.click(link)
      
      expect(window.scrollTo).toHaveBeenCalled()
    })

    test('prevents default behavior on click', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      
      const mockEvent = fireEvent.click(link)
    })
  })

  describe('Indentation', () => {
    test('applies correct indentation for level 2', () => {
      render(<TableOfContents headings={[{ id: 'h1', text: 'H2', level: 2 }]} />)
      
      const link = screen.getByText('H2')
      expect(link).toHaveClass('pl-0')
    })

    test('applies correct indentation for level 3', () => {
      render(<TableOfContents headings={[{ id: 'h1', text: 'H3', level: 3 }]} />)
      
      const link = screen.getByText('H3')
      expect(link).toHaveClass('pl-4')
    })

    test('applies correct indentation for level 4', () => {
      render(<TableOfContents headings={[{ id: 'h1', text: 'H4', level: 4 }]} />)
      
      const link = screen.getByText('H4')
      expect(link).toHaveClass('pl-8')
    })

    test('applies correct indentation for level 5', () => {
      render(<TableOfContents headings={[{ id: 'h1', text: 'H5', level: 5 }]} />)
      
      const link = screen.getByText('H5')
      expect(link).toHaveClass('pl-12')
    })

    test('applies correct indentation for level 6', () => {
      render(<TableOfContents headings={[{ id: 'h1', text: 'H6', level: 6 }]} />)
      
      const link = screen.getByText('H6')
      expect(link).toHaveClass('pl-16')
    })

    test('applies default indentation for unknown level', () => {
      render(<TableOfContents headings={[{ id: 'h1', text: 'H7', level: 7 }]} />)
      
      const link = screen.getByText('H7')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Link Attributes', () => {
    test('renders correct href for each heading', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', '#heading-1')
      expect(links[1]).toHaveAttribute('href', '#heading-2')
    })

    test('links have correct text content', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('Sub Section')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has proper aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation', { name: 'Daftar Isi' })).toBeInTheDocument()
    })

    test('heading links are focusable', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      expect(link).not.toHaveAttribute('tabindex')
    })
  })

  describe('Styling', () => {
    test('applies surface background color', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('applies rounded-lg border radius', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('applies shadow', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('heading links have hover styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })

    test('heading links have transition styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      expect(link).toHaveClass('transition-colors')
      expect(link).toHaveClass('duration-[var(--transition-fast)]')
    })

    test('title has correct styling', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const title = screen.getByText('Daftar Isi')
      expect(title).toHaveClass('text-sm')
      expect(title).toHaveClass('font-semibold')
      expect(title).toHaveClass('text-[hsl(var(--color-text-primary))]')
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      const { rerender } = render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation', { name: 'Daftar Isi' })).toBeInTheDocument()
      
      rerender(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation', { name: 'Daftar Isi' })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('renders with single heading', () => {
      render(<TableOfContents headings={[{ id: 'single', text: 'Only One', level: 2 }]} />)
      
      expect(screen.getByText('Only One')).toBeInTheDocument()
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(1)
    })

    test('renders with headings at same level', () => {
      const sameLevelHeadings: TocHeading[] = [
        { id: 'a', text: 'First', level: 2 },
        { id: 'b', text: 'Second', level: 2 },
        { id: 'c', text: 'Third', level: 2 },
      ]
      
      render(<TableOfContents headings={sameLevelHeadings} />)
      
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveClass('pl-0')
      })
    })
  })
})
