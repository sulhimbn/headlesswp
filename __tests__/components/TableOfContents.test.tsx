import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

const mockScrollTo = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  global.scrollTo = mockScrollTo
  global.pageYOffset = 0
  global.innerHeight = 768
})

describe('TableOfContents Component', () => {
  describe('Rendering', () => {
    test('renders table of contents with headings', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
        { id: 'section1', text: 'Section 1', level: 2 },
        { id: 'subsection', text: 'Subsection', level: 3 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      expect(screen.getByRole('navigation', { name: /daftar isi/i })).toBeInTheDocument()
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Section 1')).toBeInTheDocument()
      expect(screen.getByText('Subsection')).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} className="custom-class" />)
      
      const nav = screen.getByRole('navigation', { name: /daftar isi/i })
      expect(nav).toHaveClass('custom-class')
    })

    test('renders heading title', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    test('returns null when headings is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Link Generation', () => {
    test('generates correct href for each heading', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
        { id: 'section1', text: 'Section 1', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', '#intro')
      expect(links[1]).toHaveAttribute('href', '#section1')
    })
  })

  describe('Click Behavior', () => {
    test('scrolls to element on click', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]
      
      const mockElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({ top: 100 }),
      }
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any)
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Introduction' })
      fireEvent.click(link)
      
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      })
    })

    test('prevents default anchor behavior', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]
      
      const mockElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({ top: 100 }),
      }
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any)
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Introduction' })
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
      link.dispatchEvent(clickEvent)
      
      expect(clickEvent.defaultPrevented).toBe(true)
    })

    test('does nothing if element not found', () => {
      const headings: TocHeading[] = [
        { id: 'nonexistent', text: 'Not Found', level: 2 },
      ]
      
      jest.spyOn(document, 'getElementById').mockReturnValue(null)
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Not Found' })
      fireEvent.click(link)
      
      expect(mockScrollTo).not.toHaveBeenCalled()
    })
  })

  describe('Indentation', () => {
    test('applies correct indentation for level 2', () => {
      const headings: TocHeading[] = [
        { id: 'h2', text: 'Heading 2', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Heading 2' })
      expect(link).toHaveClass('pl-0')
    })

    test('applies correct indentation for level 3', () => {
      const headings: TocHeading[] = [
        { id: 'h3', text: 'Heading 3', level: 3 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Heading 3' })
      expect(link).toHaveClass('pl-4')
    })

    test('applies correct indentation for level 4', () => {
      const headings: TocHeading[] = [
        { id: 'h4', text: 'Heading 4', level: 4 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Heading 4' })
      expect(link).toHaveClass('pl-8')
    })

    test('applies correct indentation for level 5', () => {
      const headings: TocHeading[] = [
        { id: 'h5', text: 'Heading 5', level: 5 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Heading 5' })
      expect(link).toHaveClass('pl-12')
    })

    test('applies correct indentation for level 6', () => {
      const headings: TocHeading[] = [
        { id: 'h6', text: 'Heading 6', level: 6 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Heading 6' })
      expect(link).toHaveClass('pl-16')
    })

    test('falls back to pl-0 for unknown levels', () => {
      const headings: TocHeading[] = [
        { id: 'h1', text: 'Heading 1', level: 1 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Heading 1' })
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Styling', () => {
    test('applies surface background color', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const nav = screen.getByRole('navigation', { name: /daftar isi/i })
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('applies border radius', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const nav = screen.getByRole('navigation', { name: /daftar isi/i })
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })
  })

  describe('Accessibility', () => {
    test('navigation has aria-label', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      expect(screen.getByRole('navigation', { name: /daftar isi/i })).toHaveAttribute('aria-label')
    })

    test('links are keyboard accessible', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveClass('transition-colors')
    })
  })

  describe('Edge Cases', () => {
    test('handles many headings', () => {
      const headings: TocHeading[] = Array.from({ length: 20 }, (_, i) => ({
        id: `heading-${i}`,
        text: `Heading ${i}`,
        level: 2,
      }))
      
      render(<TableOfContents headings={headings} />)
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(20)
    })

    test('handles heading with empty text', () => {
      const headings: TocHeading[] = [
        { id: 'empty', text: '', level: 2 },
      ]
      
      const { container } = render(<TableOfContents headings={headings} />)
      expect(container.firstChild).not.toBeNull()
    })
  })
})