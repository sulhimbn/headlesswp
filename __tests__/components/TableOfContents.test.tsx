'use client'

import { render, screen } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

describe('TableOfContents', () => {
  const mockHeadings: TocHeading[] = [
    { id: 'heading-1', text: 'Introduction', level: 2 },
    { id: 'heading-2', text: 'Getting Started', level: 2 },
    { id: 'heading-3', text: 'Sub Section', level: 3 },
  ]

  it('should return null when headings array is empty', () => {
    const { container } = render(<TableOfContents headings={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('should render all headings', () => {
    render(<TableOfContents headings={mockHeadings} />)

    expect(screen.getByText('Introduction')).toBeInTheDocument()
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
    expect(screen.getByText('Sub Section')).toBeInTheDocument()
  })

  it('should render correct hrefs for each heading', () => {
    render(<TableOfContents headings={mockHeadings} />)

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '#heading-1')
    expect(links[1]).toHaveAttribute('href', '#heading-2')
    expect(links[2]).toHaveAttribute('href', '#heading-3')
  })

  it('should apply custom className', () => {
    const { container } = render(<TableOfContents headings={mockHeadings} className="custom-class" />)
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('custom-class')
  })
})