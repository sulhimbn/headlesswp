import { render, screen } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

describe('TableOfContents Component', () => {
  const mockHeadings: TocHeading[] = [
    { id: 'intro', text: 'Introduction', level: 2 },
    { id: 'section1', text: 'Section 1', level: 2 },
    { id: 'subsection1', text: 'Subsection 1.1', level: 3 },
    { id: 'section2', text: 'Section 2', level: 2 },
  ]

  describe('Rendering', () => {
    test('renders TableOfContents with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Section 1')).toBeInTheDocument()
    })

    test('renders nothing when headings is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container).toBeEmptyDOMElement()
    })

    test('applies custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
    })

    test('renders correct heading count', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(4)
    })
  })

  describe('Accessibility', () => {
    test('has proper aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label')
    })

    test('links have proper href attributes', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', '#intro')
      expect(links[1]).toHaveAttribute('href', '#section1')
    })
  })

  describe('Level-based Styling', () => {
    test('applies correct indentation for different levels', () => {
      const headingsWithLevels: TocHeading[] = [
        { id: 'h2', text: 'Level 2', level: 2 },
        { id: 'h3', text: 'Level 3', level: 3 },
        { id: 'h4', text: 'Level 4', level: 4 },
      ]
      render(<TableOfContents headings={headingsWithLevels} />)
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveClass('pl-0')
      expect(links[1]).toHaveClass('pl-4')
      expect(links[2]).toHaveClass('pl-8')
    })
  })

  describe('Edge Cases', () => {
    test('handles headings with undefined level', () => {
      const headings: TocHeading[] = [
        { id: 'test', text: 'Test', level: 0 },
      ]
      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-0')
    })

    test('handles very long heading text', () => {
      const longHeading = { id: 'long', text: 'A'.repeat(200), level: 2 }
      render(<TableOfContents headings={[longHeading]} />)
      expect(screen.getByText(/^A{200}/)).toBeInTheDocument()
    })
  })
})