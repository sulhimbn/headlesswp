import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import { UI_TEXT } from '@/lib/constants/uiText'
import type { TocHeading } from '@/lib/utils/tableOfContents'

describe('TableOfContents Component', () => {
  const mockHeadings: TocHeading[] = [
    { id: 'heading-1', text: 'Introduction', level: 2 },
    { id: 'heading-2', text: 'Getting Started', level: 2 },
    { id: 'heading-3', text: 'Installation', level: 3 },
    { id: 'heading-4', text: 'Configuration', level: 4 },
    { id: 'heading-5', text: 'Advanced', level: 5 },
    { id: 'heading-6', text: 'Expert', level: 6 },
  ]

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    test('renders nav element with correct aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', UI_TEXT.postDetail.tableOfContents)
    })

    test('renders section title', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByText(UI_TEXT.postDetail.tableOfContents)).toBeInTheDocument()
    })

    test('renders all heading links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(mockHeadings.length)
    })

    test('renders heading text correctly', () => {
      render(<TableOfContents headings={mockHeadings} />)
      mockHeadings.forEach(heading => {
        expect(screen.getByText(heading.text)).toBeInTheDocument()
      })
    })

    test('renders heading links with correct href', () => {
      render(<TableOfContents headings={mockHeadings} />)
      mockHeadings.forEach(heading => {
        const link = screen.getByRole('link', { name: heading.text })
        expect(link).toHaveAttribute('href', `#${heading.id}`)
      })
    })

    test('renders with custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class mt-8" />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class', 'mt-8')
    })

    test('renders unordered list for headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
    })

    test('renders list items for each heading', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(mockHeadings.length)
    })

    test('renders with default className', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
      expect(nav).toHaveClass('p-4')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })
  })

  describe('Empty State', () => {
    test('returns null when headings array is empty', () => {
      render(<TableOfContents headings={[]} />)
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })

    test('returns null when headings is undefined-like empty', () => {
      render(<TableOfContents headings={[]} />)
      expect(screen.queryByText(UI_TEXT.postDetail.tableOfContents)).not.toBeInTheDocument()
    })
  })

  describe('Indentation', () => {
    test('applies pl-0 class for level 2 headings', () => {
      render(<TableOfContents headings={mockHeadings.filter(h => h.level === 2)} />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveClass('pl-0')
      })
    })

    test('applies pl-4 class for level 3 headings', () => {
      render(<TableOfContents headings={mockHeadings.filter(h => h.level === 3)} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-4')
    })

    test('applies pl-8 class for level 4 headings', () => {
      render(<TableOfContents headings={mockHeadings.filter(h => h.level === 4)} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-8')
    })

    test('applies pl-12 class for level 5 headings', () => {
      render(<TableOfContents headings={mockHeadings.filter(h => h.level === 5)} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-12')
    })

    test('applies pl-16 class for level 6 headings', () => {
      render(<TableOfContents headings={mockHeadings.filter(h => h.level === 6)} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-16')
    })

    test('applies pl-0 for unknown levels', () => {
      const unknownLevelHeading: TocHeading[] = [
        { id: 'test', text: 'Test', level: 7 }
      ]
      render(<TableOfContents headings={unknownLevelHeading} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Click Behavior', () => {
    test('prevents default link behavior', () => {
      const scrollToMock = jest.fn()
      Object.defineProperty(window, 'scrollTo', {
        value: scrollToMock,
        writable: true
      })

      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })

      const event = new Event('click', { bubbles: true })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

      fireEvent(link, event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    test('scrolls to element when target exists', () => {
      const scrollToMock = jest.fn()
      Object.defineProperty(window, 'scrollTo', {
        value: scrollToMock,
        writable: true
      })

      const mockElement = {
        getBoundingClientRect: jest.fn(() => ({
          top: 100
        }))
      }
      document.getElementById = jest.fn().mockReturnValue(mockElement)

      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })

      fireEvent.click(link)

      expect(document.getElementById).toHaveBeenCalledWith('heading-1')
      expect(scrollToMock).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth'
      })
    })

    test('does not scroll when target element does not exist', () => {
      const scrollToMock = jest.fn()
      Object.defineProperty(window, 'scrollTo', {
        value: scrollToMock,
        writable: true
      })

      document.getElementById = jest.fn().mockReturnValue(null)

      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })

      fireEvent.click(link)

      expect(document.getElementById).toHaveBeenCalledWith('heading-1')
      expect(scrollToMock).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    test('links have proper focus styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
      expect(link).toHaveClass('transition-colors')
    })

    test('heading text is properly styled', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const title = screen.getByText(UI_TEXT.postDetail.tableOfContents)
      expect(title).toHaveClass('text-sm')
      expect(title).toHaveClass('font-semibold')
      expect(title).toHaveClass('text-[hsl(var(--color-text-primary))]')
      expect(title).toHaveClass('mb-3')
    })

    test('link text has secondary color', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })
  })

  describe('Design Tokens', () => {
    test('uses design tokens for surface color', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('uses design tokens for radius', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('uses design tokens for shadow', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('uses design tokens for transitions', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveClass('duration-[var(--transition-fast)]')
    })
  })

  describe('Edge Cases', () => {
    test('handles single heading', () => {
      render(<TableOfContents headings={[mockHeadings[0]]} />)
      expect(screen.getAllByRole('link')).toHaveLength(1)
    })

    test('handles multiple headings with same level', () => {
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

    test('handles headings with special characters in text', () => {
      const specialHeading: TocHeading[] = [
        { id: 'special', text: 'Heading with <special> & "chars"', level: 2 }
      ]
      render(<TableOfContents headings={specialHeading} />)
      expect(screen.getByText('Heading with <special> & "chars"')).toBeInTheDocument()
    })
  })
})
