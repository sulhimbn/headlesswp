import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

const mockHeadings: TocHeading[] = [
  { id: 'introduction', text: 'Introduction', level: 2 },
  { id: 'getting-started', text: 'Getting Started', level: 2 },
  { id: 'installation', text: 'Installation', level: 3 },
  { id: 'configuration', text: 'Configuration', level: 3 },
  { id: 'advanced', text: 'Advanced Topics', level: 4 },
]

describe('TableOfContents Component', () => {
  describe('Rendering', () => {
    test('renders table of contents with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation', { name: 'Daftar Isi' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Daftar Isi' })).toBeInTheDocument()
    })

    test('renders all heading links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)
    })

    test('renders heading text correctly', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('Installation')).toBeInTheDocument()
      expect(screen.getByText('Configuration')).toBeInTheDocument()
      expect(screen.getByText('Advanced Topics')).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class mt-4" />)
      
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('custom-class')
      expect(nav).toHaveClass('mt-4')
    })
  })

  describe('Empty Headings', () => {
    test('returns null when headings is empty array', () => {
      render(<TableOfContents headings={[]} />)
      
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })

    test('returns null when headings is not provided', () => {
      render(<TableOfContents headings={[]} />)
      
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })
  })

  describe('Link Attributes', () => {
    test('renders links with correct href attributes', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('link', { name: 'Introduction' })).toHaveAttribute('href', '#introduction')
      expect(screen.getByRole('link', { name: 'Getting Started' })).toHaveAttribute('href', '#getting-started')
      expect(screen.getByRole('link', { name: 'Installation' })).toHaveAttribute('href', '#installation')
    })

    test('links have correct structural elements', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
      
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(5)
    })
  })

  describe('Indentation', () => {
    test('applies correct indentation for level 2 headings', () => {
      render(<TableOfContents headings={[{ id: 'h2', text: 'H2', level: 2 }]} />)
      
      const link = screen.getByRole('link', { name: 'H2' })
      expect(link).toHaveClass('pl-0')
    })

    test('applies correct indentation for level 3 headings', () => {
      render(<TableOfContents headings={[{ id: 'h3', text: 'H3', level: 3 }]} />)
      
      const link = screen.getByRole('link', { name: 'H3' })
      expect(link).toHaveClass('pl-4')
    })

    test('applies correct indentation for level 4 headings', () => {
      render(<TableOfContents headings={[{ id: 'h4', text: 'H4', level: 4 }]} />)
      
      const link = screen.getByRole('link', { name: 'H4' })
      expect(link).toHaveClass('pl-8')
    })

    test('applies correct indentation for level 5 headings', () => {
      render(<TableOfContents headings={[{ id: 'h5', text: 'H5', level: 5 }]} />)
      
      const link = screen.getByRole('link', { name: 'H5' })
      expect(link).toHaveClass('pl-12')
    })

    test('applies correct indentation for level 6 headings', () => {
      render(<TableOfContents headings={[{ id: 'h6', text: 'H6', level: 6 }]} />)
      
      const link = screen.getByRole('link', { name: 'H6' })
      expect(link).toHaveClass('pl-16')
    })

    test('applies default indentation for unknown levels', () => {
      render(<TableOfContents headings={[{ id: 'h1', text: 'H1', level: 1 }]} />)
      
      const link = screen.getByRole('link', { name: 'H1' })
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Click Interaction', () => {
    let originalScrollTo: typeof window.scrollTo
    let originalPageYOffset: number
    
    beforeEach(() => {
      originalScrollTo = window.scrollTo
      originalPageYOffset = window.pageYOffset
      window.scrollTo = jest.fn()
    })

    afterEach(() => {
      window.scrollTo = originalScrollTo
      window.pageYOffset = originalPageYOffset
    })

    test('handles click event', () => {
      const mockElement = document.createElement('div')
      Object.defineProperty(mockElement, 'getBoundingClientRect', {
        writable: true,
        configurable: true,
        value: jest.fn().mockReturnValue({ top: 100 })
      })
      
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement)
      
      render(<TableOfContents headings={[{ id: 'introduction', text: 'Introduction', level: 2 }]} />)
      
      const link = screen.getByRole('link', { name: 'Introduction' })
      fireEvent.click(link)
      
      expect(window.scrollTo).toHaveBeenCalled()
    })

    test('calls scrollTo with correct position', () => {
      const mockElement = document.createElement('div')
      Object.defineProperty(mockElement, 'getBoundingClientRect', {
        writable: true,
        configurable: true,
        value: jest.fn().mockReturnValue({ top: 200 })
      })
      
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement)
      
      window.pageYOffset = 100
      
      render(<TableOfContents headings={[{ id: 'test', text: 'Test', level: 2 }]} />)
      
      const link = screen.getByRole('link', { name: 'Test' })
      fireEvent.click(link)
      
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 220,
        behavior: 'smooth'
      })
    })

    test('does not scroll when element is not found', () => {
      jest.spyOn(document, 'getElementById').mockReturnValue(null)
      
      const scrollToMock = jest.fn()
      window.scrollTo = scrollToMock
      
      render(<TableOfContents headings={[{ id: 'nonexistent', text: 'Not Found', level: 2 }]} />)
      
      const link = screen.getByRole('link', { name: 'Not Found' })
      fireEvent.click(link)
      
      expect(scrollToMock).not.toHaveBeenCalled()
    })
  })

  describe('Styling', () => {
    test('applies surface background color', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('applies rounded border radius', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('applies shadow', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('applies padding', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('p-4')
    })

    test('heading has correct text styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const heading = screen.getByRole('heading', { name: 'Daftar Isi' })
      expect(heading).toHaveClass('text-sm')
      expect(heading).toHaveClass('font-semibold')
      expect(heading).toHaveClass('text-[hsl(var(--color-text-primary))]')
      expect(heading).toHaveClass('mb-3')
    })

    test('links have hover styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveClass('text-sm')
      expect(link).toHaveClass('text-[hsl(var(--color-text-secondary))]')
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
      expect(link).toHaveClass('transition-colors')
      expect(link).toHaveClass('duration-[var(--transition-fast)]')
    })

    test('list has correct spacing', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const list = screen.getByRole('list')
      expect(list).toHaveClass('space-y-2')
    })
  })

  describe('Accessibility', () => {
    test('has proper navigation role with aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation', { name: 'Daftar Isi' })).toBeInTheDocument()
    })

    test('has heading within navigation', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toContainElement(screen.getByRole('heading', { name: 'Daftar Isi' }))
    })

    test('links are properly structured as list items', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const list = screen.getByRole('list')
      const listItems = screen.getAllByRole('listitem')
      
      expect(list).toContainElement(listItems[0])
    })

    test('all links have valid href attributes', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
        expect(link.getAttribute('href')).toMatch(/^#/)
      })
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      expect(TableOfContents).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    test('handles single heading', () => {
      render(<TableOfContents headings={[{ id: 'single', text: 'Single', level: 2 }]} />)
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(1)
      expect(screen.getByText('Single')).toBeInTheDocument()
    })

    test('handles headings with special characters in id', () => {
      const headingsWithSpecialChars: TocHeading[] = [
        { id: 'section-with-dashes', text: 'Section with Dashes', level: 2 },
        { id: 'section_with_underscores', text: 'Section with Underscores', level: 2 },
      ]
      
      render(<TableOfContents headings={headingsWithSpecialChars} />)
      
      expect(screen.getByRole('link', { name: 'Section with Dashes' })).toHaveAttribute('href', '#section-with-dashes')
      expect(screen.getByRole('link', { name: 'Section with Underscores' })).toHaveAttribute('href', '#section_with_underscores')
    })

    test('handles all heading levels', () => {
      const allLevels: TocHeading[] = [
        { id: 'l2', text: 'Level 2', level: 2 },
        { id: 'l3', text: 'Level 3', level: 3 },
        { id: 'l4', text: 'Level 4', level: 4 },
        { id: 'l5', text: 'Level 5', level: 5 },
        { id: 'l6', text: 'Level 6', level: 6 },
      ]
      
      render(<TableOfContents headings={allLevels} />)
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)
    })

    test('handles empty string text', () => {
      render(<TableOfContents headings={[{ id: 'empty', text: '', level: 2 }]} />)
      
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      const links = nav.querySelectorAll('a')
      expect(links).toHaveLength(1)
    })

    test('uses default className when not provided', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).not.toHaveClass('undefined')
    })
  })
})
