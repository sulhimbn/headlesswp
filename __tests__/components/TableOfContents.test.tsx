import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

describe('TableOfContents Component', () => {
  const mockHeadings: TocHeading[] = [
    { id: 'intro', text: 'Introduction', level: 2 },
    { id: 'section-1', text: 'Section 1', level: 2 },
    { id: 'subsection-1', text: 'Subsection 1.1', level: 3 },
    { id: 'section-2', text: 'Section 2', level: 2 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders null when headings array is empty', () => {
    const { container } = render(<TableOfContents headings={[]} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders null when headings array is not provided', () => {
    const { container } = render(<TableOfContents headings={[]} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders the table of contents with headings', () => {
    render(<TableOfContents headings={mockHeadings} />)
    
    expect(screen.getByRole('navigation', { name: /daftar isi/i })).toBeInTheDocument()
    expect(screen.getByText('Introduction')).toBeInTheDocument()
    expect(screen.getByText('Section 1')).toBeInTheDocument()
    expect(screen.getByText('Subsection 1.1')).toBeInTheDocument()
    expect(screen.getByText('Section 2')).toBeInTheDocument()
  })

  test('renders list items correctly', () => {
    render(<TableOfContents headings={mockHeadings} />)
    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(4)
  })

  test('generates correct href for each heading', () => {
    render(<TableOfContents headings={mockHeadings} />)
    
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '#intro')
    expect(links[1]).toHaveAttribute('href', '#section-1')
    expect(links[2]).toHaveAttribute('href', '#subsection-1')
    expect(links[3]).toHaveAttribute('href', '#section-2')
  })

  test('handles click event on heading link', () => {
    const scrollToMock = jest.fn()
    const getElementByIdMock = jest.fn().mockReturnValue({
      getBoundingClientRect: () => ({ top: 100 }),
    })
    
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true })
    Object.defineProperty(window, 'scrollTo', { value: scrollToMock, writable: true })
    document.getElementById = getElementByIdMock

    render(<TableOfContents headings={mockHeadings} />)
    
    const firstLink = screen.getByRole('link', { name: 'Introduction' })
    fireEvent.click(firstLink)
    
    expect(scrollToMock).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: 'smooth'
    })
  })

  test('handles missing element gracefully', () => {
    const scrollToMock = jest.fn()
    const getElementByIdMock = jest.fn().mockReturnValue(null)
    
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true })
    Object.defineProperty(window, 'scrollTo', { value: scrollToMock, writable: true })
    document.getElementById = getElementByIdMock

    render(<TableOfContents headings={mockHeadings} />)
    
    const firstLink = screen.getByRole('link', { name: 'Introduction' })
    fireEvent.click(firstLink)
    
    expect(scrollToMock).not.toHaveBeenCalled()
  })

  test('applies correct indentation for different heading levels', () => {
    const headingsWithLevels: TocHeading[] = [
      { id: 'h2', text: 'Heading 2', level: 2 },
      { id: 'h3', text: 'Heading 3', level: 3 },
      { id: 'h4', text: 'Heading 4', level: 4 },
      { id: 'h5', text: 'Heading 5', level: 5 },
      { id: 'h6', text: 'Heading 6', level: 6 },
    ]

    render(<TableOfContents headings={headingsWithLevels} />)
    
    const links = screen.getAllByRole('link')
    
    expect(links[0]).toHaveClass('pl-0')
    expect(links[1]).toHaveClass('pl-4')
    expect(links[2]).toHaveClass('pl-8')
    expect(links[3]).toHaveClass('pl-12')
    expect(links[4]).toHaveClass('pl-16')
  })

  test('handles unknown heading level with default indentation', () => {
    const headingsWithUnknownLevel: TocHeading[] = [
      { id: 'h1', text: 'Heading 1', level: 1 },
      { id: 'h7', text: 'Heading 7', level: 7 },
    ]

    render(<TableOfContents headings={headingsWithUnknownLevel} />)
    
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveClass('pl-0')
    expect(links[1]).toHaveClass('pl-0')
  })

  test('renders with custom className', () => {
    const { container } = render(
      <TableOfContents headings={mockHeadings} className="custom-class" />
    )
    
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('custom-class')
  })

  test('contains correct ARIA label', () => {
    render(<TableOfContents headings={mockHeadings} />)
    
    expect(screen.getByRole('navigation', { name: /daftar isi/i })).toBeInTheDocument()
  })

  test('renders heading text correctly', () => {
    render(<TableOfContents headings={mockHeadings} />)
    
    expect(screen.getByText('Introduction')).toBeInTheDocument()
    expect(screen.getByText('Section 1')).toBeInTheDocument()
    expect(screen.getByText('Subsection 1.1')).toBeInTheDocument()
    expect(screen.getByText('Section 2')).toBeInTheDocument()
  })

  test('handles single heading', () => {
    const singleHeading: TocHeading[] = [
      { id: 'only', text: 'Only Heading', level: 2 },
    ]

    render(<TableOfContents headings={singleHeading} />)
    
    expect(screen.getByText('Only Heading')).toBeInTheDocument()
    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(1)
  })

  test('handles many headings', () => {
    const manyHeadings: TocHeading[] = Array.from({ length: 20 }, (_, i) => ({
      id: `heading-${i}`,
      text: `Heading ${i}`,
      level: 2,
    }))

    render(<TableOfContents headings={manyHeadings} />)
    
    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(20)
  })

  test('prevents default on click', () => {
    const scrollToMock = jest.fn()
    const getElementByIdMock = jest.fn().mockReturnValue({
      getBoundingClientRect: () => ({ top: 100 }),
    })
    
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true })
    Object.defineProperty(window, 'scrollTo', { value: scrollToMock, writable: true })
    document.getElementById = getElementByIdMock

    const preventDefaultMock = jest.fn()
    
    render(<TableOfContents headings={mockHeadings} />)
    
    const firstLink = screen.getByRole('link', { name: 'Introduction' })
    fireEvent.click(firstLink, { defaultPrevented: false })
    
    expect(scrollToMock).toHaveBeenCalled()
  })
})
