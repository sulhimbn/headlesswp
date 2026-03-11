import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

const mockHeadings: TocHeading[] = [
  { id: 'intro', text: 'Introduction', level: 2 },
  { id: 'getting-started', text: 'Getting Started', level: 2 },
  { id: 'installation', text: 'Installation', level: 3 },
  { id: 'configuration', text: 'Configuration', level: 3 },
  { id: 'advanced', text: 'Advanced', level: 4 },
]

describe('TableOfContents Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Daftar Isi' })).toBeInTheDocument()
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('Installation')).toBeInTheDocument()
    })

    test('renders correct number of heading links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)
    })
  })

  describe('Empty Headings', () => {
    test('returns null when headings array is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      
      expect(container.firstChild).toBeNull()
    })

    test('returns null when headings is not provided', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Click Handling', () => {
    beforeEach(() => {
      const mockElement = {
        getBoundingClientRect: () => ({ top: 100 }),
      }
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as HTMLElement)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('calls scrollTo on click', () => {
      const scrollToMock = jest.fn()
      window.scrollTo = scrollToMock
      
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      fireEvent.click(link)
      
      expect(scrollToMock).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth'
      })
    })

    test('scrolls to correct element by id', () => {
      const scrollToMock = jest.fn()
      window.scrollTo = scrollToMock
      
      const mockElement = {
        getBoundingClientRect: () => ({ top: 100 }),
      }
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as HTMLElement)
      
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      fireEvent.click(link)
      
      expect(document.getElementById).toHaveBeenCalledWith('intro')
    })
  })

  describe('Indentation', () => {
    test('applies correct indentation for h2 (level 2)', () => {
      render(<TableOfContents headings={[{ id: 'h2', text: 'H2', level: 2 }]} />)
      
      const link = screen.getByText('H2')
      expect(link).toHaveClass('pl-0')
    })

    test('applies correct indentation for h3 (level 3)', () => {
      render(<TableOfContents headings={[{ id: 'h3', text: 'H3', level: 3 }]} />)
      
      const link = screen.getByText('H3')
      expect(link).toHaveClass('pl-4')
    })

    test('applies correct indentation for h4 (level 4)', () => {
      render(<TableOfContents headings={[{ id: 'h4', text: 'H4', level: 4 }]} />)
      
      const link = screen.getByText('H4')
      expect(link).toHaveClass('pl-8')
    })

    test('applies correct indentation for h5 (level 5)', () => {
      render(<TableOfContents headings={[{ id: 'h5', text: 'H5', level: 5 }]} />)
      
      const link = screen.getByText('H5')
      expect(link).toHaveClass('pl-12')
    })

    test('applies correct indentation for h6 (level 6)', () => {
      render(<TableOfContents headings={[{ id: 'h6', text: 'H6', level: 6 }]} />)
      
      const link = screen.getByText('H6')
      expect(link).toHaveClass('pl-16')
    })

    test('applies default indentation for unknown level', () => {
      render(<TableOfContents headings={[{ id: 'unknown', text: 'Unknown', level: 7 }]} />)
      
      const link = screen.getByText('Unknown')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Accessibility', () => {
    test('has nav element with navigation role', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    test('has aria-label on nav element', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Daftar Isi')
    })

    test('has heading within nav', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('heading', { name: 'Daftar Isi' })).toBeInTheDocument()
    })

    test('links have correct href attributes', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', '#intro')
      expect(links[1]).toHaveAttribute('href', '#getting-started')
    })
  })

  describe('Memoization', () => {
    test('does not re-render with same props', () => {
      const { rerender } = render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      
      rerender(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByText('Introduction')).toBeInTheDocument()
    })
  })

  describe('Custom ClassName', () => {
    test('applies custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
    })

    test('applies default className when not provided', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })
  })
})
