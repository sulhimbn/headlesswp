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
  describe('Rendering with headings', () => {
    test('renders with headings', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
        { id: 'section-1', text: 'Section 1', level: 2 },
        { id: 'section-2', text: 'Section 2', level: 3 },
      ]

      render(<TableOfContents headings={headings} />)

      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Section 1')).toBeInTheDocument()
      expect(screen.getByText('Section 2')).toBeInTheDocument()
    })

    test('renders nav element with proper aria-label', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]

      render(<TableOfContents headings={headings} />)

      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toBeInTheDocument()
    })

    test('renders heading title', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]

      render(<TableOfContents headings={headings} />)

      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
    })
  })

  describe('Rendering with empty headings', () => {
    test('returns null when headings is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })

    test('returns null when headings is undefined', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Click handling and smooth scrolling', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('calls scrollTo on click with smooth behavior', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]

      const scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {})
      document.getElementById = jest.fn().mockReturnValue({
        getBoundingClientRect: () => ({ top: 100 })
      })

      render(<TableOfContents headings={headings} />)

      const link = screen.getByText('Introduction')
      fireEvent.click(link)

      expect(scrollToSpy).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth'
      })
      
      scrollToSpy.mockRestore()
    })

    test('prevents default anchor behavior', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]

      render(<TableOfContents headings={headings} />)

      const link = screen.getByText('Introduction')
      Object.defineProperty(link, 'href', { value: '' })
      fireEvent.click(link)
    })
  })

  describe('Indentation based on heading level', () => {
    test('applies no indentation for h2 (level 2)', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]

      const { container } = render(<TableOfContents headings={headings} />)
      const link = container.querySelector('a')

      expect(link).toHaveClass('pl-0')
    })

    test('applies indent for h3 (level 3)', () => {
      const headings: TocHeading[] = [
        { id: 'section', text: 'Section', level: 3 },
      ]

      const { container } = render(<TableOfContents headings={headings} />)
      const link = container.querySelector('a')

      expect(link).toHaveClass('pl-4')
    })

    test('applies larger indent for h4 (level 4)', () => {
      const headings: TocHeading[] = [
        { id: 'section', text: 'Section', level: 4 },
      ]

      const { container } = render(<TableOfContents headings={headings} />)
      const link = container.querySelector('a')

      expect(link).toHaveClass('pl-8')
    })

    test('applies larger indent for h5 (level 5)', () => {
      const headings: TocHeading[] = [
        { id: 'section', text: 'Section', level: 5 },
      ]

      const { container } = render(<TableOfContents headings={headings} />)
      const link = container.querySelector('a')

      expect(link).toHaveClass('pl-12')
    })

    test('applies largest indent for h6 (level 6)', () => {
      const headings: TocHeading[] = [
        { id: 'section', text: 'Section', level: 6 },
      ]

      const { container } = render(<TableOfContents headings={headings} />)
      const link = container.querySelector('a')

      expect(link).toHaveClass('pl-16')
    })
  })

  describe('Accessibility', () => {
    test('nav has aria-label', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]

      render(<TableOfContents headings={headings} />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Daftar Isi')
    })

    test('links have href with heading id', () => {
      const headings: TocHeading[] = [
        { id: 'my-heading', text: 'My Heading', level: 2 },
      ]

      const { container } = render(<TableOfContents headings={headings} />)
      const link = container.querySelector('a')

      expect(link).toHaveAttribute('href', '#my-heading')
    })

    test('buttons have proper aria-label when clicked', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]

      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByText('Introduction')
      expect(link.tagName).toBe('A')
    })
  })

  describe('Memoization', () => {
    test('should not re-render with same props', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]

      const { rerender } = render(<TableOfContents headings={headings} />)
      
      rerender(<TableOfContents headings={headings} />)

      expect(screen.getByText('Introduction')).toBeInTheDocument()
    })

    test('should render with different headings', () => {
      const { rerender } = render(<TableOfContents headings={[{ id: 'a', text: 'A', level: 2 }]} />)
      
      expect(screen.getByText('A')).toBeInTheDocument()

      rerender(<TableOfContents headings={[{ id: 'b', text: 'B', level: 2 }]} />)
      
      expect(screen.getByText('B')).toBeInTheDocument()
    })
  })

  describe('Custom className', () => {
    test('applies custom className', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
      ]

      const { container } = render(<TableOfContents headings={headings} className="custom-class" />)
      const nav = container.querySelector('nav')

      expect(nav).toHaveClass('custom-class')
    })
  })
})
