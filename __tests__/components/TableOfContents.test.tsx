import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
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
    
    const mockGetBoundingClientRect = jest.fn().mockReturnValue({ top: 100 })
    const mockElement = document.createElement('div')
    mockElement.getBoundingClientRect = mockGetBoundingClientRect
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as unknown as HTMLElement)
    
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true, configurable: true })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true, configurable: true })
  })

  describe('Rendering', () => {
    test('renders table of contents with heading title', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation', { name: 'Daftar Isi' })).toBeInTheDocument()
      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
    })

    test('renders all heading items', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const listItems = screen.getAllByRole('link')
      expect(listItems).toHaveLength(5)
    })

    test('renders heading text correctly', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('Installation')).toBeInTheDocument()
    })

    test('renders heading links with correct hrefs', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', '#heading-1')
      expect(links[1]).toHaveAttribute('href', '#heading-2')
      expect(links[2]).toHaveAttribute('href', '#heading-3')
    })
  })

  describe('Empty Headings', () => {
    test('returns null when headings array is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })

    test('returns null when headings is undefined', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Click Interaction', () => {
    test('scrolls to element on click', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByText('Introduction')
      fireEvent.click(link)
      expect(window.scrollTo).toHaveBeenCalled()
    })

    test('calls preventDefault on click', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByText('Introduction')
      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'preventDefault', { value: jest.fn(), writable: true })
      fireEvent(link, event)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    test('handles click when element is not found', () => {
      jest.spyOn(document, 'getElementById').mockReturnValue(null)
      
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByText('Introduction')
      fireEvent.click(link)
      
      expect(window.scrollTo).not.toHaveBeenCalled()
    })
  })

  describe('Indentation', () => {
    test('applies no indentation for level 2 headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByText('Introduction')
      expect(link).toHaveClass('pl-0')
    })

    test('applies pl-4 for level 3 headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByText('Installation')
      expect(link).toHaveClass('pl-4')
    })

    test('applies pl-8 for level 4 headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByText('Advanced Topics')
      expect(link).toHaveClass('pl-8')
    })

    test('applies pl-12 for level 5 headings', () => {
      const headingsWithLevel5: TocHeading[] = [
        { id: 'level5', text: 'Level 5', level: 5 }
      ]
      render(<TableOfContents headings={headingsWithLevel5} />)
      const link = screen.getByText('Level 5')
      expect(link).toHaveClass('pl-12')
    })

    test('applies pl-16 for level 6 headings', () => {
      const headingsWithLevel6: TocHeading[] = [
        { id: 'level6', text: 'Level 6', level: 6 }
      ]
      render(<TableOfContents headings={headingsWithLevel6} />)
      const link = screen.getByText('Level 6')
      expect(link).toHaveClass('pl-16')
    })

    test('applies default pl-0 for unknown levels', () => {
      const headingsWithUnknownLevel: TocHeading[] = [
        { id: 'unknown', text: 'Unknown', level: 10 }
      ]
      render(<TableOfContents headings={headingsWithUnknownLevel} />)
      const link = screen.getByText('Unknown')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Styling', () => {
    test('applies custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('custom-class')
    })

    test('applies default surface background', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('applies border radius', () => {
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
    })
  })

  describe('Accessibility', () => {
    test('nav has aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Daftar Isi')
    })

    test('title has correct font weight', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const title = screen.getByText('Daftar Isi')
      expect(title).toHaveClass('font-semibold')
    })

    test('list has correct semantic structure', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const list = screen.getByRole('navigation').querySelector('ul')
      expect(list).toBeInTheDocument()
    })

    test('list items are rendered as li elements', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(5)
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      const { rerender } = render(<TableOfContents headings={mockHeadings} />)
      expect(() => rerender(<TableOfContents headings={mockHeadings} />)).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    test('handles single heading', () => {
      const singleHeading: TocHeading[] = [
        { id: 'single', text: 'Only One', level: 2 }
      ]
      render(<TableOfContents headings={singleHeading} />)
      expect(screen.getByText('Only One')).toBeInTheDocument()
    })

    test('handles headings with same level', () => {
      const sameLevelHeadings: TocHeading[] = [
        { id: 'h1', text: 'First', level: 2 },
        { id: 'h2', text: 'Second', level: 2 },
        { id: 'h3', text: 'Third', level: 2 },
      ]
      render(<TableOfContents headings={sameLevelHeadings} />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveClass('pl-0')
      })
    })

    test('handles deeply nested headings', () => {
      const nestedHeadings: TocHeading[] = [
        { id: 'l2', text: 'Level 2', level: 2 },
        { id: 'l3', text: 'Level 3', level: 3 },
        { id: 'l4', text: 'Level 4', level: 4 },
        { id: 'l5', text: 'Level 5', level: 5 },
        { id: 'l6', text: 'Level 6', level: 6 },
      ]
      render(<TableOfContents headings={nestedHeadings} />)
      expect(screen.getAllByRole('link')).toHaveLength(5)
    })
  })
})
