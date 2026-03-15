import { render, screen } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

describe('TableOfContents Component', () => {
  const mockHeadings: TocHeading[] = [
    { id: 'heading-1', text: 'Introduction', level: 2 },
    { id: 'heading-2', text: 'Getting Started', level: 2 },
    { id: 'heading-3', text: 'Sub Section', level: 3 },
  ]

  describe('Rendering', () => {
    test('renders table of contents with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('Sub Section')).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
    })

    test('renders navigation with proper aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Daftar Isi')
    })

    test('renders heading title', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    test('returns null when headings is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Link Behavior', () => {
    test('renders links with correct href', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', '#heading-1')
      expect(links[1]).toHaveAttribute('href', '#heading-2')
      expect(links[2]).toHaveAttribute('href', '#heading-3')
    })

    test('renders correct number of list items', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const items = screen.getAllByRole('listitem')
      expect(items).toHaveLength(3)
    })
  })

  describe('Indentation', () => {
    test('applies no indent for h2 headings', () => {
      render(<TableOfContents headings={[{ id: 'h2', text: 'H2', level: 2 }]} />)
      
      const link = screen.getByText('H2')
      expect(link).toHaveClass('pl-0')
    })

    test('applies pl-4 indent for h3 headings', () => {
      render(<TableOfContents headings={[{ id: 'h3', text: 'H3', level: 3 }]} />)
      
      const link = screen.getByText('H3')
      expect(link).toHaveClass('pl-4')
    })

    test('applies pl-8 indent for h4 headings', () => {
      render(<TableOfContents headings={[{ id: 'h4', text: 'H4', level: 4 }]} />)
      
      const link = screen.getByText('H4')
      expect(link).toHaveClass('pl-8')
    })

    test('applies pl-12 indent for h5 headings', () => {
      render(<TableOfContents headings={[{ id: 'h5', text: 'H5', level: 5 }]} />)
      
      const link = screen.getByText('H5')
      expect(link).toHaveClass('pl-12')
    })

    test('applies pl-16 indent for h6 headings', () => {
      render(<TableOfContents headings={[{ id: 'h6', text: 'H6', level: 6 }]} />)
      
      const link = screen.getByText('H6')
      expect(link).toHaveClass('pl-16')
    })

    test('applies default indent for unknown levels', () => {
      render(<TableOfContents headings={[{ id: 'unknown', text: 'Unknown', level: 7 }]} />)
      
      const link = screen.getByText('Unknown')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Styling', () => {
    test('has surface color background', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('has shadow-md', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('has rounded-lg border radius', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('heading text has primary color on hover', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })

    test('heading text uses secondary color', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      expect(link).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })

    test('heading text has transition-colors', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      expect(link).toHaveClass('transition-colors')
    })
  })

  describe('Accessibility', () => {
    test('title has correct font size', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const title = screen.getByText('Daftar Isi')
      expect(title).toHaveClass('text-sm', 'font-semibold')
    })

    test('links have text-sm size', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      expect(link).toHaveClass('text-sm')
    })
  })

  describe('Edge Cases', () => {
    test('renders with single heading', () => {
      render(<TableOfContents headings={[{ id: 'single', text: 'Single', level: 2 }]} />)
      
      expect(screen.getByText('Single')).toBeInTheDocument()
      const items = screen.getAllByRole('listitem')
      expect(items).toHaveLength(1)
    })

    test('renders with many headings', () => {
      const manyHeadings = Array.from({ length: 10 }, (_, i) => ({
        id: `heading-${i}`,
        text: `Heading ${i}`,
        level: 2,
      }))
      
      render(<TableOfContents headings={manyHeadings} />)
      
      const items = screen.getAllByRole('listitem')
      expect(items).toHaveLength(10)
    })
  })
})
