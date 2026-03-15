import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

describe('TableOfContents Component', () => {
  const mockHeadings: TocHeading[] = [
    { id: 'heading-1', text: 'Introduction', level: 2 },
    { id: 'heading-2', text: 'Getting Started', level: 2 },
    { id: 'heading-3', text: 'Installation', level: 3 },
    { id: 'heading-4', text: 'Configuration', level: 3 },
    { id: 'heading-5', text: 'Advanced Topics', level: 4 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('renders table of contents with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Daftar Isi' })).toBeInTheDocument()
    })

    test('renders all heading links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      mockHeadings.forEach((heading) => {
        expect(screen.getByRole('link', { name: heading.text })).toBeInTheDocument()
      })
    })

    test('renders with custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
    })

    test('renders correct number of list items', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(mockHeadings.length)
    })
  })

  describe('Empty State', () => {
    test('returns null when headings array is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      
      expect(container.firstChild).toBeNull()
    })

    test('returns null when headings is an empty array (default)', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Navigation', () => {
    test('each link has correct href', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      mockHeadings.forEach((heading) => {
        const link = screen.getByRole('link', { name: heading.text })
        expect(link).toHaveAttribute('href', `#${heading.id}`)
      })
    })

    test('scrolls to element on click', () => {
      const mockElement = {
        getBoundingClientRect: () => ({ top: 200 }),
      }
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as unknown as HTMLElement)

      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByRole('link', { name: 'Introduction' })
      fireEvent.click(link)
      
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      })
    })

    test('does not scroll when element not found', () => {
      jest.spyOn(document, 'getElementById').mockReturnValue(null)

      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByRole('link', { name: 'Introduction' })
      fireEvent.click(link)
      
      expect(window.scrollTo).not.toHaveBeenCalled()
    })
  })

  describe('Indentation', () => {
    test('applies correct indentation for different heading levels', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const level2Link = screen.getByRole('link', { name: 'Introduction' })
      const level3Link = screen.getByRole('link', { name: 'Installation' })
      const level4Link = screen.getByRole('link', { name: 'Advanced Topics' })
      
      expect(level2Link).toHaveClass('pl-0')
      expect(level3Link).toHaveClass('pl-4')
      expect(level4Link).toHaveClass('pl-8')
    })

    test('handles level 5 headings', () => {
      const headingsWithLevel5: TocHeading[] = [
        { id: 'h5', text: 'Level 5', level: 5 },
      ]
      render(<TableOfContents headings={headingsWithLevel5} />)
      
      const link = screen.getByRole('link', { name: 'Level 5' })
      expect(link).toHaveClass('pl-12')
    })

    test('handles level 6 headings', () => {
      const headingsWithLevel6: TocHeading[] = [
        { id: 'h6', text: 'Level 6', level: 6 },
      ]
      render(<TableOfContents headings={headingsWithLevel6} />)
      
      const link = screen.getByRole('link', { name: 'Level 6' })
      expect(link).toHaveClass('pl-16')
    })

    test('handles unknown levels with default indent', () => {
      const headingsWithUnknownLevel: TocHeading[] = [
        { id: 'unknown', text: 'Unknown Level', level: 10 },
      ]
      render(<TableOfContents headings={headingsWithUnknownLevel} />)
      
      const link = screen.getByRole('link', { name: 'Unknown Level' })
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Accessibility', () => {
    test('has navigation landmark with aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Daftar Isi')
    })

    test('links are focusable', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).not.toHaveAttribute('tabIndex')
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      const headings: TocHeading[] = [{ id: 'test', text: 'Test', level: 2 }]
      const { rerender } = render(<TableOfContents headings={headings} />)
      
      expect(() => {
        rerender(<TableOfContents headings={headings} />)
      }).not.toThrow()
    })
  })
})
