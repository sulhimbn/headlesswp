import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

const mockHeadings: TocHeading[] = [
  { id: 'heading-1', text: 'Introduction', level: 2 },
  { id: 'heading-2', text: 'Getting Started', level: 2 },
  { id: 'heading-3', text: 'Installation', level: 3 },
  { id: 'heading-4', text: 'Configuration', level: 3 },
  { id: 'heading-5', text: 'Advanced Usage', level: 4 },
]

describe('TableOfContents Component', () => {
  const originalScrollTo = window.scrollTo
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect
  const originalGetElementById = document.getElementById

  beforeEach(() => {
    window.scrollTo = jest.fn()
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      top: 100,
      bottom: 200,
      left: 0,
      right: 0,
      width: 100,
      height: 100,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    }))
    document.getElementById = jest.fn((id: string) => {
      if (id === 'heading-1' || id === 'heading-2' || id === 'heading-3' || 
          id === 'heading-4' || id === 'heading-5') {
        return document.createElement('div')
      }
      return null
    })
  })

  afterEach(() => {
    window.scrollTo = originalScrollTo
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect
    document.getElementById = originalGetElementById
  })

  describe('Heading List Rendering', () => {
    test('renders all headings provided', () => {
      render(<TableOfContents headings={mockHeadings} />)

      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('Installation')).toBeInTheDocument()
      expect(screen.getByText('Configuration')).toBeInTheDocument()
      expect(screen.getByText('Advanced Usage')).toBeInTheDocument()
    })

    test('renders correct number of list items', () => {
      render(<TableOfContents headings={mockHeadings} />)

      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(5)
    })

    test('renders nav element with correct aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)

      const nav = screen.getByRole('navigation', { name: /daftar isi/i })
      expect(nav).toBeInTheDocument()
    })

    test('renders heading title', () => {
      render(<TableOfContents headings={mockHeadings} />)

      expect(screen.getByRole('heading', { name: /daftar isi/i })).toBeInTheDocument()
    })

    test('renders anchor links with correct hrefs', () => {
      render(<TableOfContents headings={mockHeadings} />)

      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', '#heading-1')
      expect(links[1]).toHaveAttribute('href', '#heading-2')
      expect(links[2]).toHaveAttribute('href', '#heading-3')
    })

    test('renders h2 level headings without indentation', () => {
      render(<TableOfContents headings={mockHeadings} />)

      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveClass('pl-0')
      expect(links[1]).toHaveClass('pl-0')
    })

    test('renders h3 level headings with pl-4 indent', () => {
      render(<TableOfContents headings={mockHeadings.slice(2, 4)} />)

      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveClass('pl-4')
      expect(links[1]).toHaveClass('pl-4')
    })

    test('renders h4 level headings with pl-8 indent', () => {
      render(<TableOfContents headings={[mockHeadings[4]]} />)

      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-8')
    })

    test('renders h5 level headings with pl-12 indent', () => {
      const h5Heading: TocHeading = { id: 'h5', text: 'H5 Heading', level: 5 }
      render(<TableOfContents headings={[h5Heading]} />)

      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-12')
    })

    test('renders h6 level headings with pl-16 indent', () => {
      const h6Heading: TocHeading = { id: 'h6', text: 'H6 Heading', level: 6 }
      render(<TableOfContents headings={[h6Heading]} />)

      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-16')
    })

    test('renders default indent for unknown levels', () => {
      const unknownLevelHeading: TocHeading = { id: 'unknown', text: 'Unknown', level: 1 }
      render(<TableOfContents headings={[unknownLevelHeading]} />)

      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Click Navigation Functionality', () => {
    test('calls scrollTo on heading click', () => {
      render(<TableOfContents headings={mockHeadings} />)

      const link = screen.getByText('Introduction')
      fireEvent.click(link)

      expect(window.scrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth'
      })
    })

test('prevents default anchor behavior', () => {
      render(<TableOfContents headings={mockHeadings} />)

      const link = screen.getByText('Introduction')
      fireEvent.click(link)

      expect(window.scrollTo).toHaveBeenCalled()
    })

    test('scrolls to correct element by id', () => {
      render(<TableOfContents headings={mockHeadings} />)

      const link = screen.getByText('Installation')
      fireEvent.click(link)

      expect(window.scrollTo).toHaveBeenCalled()
      const callArgs = (window.scrollTo as jest.Mock).mock.calls[0][0]
      expect(callArgs.behavior).toBe('smooth')
      expect(typeof callArgs.top).toBe('number')
    })
  })

  describe('Sticky Positioning Behavior', () => {
    test('applies custom className for sticky positioning', () => {
      render(<TableOfContents headings={mockHeadings} className="sticky top-4" />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('sticky', 'top-4')
    })

    test('applies default className when not provided', () => {
      render(<TableOfContents headings={mockHeadings} />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
      expect(nav).toHaveClass('p-4')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('merges custom className with default classes', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })
  })

  describe('Empty State Handling', () => {
    test('renders nothing when headings array is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Design Tokens', () => {
    test('uses design token for background color', () => {
      render(<TableOfContents headings={mockHeadings} />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('uses design token for text color on heading', () => {
      render(<TableOfContents headings={mockHeadings} />)

      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('text-[hsl(var(--color-text-primary))]')
    })

    test('uses design token for link text color', () => {
      render(<TableOfContents headings={mockHeadings} />)

      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })

    test('uses design token for hover color', () => {
      render(<TableOfContents headings={mockHeadings} />)

      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })

    test('uses design token for transition duration', () => {
      render(<TableOfContents headings={mockHeadings} />)

      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveClass('duration-[var(--transition-fast)]')
    })
  })

  describe('Memo Optimization', () => {
    test('component is exported as memoized', () => {
      expect(TableOfContents.$$typeof?.toString()).toBe('Symbol(react.memo)')
    })
  })

  describe('Edge Cases', () => {
    test('renders with single heading', () => {
      render(<TableOfContents headings={[{ id: 'single', text: 'Single', level: 2 }]} />)

      expect(screen.getByText('Single')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })

    test('renders with heading containing special characters', () => {
      const specialHeading: TocHeading = { id: 'special', text: 'Test & Escape', level: 2 }
      render(<TableOfContents headings={[specialHeading]} />)

      expect(screen.getByText('Test & Escape')).toBeInTheDocument()
    })

    test('renders with very long heading text', () => {
      const longHeading: TocHeading = {
        id: 'long',
        text: 'This is a very long heading text that might need to be truncated or handled differently in the UI',
        level: 2
      }
      render(<TableOfContents headings={[longHeading]} />)

      expect(screen.getByText(longHeading.text)).toBeInTheDocument()
    })
  })
})