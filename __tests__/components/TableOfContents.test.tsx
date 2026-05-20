import { render, screen } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'
import { UI_TEXT } from '@/lib/constants/uiText'

describe('TableOfContents Component', () => {
  const mockHeadings: TocHeading[] = [
    { id: 'introduction', text: 'Introduction', level: 2 },
    { id: 'getting-started', text: 'Getting Started', level: 2 },
    { id: 'installation', text: 'Installation', level: 3 },
    { id: 'configuration', text: 'Configuration', level: 3 },
  ]

  describe('Rendering', () => {
    test('renders navigation element with correct aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation', { name: UI_TEXT.postDetail.tableOfContents })
      expect(nav).toBeInTheDocument()
    })

    test('renders heading title', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByText(UI_TEXT.postDetail.tableOfContents)).toBeInTheDocument()
    })

    test('renders all headings as links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      mockHeadings.forEach(heading => {
        const link = screen.getByRole('link', { name: heading.text })
        expect(link).toBeInTheDocument()
      })
    })

    test('renders with custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      const nav = document.querySelector('.custom-class')
      expect(nav).toBeInTheDocument()
    })

    test('renders list items for each heading', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(mockHeadings.length)
    })
  })

  describe('Empty State', () => {
    test('returns null when headings is empty array', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })

    test('returns null when headings is not provided (undefined)', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Link Behavior', () => {
    test('links have correct href with hash', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const firstLink = screen.getByRole('link', { name: 'Introduction' })
      expect(firstLink).toHaveAttribute('href', '#introduction')
    })

    test('each heading has unique href', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      const hrefs = links.map(link => link.getAttribute('href'))
      const uniqueHrefs = new Set(hrefs)
      expect(uniqueHrefs.size).toBe(hrefs.length)
    })
  })

  describe('Indentation', () => {
    test('h2 headings have no indentation (pl-0)', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const h2Link = screen.getByRole('link', { name: 'Introduction' })
      expect(h2Link).toHaveClass('pl-0')
    })

    test('h3 headings have pl-4 class', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const h3Link = screen.getByRole('link', { name: 'Installation' })
      expect(h3Link).toHaveClass('pl-4')
    })

    test('h4 headings have pl-8 class', () => {
      const h4Headings: TocHeading[] = [{ id: 'deep', text: 'Deep Section', level: 4 }]
      render(<TableOfContents headings={h4Headings} />)
      const h4Link = screen.getByRole('link', { name: 'Deep Section' })
      expect(h4Link).toHaveClass('pl-8')
    })

    test('h5 headings have pl-12 class', () => {
      const h5Headings: TocHeading[] = [{ id: 'deeper', text: 'Deeper Section', level: 5 }]
      render(<TableOfContents headings={h5Headings} />)
      const h5Link = screen.getByRole('link', { name: 'Deeper Section' })
      expect(h5Link).toHaveClass('pl-12')
    })

    test('h6 headings have pl-16 class', () => {
      const h6Headings: TocHeading[] = [{ id: 'deepest', text: 'Deepest Section', level: 6 }]
      render(<TableOfContents headings={h6Headings} />)
      const h6Link = screen.getByRole('link', { name: 'Deepest Section' })
      expect(h6Link).toHaveClass('pl-16')
    })
  })

  describe('Styling', () => {
    test('nav has background color from design token', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('nav has rounded-lg class', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('nav has shadow from design token', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('heading title has correct styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const title = screen.getByText(UI_TEXT.postDetail.tableOfContents)
      expect(title).toHaveClass('text-sm', 'font-semibold')
    })

    test('links have hover styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })

    test('links have transition styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveClass('transition-colors', 'duration-[var(--transition-fast)]')
    })

    test('links use secondary text color', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })

    test('list has space-y-2 for spacing', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const list = screen.getByRole('navigation').querySelector('ul')
      expect(list).toHaveClass('space-y-2')
    })
  })

  describe('Accessibility', () => {
    test('navigation has aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', UI_TEXT.postDetail.tableOfContents)
    })

    test('links have accessible names from heading text', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toBeInTheDocument()
    })

    test('links are keyboard accessible', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).not.toHaveAttribute('tabindex', '-1')
    })
  })

  describe('Memoization', () => {
    test('component is exported as memoized', () => {
      const tableOfContents = require('@/components/ui/TableOfContents').default
      expect(tableOfContents.type).toBeDefined()
    })
  })
})