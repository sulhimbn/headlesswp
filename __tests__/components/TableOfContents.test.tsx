import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

jest.mock('@/lib/constants/uiText', () => ({
  UI_TEXT: {
    postDetail: {
      tableOfContents: 'Daftar Isi',
    },
  },
}))

describe('TableOfContents Component', () => {
  const mockHeadings: TocHeading[] = [
    { id: 'intro', text: 'Introduction', level: 2 },
    { id: 'section1', text: 'Section 1', level: 2 },
    { id: 'subsection1', text: 'Subsection 1', level: 3 },
    { id: 'section2', text: 'Section 2', level: 2 },
    { id: 'deep', text: 'Deep Heading', level: 5 },
  ]

  beforeEach(() => {
    window.scrollTo = jest.fn()
  })

  describe('Rendering', () => {
    test('renders nav element with correct aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toBeInTheDocument()
    })

    test('renders heading title', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
    })

    test('renders all headings as links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)
    })

    test('renders heading text correctly', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Section 1')).toBeInTheDocument()
      expect(screen.getByText('Subsection 1')).toBeInTheDocument()
    })

    test('renders heading with correct href', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const introLink = screen.getByRole('link', { name: 'Introduction' })
      expect(introLink).toHaveAttribute('href', '#intro')
    })

    test('renders with custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
    })
  })

  describe('Indentation by Heading Level', () => {
    test('level 2 headings have no indentation', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const introLink = screen.getByRole('link', { name: 'Introduction' })
      expect(introLink).toHaveClass('pl-0')
    })

    test('level 3 headings have pl-4 indentation', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const subsectionLink = screen.getByRole('link', { name: 'Subsection 1' })
      expect(subsectionLink).toHaveClass('pl-4')
    })

    test('level 4 headings have pl-8 indentation', () => {
      const headings: TocHeading[] = [
        { id: 'h4', text: 'H4 Heading', level: 4 },
      ]
      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-8')
    })

    test('level 5 headings have pl-12 indentation', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const deepLink = screen.getByRole('link', { name: 'Deep Heading' })
      expect(deepLink).toHaveClass('pl-12')
    })

    test('level 6 headings have pl-16 indentation', () => {
      const headings: TocHeading[] = [
        { id: 'h6', text: 'H6 Heading', level: 6 },
      ]
      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-16')
    })

    test('unknown level headings default to pl-0', () => {
      const headings: TocHeading[] = [
        { id: 'unknown', text: 'Unknown Level', level: 7 },
      ]
      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Click Behavior', () => {
    test('click handler is attached to links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      
      const mockElement = {
        getBoundingClientRect: jest.fn(() => ({ top: 100 })),
      }
      document.getElementById = jest.fn().mockReturnValue(mockElement)
      
      fireEvent.click(link)
      
      expect(document.getElementById).toHaveBeenCalledWith('intro')
    })

    test('handles missing target element gracefully', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      
      document.getElementById = jest.fn().mockReturnValue(null)
      
      fireEvent.click(link)
      
      expect(window.scrollTo).not.toHaveBeenCalled()
    })

    test('scrolls when element is found', () => {
      const mockElement = {
        getBoundingClientRect: jest.fn(() => ({ top: 200 })),
      }
      document.getElementById = jest.fn().mockReturnValue(mockElement)
      
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Section 1' })
      
      fireEvent.click(link)
      
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      })
    })
  })

  describe('Empty State', () => {
    test('returns null when headings array is empty', () => {
      render(<TableOfContents headings={[]} />)
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    test('applies surface background color', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('applies rounded border radius', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('applies shadow styling', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('heading links have hover color', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })

    test('heading links have transition styling', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveClass('transition-colors')
    })
  })

  describe('Accessibility', () => {
    test('each heading link has accessible text', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link.textContent?.length).toBeGreaterThan(0)
      })
    })

    test('renders list structure for headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(5)
    })

    test('links use fragment identifier for anchor navigation', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Subsection 1' })
      expect(link).toHaveAttribute('href', '#subsection1')
    })
  })

  describe('Memoization', () => {
    test('renders with memo by default', () => {
      const { rerender } = render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      
      rerender(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })
})
