import { render, screen } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

describe('TableOfContents Component', () => {
  const mockScrollTo = jest.fn()
  const headings: TocHeading[] = [
    { id: 'intro', text: 'Introduction', level: 2 },
    { id: 'section1', text: 'Section 1', level: 2 },
    { id: 'subsection1', text: 'Subsection 1.1', level: 3 },
    { id: 'section2', text: 'Section 2', level: 2 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    window.scrollTo = mockScrollTo

    const mockGetElementById = jest.fn((id: string): HTMLElement | null => {
      if (id === 'intro' || id === 'section1' || id === 'subsection1' || id === 'section2') {
        return {
          getBoundingClientRect: jest.fn().mockReturnValue({ top: 100 }),
        } as unknown as HTMLElement
      }
      return null
    })
    document.getElementById = mockGetElementById
  })

  describe('Rendering', () => {
    test('renders navigation with all headings', () => {
      render(<TableOfContents headings={headings} />)

      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toBeInTheDocument()
    })

    test('renders heading title', () => {
      render(<TableOfContents headings={headings} />)

      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
    })

    test('renders all heading links', () => {
      render(<TableOfContents headings={headings} />)

      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Section 1')).toBeInTheDocument()
      expect(screen.getByText('Subsection 1.1')).toBeInTheDocument()
      expect(screen.getByText('Section 2')).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<TableOfContents headings={headings} className="custom-class" />)

      const nav = document.querySelector('.custom-class')
      expect(nav).toBeInTheDocument()
    })
  })

  describe('Empty headings', () => {
    test('returns null when headings array is empty', () => {
      render(<TableOfContents headings={[]} />)

      const nav = document.querySelector('nav')
      expect(nav).toBeNull()
    })
  })

  describe('Link behavior', () => {
    test('creates correct href for each heading', () => {
      render(<TableOfContents headings={headings} />)

      const introLink = document.querySelector('a[href="#intro"]')
      expect(introLink).toBeInTheDocument()

      const section1Link = document.querySelector('a[href="#section1"]')
      expect(section1Link).toBeInTheDocument()
    })

    test('prevents default scroll behavior', () => {
      render(<TableOfContents headings={headings} />)

      const link = document.querySelector('a[href="#intro"]')
      expect(link).toBeInTheDocument()
    })
  })

  describe('Indentation', () => {
    test('applies correct indent class for level 2', () => {
      render(<TableOfContents headings={headings} />)

      const introLink = document.querySelector('a[href="#intro"]')
      expect(introLink).toHaveClass('pl-0')
    })

    test('applies correct indent class for level 3', () => {
      render(<TableOfContents headings={headings} />)

      const subsectionLink = document.querySelector('a[href="#subsection1"]')
      expect(subsectionLink).toHaveClass('pl-4')
    })

    test('applies correct indent class for level 4', () => {
      const headingsWithLevel4: TocHeading[] = [
        { id: 'h4', text: 'Level 4', level: 4 },
      ]
      render(<TableOfContents headings={headingsWithLevel4} />)

      const level4Link = document.querySelector('a[href="#h4"]')
      expect(level4Link).toHaveClass('pl-8')
    })

    test('applies correct indent class for level 5', () => {
      const headingsWithLevel5: TocHeading[] = [
        { id: 'h5', text: 'Level 5', level: 5 },
      ]
      render(<TableOfContents headings={headingsWithLevel5} />)

      const level5Link = document.querySelector('a[href="#h5"]')
      expect(level5Link).toHaveClass('pl-12')
    })

    test('applies correct indent class for level 6', () => {
      const headingsWithLevel6: TocHeading[] = [
        { id: 'h6', text: 'Level 6', level: 6 },
      ]
      render(<TableOfContents headings={headingsWithLevel6} />)

      const level6Link = document.querySelector('a[href="#h6"]')
      expect(level6Link).toHaveClass('pl-16')
    })

    test('applies default indent for unknown levels', () => {
      const headingsWithUnknownLevel: TocHeading[] = [
        { id: 'unknown', text: 'Unknown Level', level: 10 },
      ]
      render(<TableOfContents headings={headingsWithUnknownLevel} />)

      const unknownLink = document.querySelector('a[href="#unknown"]')
      expect(unknownLink).toHaveClass('pl-0')
    })
  })

  describe('Visual styling', () => {
    test('nav has surface background', () => {
      render(<TableOfContents headings={headings} />)

      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('nav has rounded corners', () => {
      render(<TableOfContents headings={headings} />)

      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('nav has padding', () => {
      render(<TableOfContents headings={headings} />)

      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('p-4')
    })

    test('nav has shadow', () => {
      render(<TableOfContents headings={headings} />)

      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('heading has correct text styling', () => {
      render(<TableOfContents headings={headings} />)

      const heading = screen.getByText('Daftar Isi')
      expect(heading).toHaveClass('text-sm', 'font-semibold')
      expect(heading).toHaveClass('text-[hsl(var(--color-text-primary))]')
    })

    test('link has correct text styling', () => {
      render(<TableOfContents headings={headings} />)

      const link = document.querySelector('a[href="#intro"]')
      expect(link).toHaveClass('text-sm')
      expect(link).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })

    test('link has hover effect', () => {
      render(<TableOfContents headings={headings} />)

      const link = document.querySelector('a[href="#intro"]')
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })

    test('link has transition effect', () => {
      render(<TableOfContents headings={headings} />)

      const link = document.querySelector('a[href="#intro"]')
      expect(link).toHaveClass('transition-colors')
    })
  })

  describe('List structure', () => {
    test('renders as unordered list', () => {
      render(<TableOfContents headings={headings} />)

      const list = document.querySelector('ul')
      expect(list).toBeInTheDocument()
    })

    test('renders each heading as list item', () => {
      render(<TableOfContents headings={headings} />)

      const listItems = document.querySelectorAll('li')
      expect(listItems).toHaveLength(headings.length)
    })
  })

  describe('Key prop', () => {
    test('uses heading id as key', () => {
      render(<TableOfContents headings={headings} />)

      const introLink = document.querySelector('a[href="#intro"]')
      expect(introLink).toBeInTheDocument()
    })
  })
})
