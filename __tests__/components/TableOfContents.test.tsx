import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

describe('TableOfContents Component', () => {
  const mockHeadings: TocHeading[] = [
    { id: 'introduction', text: 'Introduction', level: 2 },
    { id: 'getting-started', text: 'Getting Started', level: 2 },
    { id: 'installation', text: 'Installation', level: 3 },
    { id: 'configuration', text: 'Configuration', level: 3 },
    { id: 'advanced', text: 'Advanced Usage', level: 2 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    window.scrollTo = jest.fn()
  })

  describe('Rendering', () => {
    test('renders TableOfContents component with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation', { name: /daftar isi/i })).toBeInTheDocument()
    })

    test('renders all heading links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)
    })

    test('renders heading text correctly', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('Installation')).toBeInTheDocument()
    })

    test('renders section title', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('heading', { name: /daftar isi/i })).toBeInTheDocument()
    })

    test('applies custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-toc" />)
      const nav = screen.getByRole('navigation', { name: /daftar isi/i })
      expect(nav).toHaveClass('custom-toc')
    })

    test('renders correct href for each heading', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', '#introduction')
      expect(links[1]).toHaveAttribute('href', '#getting-started')
    })
  })

  describe('Indentation', () => {
    test('applies no indent for level 2 headings', () => {
      const level2Headings: TocHeading[] = [{ id: 'h2', text: 'H2 Heading', level: 2 }]
      const { container } = render(<TableOfContents headings={level2Headings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-0')
    })

    test('applies pl-4 indent for level 3 headings', () => {
      const level3Headings: TocHeading[] = [{ id: 'h3', text: 'H3 Heading', level: 3 }]
      const { container } = render(<TableOfContents headings={level3Headings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-4')
    })

    test('applies pl-8 indent for level 4 headings', () => {
      const level4Headings: TocHeading[] = [{ id: 'h4', text: 'H4 Heading', level: 4 }]
      const { container } = render(<TableOfContents headings={level4Headings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-8')
    })

    test('applies pl-12 indent for level 5 headings', () => {
      const level5Headings: TocHeading[] = [{ id: 'h5', text: 'H5 Heading', level: 5 }]
      const { container } = render(<TableOfContents headings={level5Headings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-12')
    })

    test('applies pl-16 indent for level 6 headings', () => {
      const level6Headings: TocHeading[] = [{ id: 'h6', text: 'H6 Heading', level: 6 }]
      const { container } = render(<TableOfContents headings={level6Headings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-16')
    })

    test('defaults to pl-0 for unknown levels', () => {
      const unknownLevelHeadings: TocHeading[] = [{ id: 'unknown', text: 'Unknown', level: 1 }]
      const { container } = render(<TableOfContents headings={unknownLevelHeadings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Click Navigation', () => {
    test('calls scrollTo when element exists in DOM', () => {
      const element = document.createElement('div')
      element.id = 'introduction'
      document.body.appendChild(element)

      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByText('Introduction')
      fireEvent.click(link)

      expect(window.scrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth'
      })

      document.body.removeChild(element)
    })

    test('does not throw when element does not exist', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByText('Introduction')
      
      expect(() => {
        fireEvent.click(link)
      }).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    test('has correct aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation', { name: /daftar isi/i })).toBeInTheDocument()
    })

    test('links are present in the document', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    test('returns null when headings is empty array', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })

    test('renders deeply nested headings', () => {
      const nestedHeadings: TocHeading[] = [
        { id: 'level-2', text: 'Level 2', level: 2 },
        { id: 'level-3', text: 'Level 3', level: 3 },
        { id: 'level-4', text: 'Level 4', level: 4 },
        { id: 'level-5', text: 'Level 5', level: 5 },
        { id: 'level-6', text: 'Level 6', level: 6 },
      ]
      render(<TableOfContents headings={nestedHeadings} />)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)
    })

    test('renders single heading', () => {
      const singleHeading: TocHeading[] = [{ id: 'single', text: 'Single Heading', level: 2 }]
      render(<TableOfContents headings={singleHeading} />)
      expect(screen.getByText('Single Heading')).toBeInTheDocument()
    })

    test('handles headings with special characters in text', () => {
      const specialCharsHeadings: TocHeading[] = [
        { id: 'special-chars', text: 'Heading with <special> & "quotes"', level: 2 },
      ]
      render(<TableOfContents headings={specialCharsHeadings} />)
      expect(screen.getByText('Heading with <special> & "quotes"')).toBeInTheDocument()
    })

    test('handles headings with very long text', () => {
      const longTextHeading: TocHeading[] = [
        { id: 'long-text', text: 'A'.repeat(200), level: 2 },
      ]
      render(<TableOfContents headings={longTextHeading} />)
      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument()
    })

    test('handles duplicate heading IDs', () => {
      const duplicateIds: TocHeading[] = [
        { id: 'duplicate', text: 'First', level: 2 },
        { id: 'duplicate', text: 'Second', level: 2 },
      ]
      const { container } = render(<TableOfContents headings={duplicateIds} />)
      const links = container.querySelectorAll('a')
      expect(links[0]).toHaveAttribute('href', '#duplicate')
      expect(links[1]).toHaveAttribute('href', '#duplicate')
    })
  })

  describe('Styling', () => {
    test('applies surface background color', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('applies rounded corners', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('applies shadow', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('applies hover styles to links', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })

    test('applies transition styles', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('transition-colors')
    })
  })
})