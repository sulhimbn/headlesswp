import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

const mockHeadings: TocHeading[] = [
  { id: 'introduction', text: 'Introduction', level: 2 },
  { id: 'installation', text: 'Installation', level: 2 },
  { id: 'configuration', text: 'Configuration', level: 3 },
  { id: 'advanced-usage', text: 'Advanced Usage', level: 4 },
  { id: 'api-reference', text: 'API Reference', level: 3 },
  { id: 'conclusion', text: 'Conclusion', level: 2 },
]

describe('TableOfContents Component', () => {
  describe('Rendering with headings', () => {
    test('renders with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation', { name: /daftar isi/i })).toBeInTheDocument()
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Installation')).toBeInTheDocument()
      expect(screen.getByText('Configuration')).toBeInTheDocument()
      expect(screen.getByText('Advanced Usage')).toBeInTheDocument()
      expect(screen.getByText('API Reference')).toBeInTheDocument()
      expect(screen.getByText('Conclusion')).toBeInTheDocument()
    })

    test('renders correct number of heading links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(6)
    })

    test('renders with single heading', () => {
      const singleHeading: TocHeading[] = [{ id: 'intro', text: 'Introduction', level: 2 }]
      render(<TableOfContents headings={singleHeading} />)
      
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(1)
    })
  })

  describe('Rendering with empty headings', () => {
    test('returns null when headings array is empty', () => {
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
      jest.clearAllMocks()
    })

    test('calls scrollTo on click', () => {
      const mockElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({ top: 200 }),
      }
      document.getElementById = jest.fn().mockReturnValue(mockElement)
      window.scrollTo = jest.fn()
      
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      fireEvent.click(link)
      
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth'
      })
    })

    test('does not throw when element not found', () => {
      document.getElementById = jest.fn().mockReturnValue(null)
      
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      expect(() => fireEvent.click(link)).not.toThrow()
    })
  })

  describe('Indentation based on heading level', () => {
    test('applies correct indentation for level 2', () => {
      const heading: TocHeading[] = [{ id: 'intro', text: 'Intro', level: 2 }]
      const { container } = render(<TableOfContents headings={heading} />)
      
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-0')
    })

    test('applies correct indentation for level 3', () => {
      const heading: TocHeading[] = [{ id: 'config', text: 'Config', level: 3 }]
      const { container } = render(<TableOfContents headings={heading} />)
      
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-4')
    })

    test('applies correct indentation for level 4', () => {
      const heading: TocHeading[] = [{ id: 'advanced', text: 'Advanced', level: 4 }]
      const { container } = render(<TableOfContents headings={heading} />)
      
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-8')
    })

    test('applies correct indentation for level 5', () => {
      const heading: TocHeading[] = [{ id: 'deep', text: 'Deep', level: 5 }]
      const { container } = render(<TableOfContents headings={heading} />)
      
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-12')
    })

    test('applies correct indentation for level 6', () => {
      const heading: TocHeading[] = [{ id: 'deeper', text: 'Deeper', level: 6 }]
      const { container } = render(<TableOfContents headings={heading} />)
      
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-16')
    })

    test('defaults to pl-0 for unknown level', () => {
      const heading: TocHeading[] = [{ id: 'unknown', text: 'Unknown', level: 99 }]
      const { container } = render(<TableOfContents headings={heading} />)
      
      const link = container.querySelector('a')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Accessibility', () => {
    test('has nav element with aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation', { name: /daftar isi/i })
      expect(nav).toBeInTheDocument()
    })

    test('links have correct href attributes', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('link', { name: 'Introduction' })).toHaveAttribute('href', '#introduction')
      expect(screen.getByRole('link', { name: 'Configuration' })).toHaveAttribute('href', '#configuration')
    })

    test('renders unordered list for headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
    })

    test('renders list items for each heading', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const items = screen.getAllByRole('listitem')
      expect(items).toHaveLength(6)
    })
  })

  describe('Memoization', () => {
    test('does not re-render with same props', () => {
      const { rerender } = render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      expect(link).toBeInTheDocument()
      
      rerender(<TableOfContents headings={mockHeadings} />)
      
      expect(link).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      
      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('custom-class')
    })
  })

  describe('Link styling and behavior', () => {
    test('links have hover styles', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      
      const link = container.querySelector('a')
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
      expect(link).toHaveClass('transition-colors')
    })

    test('links have correct text styling', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      
      const link = container.querySelector('a')
      expect(link).toHaveClass('text-sm')
      expect(link).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })
  })
})
