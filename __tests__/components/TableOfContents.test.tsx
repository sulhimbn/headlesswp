import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

const mockScrollTo = jest.fn()

Object.defineProperty(window, 'scrollTo', {
  value: mockScrollTo,
  writable: true,
})

Object.defineProperty(window, 'pageYOffset', {
  value: 100,
  writable: true,
})

const mockGetElementById = jest.fn()

describe('TableOfContents Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetElementById.mockReturnValue({
      getBoundingClientRect: jest.fn().mockReturnValue({ top: 100 }),
    })
    document.getElementById = mockGetElementById
  })

  const mockHeadings: TocHeading[] = [
    { id: 'heading-1', text: 'Introduction', level: 2 },
    { id: 'heading-2', text: 'Main Content', level: 2 },
    { id: 'heading-3', text: 'Sub Section', level: 3 },
    { id: 'heading-4', text: 'Details', level: 4 },
  ]

  describe('Rendering', () => {
    test('renders navigation element', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
    })

    test('renders with correct aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Daftar Isi')
    })

    test('renders heading title', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
    })

    test('renders all heading links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      mockHeadings.forEach(heading => {
        expect(screen.getByText(heading.text)).toBeInTheDocument()
      })
    })

    test('renders as unordered list', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const ul = container.querySelector('ul')
      expect(ul).toBeInTheDocument()
    })

    test('renders each heading as list item', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const listItems = container.querySelectorAll('li')
      expect(listItems).toHaveLength(mockHeadings.length)
    })

    test('renders with custom className', () => {
      const { container } = render(
        <TableOfContents headings={mockHeadings} className="custom-class" />
      )
      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('custom-class')
    })

    test('renders links with correct hrefs', () => {
      render(<TableOfContents headings={mockHeadings} />)
      mockHeadings.forEach(heading => {
        const link = screen.getByText(heading.text)
        expect(link).toHaveAttribute('href', `#${heading.id}`)
      })
    })
  })

  describe('Empty State', () => {
    test('returns null when headings array is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })

    test('returns null when headings is undefined', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Click Handling', () => {
    test('calls scrollTo on click', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const firstLink = screen.getByText('Introduction')
      fireEvent.click(firstLink)
      
      expect(mockScrollTo).toHaveBeenCalled()
    })

    test('handles smooth scrolling when element exists', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const firstLink = screen.getByText('Introduction')
      fireEvent.click(firstLink)
      
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth'
      })
    })
  })

  describe('Indentation', () => {
    test('applies no indent for level 2 headings', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const level2Links = container.querySelectorAll('a')
      
      const level2Link = Array.from(level2Links).find(
        link => link.textContent === 'Introduction'
      )
      expect(level2Link).toHaveClass('pl-0')
    })

    test('applies pl-4 indent for level 3 headings', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      
      const link = Array.from(container.querySelectorAll('a')).find(
        link => link.textContent === 'Sub Section'
      )
      expect(link).toHaveClass('pl-4')
    })

    test('applies pl-8 indent for level 4 headings', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const link = Array.from(container.querySelectorAll('a')).find(
        link => link.textContent === 'Details'
      )
      expect(link).toHaveClass('pl-8')
    })

    test('applies pl-12 indent for level 5 headings', () => {
      const level5Headings: TocHeading[] = [
        { id: 'h5', text: 'Level 5', level: 5 },
      ]
      const { container } = render(<TableOfContents headings={level5Headings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-12')
    })

    test('applies pl-16 indent for level 6 headings', () => {
      const level6Headings: TocHeading[] = [
        { id: 'h6', text: 'Level 6', level: 6 },
      ]
      const { container } = render(<TableOfContents headings={level6Headings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-16')
    })

    test('defaults to pl-0 for unknown levels', () => {
      const unknownLevelHeadings: TocHeading[] = [
        { id: 'unknown', text: 'Unknown', level: 7 },
      ]
      const { container } = render(<TableOfContents headings={unknownLevelHeadings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Design Tokens', () => {
    test('nav has surface background', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('nav has border radius', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('nav has padding', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('p-4')
    })

    test('nav has shadow', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('title has primary text color', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const title = container.querySelector('h2')
      expect(title).toHaveClass('text-[hsl(var(--color-text-primary))]')
    })

    test('title has small text size', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const title = container.querySelector('h2')
      expect(title).toHaveClass('text-sm')
    })

    test('title has semibold font weight', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const title = container.querySelector('h2')
      expect(title).toHaveClass('font-semibold')
    })

    test('title has bottom margin', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const title = container.querySelector('h2')
      expect(title).toHaveClass('mb-3')
    })

    test('links have secondary text color', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })

    test('links have small text size', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('text-sm')
    })

    test('links have hover color transition', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })

    test('links have smooth color transition', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('transition-colors')
      expect(link).toHaveClass('duration-[var(--transition-fast)]')
    })

    test('links are block elements', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const link = container.querySelector('a')
      expect(link).toHaveClass('block')
    })
  })

  describe('List Spacing', () => {
    test('list has vertical spacing between items', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const ul = container.querySelector('ul')
      expect(ul).toHaveClass('space-y-2')
    })
  })

  describe('Accessibility', () => {
    test('navigation has accessible label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAccessibleName('Daftar Isi')
    })

    test('links have href attributes', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByText('Introduction')
      expect(link).toHaveAttribute('href', '#heading-1')
    })

    test('links are keyboard accessible', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByText('Introduction')
      link.focus()
      expect(link).toHaveFocus()
    })
  })

  describe('Memoization', () => {
    test('renders without errors when memoized', () => {
      const { rerender } = render(<TableOfContents headings={mockHeadings} />)
      
      rerender(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles single heading', () => {
      const singleHeading: TocHeading[] = [
        { id: 'single', text: 'Single Heading', level: 2 },
      ]
      render(<TableOfContents headings={singleHeading} />)
      expect(screen.getByText('Single Heading')).toBeInTheDocument()
    })

    test('handles many headings', () => {
      const manyHeadings: TocHeading[] = Array.from({ length: 20 }, (_, i) => ({
        id: `heading-${i}`,
        text: `Heading ${i}`,
        level: 2,
      }))
      render(<TableOfContents headings={manyHeadings} />)
      
      const listItems = document.querySelectorAll('li')
      expect(listItems).toHaveLength(20)
    })

    test('handles special characters in heading text', () => {
      const specialHeadings: TocHeading[] = [
        { id: 'special', text: 'Test & Special "Chars" <with> tags', level: 2 },
      ]
      render(<TableOfContents headings={specialHeadings} />)
      expect(screen.getByText('Test & Special "Chars" <with> tags')).toBeInTheDocument()
    })

    test('handles duplicate IDs', () => {
      const duplicateHeadings: TocHeading[] = [
        { id: 'same', text: 'First', level: 2 },
        { id: 'same', text: 'Second', level: 2 },
      ]
      render(<TableOfContents headings={duplicateHeadings} />)
      
      const links = screen.getAllByText('First')
      expect(links).toHaveLength(1)
    })

    test('handles empty text', () => {
      const emptyTextHeadings: TocHeading[] = [
        { id: 'empty', text: '', level: 2 },
      ]
      const { container } = render(<TableOfContents headings={emptyTextHeadings} />)
      const link = container.querySelector('a')
      expect(link).toBeInTheDocument()
    })

    test('handles very long heading text', () => {
      const longText = 'A'.repeat(500)
      const longHeading: TocHeading[] = [
        { id: 'long', text: longText, level: 2 },
      ]
      render(<TableOfContents headings={longHeading} />)
      expect(screen.getByText(longText)).toBeInTheDocument()
    })
  })
})
