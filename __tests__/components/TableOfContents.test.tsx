import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

describe('TableOfContents', () => {
  const mockHeadings: TocHeading[] = [
    { id: 'intro', text: 'Introduction', level: 2 },
    { id: 'section-1', text: 'Section 1', level: 2 },
    { id: 'subsection-1-1', text: 'Subsection 1.1', level: 3 },
    { id: 'section-2', text: 'Section 2', level: 2 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    global.scrollTo = jest.fn()
    global.document.getElementById = jest.fn().mockImplementation((id: string) => {
      if (id === 'intro') {
        return { getBoundingClientRect: () => ({ top: 100 }) }
      }
      return null
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Section 1')).toBeInTheDocument()
      expect(screen.getByText('Subsection 1.1')).toBeInTheDocument()
      expect(screen.getByText('Section 2')).toBeInTheDocument()
    })

    it('should not render when headings is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should apply custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
    })

    it('should have correct heading levels with indentation', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveClass('pl-0')
      expect(links[1]).toHaveClass('pl-0')
      expect(links[2]).toHaveClass('pl-4')
      expect(links[3]).toHaveClass('pl-0')
    })
  })

  describe('Click handling', () => {
    it('should scroll to element on click', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByRole('link', { name: 'Introduction' })
      fireEvent.click(link)
      
      expect(global.scrollTo).toHaveBeenCalled()
    })

    it('should prevent default and scroll when element exists', () => {
      const mockGetElementById = jest.fn().mockReturnValue({
        getBoundingClientRect: () => ({ top: 100 }),
      })
      global.document.getElementById = mockGetElementById

      const preventDefault = jest.fn()
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByRole('link', { name: 'Introduction' })
      fireEvent.click(link, { defaultPrevented: false })
      
      expect(global.scrollTo).toHaveBeenCalled()
    })

    it('should handle click on non-existent element', () => {
      global.document.getElementById = jest.fn().mockReturnValue(null)

      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByRole('link', { name: 'Section 1' })
      fireEvent.click(link)
      
      expect(global.scrollTo).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have navigation role', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should have aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Daftar Isi')
    })

    it('should have accessible link names', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('link', { name: 'Introduction' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Section 1' })).toBeInTheDocument()
    })

    it('links should have correct hrefs', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveAttribute('href', '#intro')
    })
  })

  describe('Edge cases', () => {
    it('should handle single heading', () => {
      render(<TableOfContents headings={[{ id: 'test', text: 'Test', level: 2 }]} />)
      
      expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('should handle deep heading levels', () => {
      const deepHeadings: TocHeading[] = [
        { id: 'h2', text: 'H2', level: 2 },
        { id: 'h3', text: 'H3', level: 3 },
        { id: 'h4', text: 'H4', level: 4 },
        { id: 'h5', text: 'H5', level: 5 },
        { id: 'h6', text: 'H6', level: 6 },
      ]
      
      render(<TableOfContents headings={deepHeadings} />)
      
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveClass('pl-0')
      expect(links[1]).toHaveClass('pl-4')
      expect(links[2]).toHaveClass('pl-8')
      expect(links[3]).toHaveClass('pl-12')
      expect(links[4]).toHaveClass('pl-16')
    })
  })
})
