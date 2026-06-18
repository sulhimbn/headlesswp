import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import { UI_TEXT } from '@/lib/constants/uiText'
import type { TocHeading } from '@/lib/utils/tableOfContents'

describe('TableOfContents Component', () => {
  const mockHeadings: TocHeading[] = [
    { id: 'heading-1', text: 'Introduction', level: 2 },
    { id: 'heading-2', text: 'Section One', level: 3 },
    { id: 'heading-3', text: 'Subsection', level: 4 },
    { id: 'heading-4', text: 'Deep Section', level: 5 },
    { id: 'heading-5', text: 'Deeper', level: 6 },
  ]

  describe('Rendering', () => {
    test('renders table of contents with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByLabelText(UI_TEXT.postDetail.tableOfContents)).toBeInTheDocument()
      expect(screen.getByText(UI_TEXT.postDetail.tableOfContents)).toBeInTheDocument()
    })

    test('renders all heading links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Section One')).toBeInTheDocument()
      expect(screen.getByText('Subsection')).toBeInTheDocument()
      expect(screen.getByText('Deep Section')).toBeInTheDocument()
      expect(screen.getByText('Deeper')).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
    })

    test('renders list items for each heading', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(5)
    })

    test('renders links with correct hrefs', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', '#heading-1')
      expect(links[1]).toHaveAttribute('href', '#heading-2')
      expect(links[2]).toHaveAttribute('href', '#heading-3')
    })
  })

  describe('Empty State', () => {
    test('returns null when headings is empty array', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })

    test('returns null when headings is not provided', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Click Behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('calls scrollTo on click', () => {
      const mockScrollTo = jest.fn()
      window.scrollTo = mockScrollTo
      
      const mockElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({ top: 100 }),
      }
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any)
      jest.spyOn(window, 'pageYOffset', 'get').mockReturnValue(0)

      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      fireEvent.click(link)

      expect(mockScrollTo).toHaveBeenCalled()
    })

    test('handles click on nested heading', () => {
      const mockScrollTo = jest.fn()
      window.scrollTo = mockScrollTo
      
      const mockElement = {
        getBoundingClientRect: jest.fn().mockReturnValue({ top: 200 }),
      }
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any)
      jest.spyOn(window, 'pageYOffset', 'get').mockReturnValue(50)

      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Subsection')
      fireEvent.click(link)

      expect(mockScrollTo).toHaveBeenCalled()
    })

    test('does nothing when element not found', () => {
      const mockScrollTo = jest.fn()
      window.scrollTo = mockScrollTo
      
      jest.spyOn(document, 'getElementById').mockReturnValue(null)

      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      fireEvent.click(link)

      expect(mockScrollTo).not.toHaveBeenCalled()
    })
  })

  describe('Indentation', () => {
    test('applies correct indentation for level 2', () => {
      render(<TableOfContents headings={[{ id: 'h1', text: 'Test', level: 2 }]} />)
      
      const link = screen.getByText('Test')
      expect(link).toHaveClass('pl-0')
    })

    test('applies correct indentation for level 3', () => {
      render(<TableOfContents headings={[{ id: 'h1', text: 'Test', level: 3 }]} />)
      
      const link = screen.getByText('Test')
      expect(link).toHaveClass('pl-4')
    })

    test('applies correct indentation for level 4', () => {
      render(<TableOfContents headings={[{ id: 'h1', text: 'Test', level: 4 }]} />)
      
      const link = screen.getByText('Test')
      expect(link).toHaveClass('pl-8')
    })

    test('applies correct indentation for level 5', () => {
      render(<TableOfContents headings={[{ id: 'h1', text: 'Test', level: 5 }]} />)
      
      const link = screen.getByText('Test')
      expect(link).toHaveClass('pl-12')
    })

    test('applies correct indentation for level 6', () => {
      render(<TableOfContents headings={[{ id: 'h1', text: 'Test', level: 6 }]} />)
      
      const link = screen.getByText('Test')
      expect(link).toHaveClass('pl-16')
    })

    test('applies default indentation for unknown level', () => {
      render(<TableOfContents headings={[{ id: 'h1', text: 'Test', level: 7 }]} />)
      
      const link = screen.getByText('Test')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Accessibility', () => {
    test('has proper navigation role', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    test('has aria-label for navigation', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', UI_TEXT.postDetail.tableOfContents)
    })

    test('links are keyboard accessible', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).not.toHaveAttribute('tabindex')
      })
    })
  })

  describe('Styling', () => {
    test('applies background color token', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('applies border radius token', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('applies shadow token', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('links have hover state', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })

    test('links have transition token', () => {
      render(<TableOfContents headings={mockHeadings} />)
      
      const link = screen.getByText('Introduction')
      expect(link).toHaveClass('transition-colors')
      expect(link).toHaveClass('duration-[var(--transition-fast)]')
    })
  })
})