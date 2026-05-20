import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

const mockHeadings: TocHeading[] = [
  { id: 'introduction', text: 'Introduction', level: 2 },
  { id: 'getting-started', text: 'Getting Started', level: 2 },
  { id: 'installation', text: 'Installation', level: 3 },
  { id: 'configuration', text: 'Configuration', level: 3 },
  { id: 'advanced', text: 'Advanced Usage', level: 4 },
]

const mockScrollTo = jest.fn()
const mockGetElementById = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  window.scrollTo = mockScrollTo
  document.getElementById = mockGetElementById
})

describe('TableOfContents Component', () => {
  describe('Rendering', () => {
    test('renders table of contents with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
    })

    test('renders all heading links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      mockHeadings.forEach((heading) => {
        expect(screen.getByText(heading.text)).toBeInTheDocument()
      })
    })

    test('renders with custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-toc" />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-toc')
    })

    test('renders correct number of list items', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(mockHeadings.length)
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

  describe('Navigation Links', () => {
    test('renders links with correct href', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', '#introduction')
      expect(links[1]).toHaveAttribute('href', '#getting-started')
    })

    test('each link has correct id as href', () => {
      render(<TableOfContents headings={mockHeadings} />)
      mockHeadings.forEach((heading) => {
        const link = screen.getByRole('link', { name: heading.text })
        expect(link).toHaveAttribute('href', `#${heading.id}`)
      })
    })
  })

  describe('Indentation', () => {
    test('applies correct indentation for level 2 headings', () => {
      render(<TableOfContents headings={[{ id: 'intro', text: 'Intro', level: 2 }]} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-0')
    })

    test('applies correct indentation for level 3 headings', () => {
      render(<TableOfContents headings={[{ id: 'install', text: 'Install', level: 3 }]} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-4')
    })

    test('applies correct indentation for level 4 headings', () => {
      render(<TableOfContents headings={[{ id: 'advanced', text: 'Advanced', level: 4 }]} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-8')
    })

    test('applies correct indentation for level 5 headings', () => {
      render(<TableOfContents headings={[{ id: 'level5', text: 'Level 5', level: 5 }]} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-12')
    })

    test('applies correct indentation for level 6 headings', () => {
      render(<TableOfContents headings={[{ id: 'level6', text: 'Level 6', level: 6 }]} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-16')
    })

    test('applies default indentation for unknown levels', () => {
      render(<TableOfContents headings={[{ id: 'unknown', text: 'Unknown', level: 1 }]} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Accessibility', () => {
    test('has aria-label on navigation', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Daftar Isi')
    })

    test('heading text is accessible', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
    })
  })

  describe('Styles', () => {
    test('has surface background color', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('has rounded-lg border radius', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('has shadow-md', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('has padding', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('p-4')
    })

    test('heading has correct font styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const heading = screen.getByText('Daftar Isi')
      expect(heading).toHaveClass('text-sm', 'font-semibold')
      expect(heading).toHaveClass('text-[hsl(var(--color-text-primary))]')
    })

    test('links have correct text styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByText('Introduction')
      expect(link).toHaveClass('text-sm')
      expect(link).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })

    test('links have hover styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByText('Introduction')
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })

    test('links have transition styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByText('Introduction')
      expect(link).toHaveClass('transition-colors', 'duration-[var(--transition-fast)]')
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      const { rerender } = render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
      rerender(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles single heading', () => {
      const singleHeading = [{ id: 'only', text: 'Only Heading', level: 2 }]
      render(<TableOfContents headings={singleHeading} />)
      expect(screen.getByText('Only Heading')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })

    test('handles headings with special characters in text', () => {
      const specialHeadings = [
        { id: 'test', text: 'Test with <special> & "quotes"', level: 2 }
      ]
      render(<TableOfContents headings={specialHeadings} />)
      expect(screen.getByText('Test with <special> & "quotes"')).toBeInTheDocument()
    })

    test('handles headings with duplicate levels', () => {
      const duplicateLevels = [
        { id: 'section1', text: 'Section 1', level: 2 },
        { id: 'section2', text: 'Section 2', level: 2 },
        { id: 'section3', text: 'Section 3', level: 2 },
      ]
      render(<TableOfContents headings={duplicateLevels} />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveClass('pl-0')
      })
    })

    test('handles mixed heading levels', () => {
      const mixedLevels = [
        { id: 'h2', text: 'H2', level: 2 },
        { id: 'h3', text: 'H3', level: 3 },
        { id: 'h4', text: 'H4', level: 4 },
        { id: 'h5', text: 'H5', level: 5 },
        { id: 'h6', text: 'H6', level: 6 },
      ]
      render(<TableOfContents headings={mixedLevels} />)
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveClass('pl-0')
      expect(links[1]).toHaveClass('pl-4')
      expect(links[2]).toHaveClass('pl-8')
      expect(links[3]).toHaveClass('pl-12')
      expect(links[4]).toHaveClass('pl-16')
    })
  })

  describe('Click Handler', () => {
    test('calls scrollTo when clicking a heading link', () => {
      const targetElement = document.createElement('div')
      targetElement.id = 'introduction'
      Object.defineProperty(targetElement, 'getBoundingClientRect', {
        value: () => ({ top: 200 }),
        writable: true,
      })
      mockGetElementById.mockReturnValue(targetElement)
      Object.defineProperty(window, 'pageYOffset', { value: 100, writable: true })

      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      fireEvent.click(link)

      expect(mockGetElementById).toHaveBeenCalledWith('introduction')
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth'
      })
    })

    test('handles click when target element does not exist', () => {
      mockGetElementById.mockReturnValue(null)

      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      fireEvent.click(link)

      expect(mockGetElementById).toHaveBeenCalledWith('introduction')
      expect(mockScrollTo).not.toHaveBeenCalled()
    })

    test('prevents default behavior on click', () => {
      const targetElement = document.createElement('div')
      targetElement.id = 'introduction'
      Object.defineProperty(targetElement, 'getBoundingClientRect', {
        value: () => ({ top: 200 }),
        writable: true,
      })
      mockGetElementById.mockReturnValue(targetElement)
      Object.defineProperty(window, 'pageYOffset', { value: 100, writable: true })

      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      
      fireEvent(link, new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(mockScrollTo).toHaveBeenCalled()
    })

    test('calculates scroll position with header offset', () => {
      const targetElement = document.createElement('div')
      targetElement.id = 'introduction'
      Object.defineProperty(targetElement, 'getBoundingClientRect', {
        value: () => ({ top: 200 }),
        writable: true,
      })
      mockGetElementById.mockReturnValue(targetElement)
      Object.defineProperty(window, 'pageYOffset', { value: 100, writable: true })

      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      fireEvent.click(link)

      expect(mockScrollTo).toHaveBeenCalledWith(
        expect.objectContaining({
          top: expect.any(Number),
          behavior: 'smooth'
        })
      )
    })
  })
})
