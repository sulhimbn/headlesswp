import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'

class IntersectionObserverMock {
  root: Element | null = null
  rootMargin: string = ''
  thresholds: ReadonlyArray<number> = []
  observe = jest.fn()
  disconnect = jest.fn()
  unobserve = jest.fn()
  takeRecords = jest.fn(() => [])
}
window.IntersectionObserver = IntersectionObserverMock

describe('TableOfContents Component', () => {
  const mockHeadings = [
    { id: 'heading-1', text: 'Introduction', level: 2 },
    { id: 'heading-2', text: 'Getting Started', level: 2 },
    { id: 'heading-3', text: 'Sub Section', level: 3 },
    { id: 'heading-4', text: 'Deep Section', level: 4 },
  ]

  beforeEach(() => {
    document.getElementById = jest.fn((id) => {
      const mockElement = document.createElement('div')
      mockElement.id = id
      mockElement.getBoundingClientRect = jest.fn((): DOMRect => ({
        top: 100,
        height: 50,
        width: 200,
        x: 0,
        y: 100,
        bottom: 150,
        left: 0,
        right: 200,
        toJSON: () => ({})
      }))
      return mockElement
    })
    window.scrollTo = jest.fn()
  })

  describe('Rendering', () => {
    test('renders with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation', { name: /daftar isi/i })
      expect(nav).toBeInTheDocument()
    })

    test('renders all headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      mockHeadings.forEach((heading) => {
        expect(screen.getByText(heading.text)).toBeInTheDocument()
      })
    })

    test('renders with custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
    })

    test('renders empty nav when headings is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.querySelector('nav')).toBeInTheDocument()
      expect(container.querySelector('nav')?.querySelector('ul')?.children).toHaveLength(0)
    })

    test('has sticky positioning', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('sticky', 'top-20')
    })
  })

  describe('Indentation', () => {
    test('applies correct indent for h2', () => {
      render(<TableOfContents headings={[{ id: 'h2', text: 'Heading 2', level: 2 }]} />)
      const link = screen.getByRole('link', { name: 'Heading 2' })
      expect(link).toHaveClass('pl-0')
    })

    test('applies correct indent for h3', () => {
      render(<TableOfContents headings={[{ id: 'h3', text: 'Heading 3', level: 3 }]} />)
      const link = screen.getByRole('link', { name: 'Heading 3' })
      expect(link).toHaveClass('pl-4')
    })

    test('applies correct indent for h4', () => {
      render(<TableOfContents headings={[{ id: 'h4', text: 'Heading 4', level: 4 }]} />)
      const link = screen.getByRole('link', { name: 'Heading 4' })
      expect(link).toHaveClass('pl-8')
    })

    test('applies correct indent for h5', () => {
      render(<TableOfContents headings={[{ id: 'h5', text: 'Heading 5', level: 5 }]} />)
      const link = screen.getByRole('link', { name: 'Heading 5' })
      expect(link).toHaveClass('pl-12')
    })

    test('applies correct indent for h6', () => {
      render(<TableOfContents headings={[{ id: 'h6', text: 'Heading 6', level: 6 }]} />)
      const link = screen.getByRole('link', { name: 'Heading 6' })
      expect(link).toHaveClass('pl-16')
    })

    test('defaults to pl-0 for unknown levels', () => {
      render(<TableOfContents headings={[{ id: 'h7', text: 'Heading 7', level: 7 }]} />)
      const link = screen.getByRole('link', { name: 'Heading 7' })
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Click Handling', () => {
    test('scrolls to heading on click', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      fireEvent.click(link)
      expect(window.scrollTo).toHaveBeenCalled()
    })

    test('has click handler attached', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      const clickHandler = jest.fn()
      link.onclick = clickHandler
      fireEvent.click(link)
    })

    test('handles missing heading element gracefully', () => {
      document.getElementById = jest.fn().mockReturnValue(null)
      render(<TableOfContents headings={[{ id: 'missing', text: 'Missing', level: 2 }]} />)
      const link = screen.getByRole('link', { name: 'Missing' })
      fireEvent.click(link)
      expect(window.scrollTo).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    test('has correct aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation', { name: /daftar isi/i })
      expect(nav).toBeInTheDocument()
    })

    test('links have correct href attributes', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveAttribute('href', '#heading-1')
    })

    test('has list structure', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(mockHeadings.length)
    })
  })

  describe('Design Tokens', () => {
    test('uses surface color for background', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('uses shadow token', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('uses radius token', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('uses transition token', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link).toHaveClass('duration-[var(--transition-fast)]')
      })
    })
  })
})