import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import { UI_TEXT } from '@/lib/constants/uiText'
import type { TocHeading } from '@/lib/utils/tableOfContents'

const mockScrollTo = jest.fn()
Object.defineProperty(window, 'scrollTo', {
  value: mockScrollTo,
  writable: true,
})

const mockHeadings: TocHeading[] = [
  { id: 'intro', text: 'Introduction', level: 2 },
  { id: 'getting-started', text: 'Getting Started', level: 2 },
  { id: 'installation', text: 'Installation', level: 3 },
  { id: 'configuration', text: 'Configuration', level: 3 },
  { id: 'advanced', text: 'Advanced Topics', level: 2 },
]

describe('TableOfContents Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders nav element with correct aria-label', () => {
    render(<TableOfContents headings={mockHeadings} />)
    expect(screen.getByRole('navigation', { name: UI_TEXT.postDetail.tableOfContents })).toBeInTheDocument()
  })

  test('renders all headings as links', () => {
    render(<TableOfContents headings={mockHeadings} />)
    expect(screen.getAllByRole('link')).toHaveLength(mockHeadings.length)
  })

  test('renders nothing when headings array is empty', () => {
    render(<TableOfContents headings={[]} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  test('applies correct indentation for different levels', () => {
    render(<TableOfContents headings={mockHeadings} />)
    expect(screen.getByText('Introduction')).toHaveClass('pl-0')
    expect(screen.getByText('Installation')).toHaveClass('pl-4')
  })

  test('links have correct href', () => {
    render(<TableOfContents headings={mockHeadings} />)
    const link = screen.getByRole('link', { name: 'Introduction' })
    expect(link).toHaveAttribute('href', '#intro')
  })

  test('applies custom className', () => {
    render(<TableOfContents headings={mockHeadings} className="custom-class" />)
    expect(screen.getByRole('navigation')).toHaveClass('custom-class')
  })
})
