import { render, screen } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

describe('TableOfContents', () => {
  const mockHeadings: TocHeading[] = [
    { id: 'introduction', text: 'Introduction', level: 2 },
    { id: 'installation', text: 'Installation', level: 2 },
    { id: 'configuration', text: 'Configuration', level: 3 },
    { id: 'advanced-options', text: 'Advanced Options', level: 4 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
    })

    it('should have navigation landmark', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should have aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Daftar Isi')
    })
  })

  describe('Empty state', () => {
    it('should return null when headings is empty array', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Indentation', () => {
    it('should indent h3 more than h2', () => {
      const headings: TocHeading[] = [
        { id: 'h2', text: 'Heading 2', level: 2 },
        { id: 'h3', text: 'Heading 3', level: 3 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveClass('pl-0')
      expect(links[1]).toHaveClass('pl-4')
    })
  })
})
