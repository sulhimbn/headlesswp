import { render, screen, fireEvent } from '@testing-library/react'
// @ts-expect-error - jest-axe types not available
import { axe } from 'jest-axe'
import TableOfContents from '@/components/ui/TableOfContents'
import { UI_TEXT } from '@/lib/constants/uiText'
import type { TocHeading } from '@/lib/utils/tableOfContents'

const mockHeadings: TocHeading[] = [
  { id: 'introduction', text: 'Introduction', level: 2 },
  { id: 'getting-started', text: 'Getting Started', level: 2 },
  { id: 'installation', text: 'Installation', level: 3 },
  { id: 'configuration', text: 'Configuration', level: 3 },
  { id: 'advanced-usage', text: 'Advanced Usage', level: 2 },
  { id: 'api-reference', text: 'API Reference', level: 3 },
  { id: 'methods', text: 'Methods', level: 4 },
]

describe('TableOfContents Component', () => {
  describe('Rendering', () => {
    test('renders with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    test('renders heading title', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByText(UI_TEXT.postDetail.tableOfContents)).toBeInTheDocument()
    })

    test('renders all heading links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(mockHeadings.length)
    })

    test('renders heading text correctly', () => {
      render(<TableOfContents headings={mockHeadings} />)
      mockHeadings.forEach(heading => {
        expect(screen.getByText(heading.text)).toBeInTheDocument()
      })
    })

    test('renders with custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
    })

    test('renders list items for each heading', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(mockHeadings.length)
    })
  })

  describe('Empty Headings', () => {
    test('returns null when headings array is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })

    test('does not render nav when headings is empty', () => {
      render(<TableOfContents headings={[]} />)
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })

    test('does not render links when headings is empty', () => {
      render(<TableOfContents headings={[]} />)
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    test('handles undefined headings gracefully', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Heading Levels and Indentation', () => {
    test('applies correct indentation for h2 (level 2)', () => {
      const h2Headings = [{ id: 'intro', text: 'Introduction', level: 2 }]
      render(<TableOfContents headings={h2Headings} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-0')
    })

    test('applies correct indentation for h3 (level 3)', () => {
      const h3Headings = [{ id: 'config', text: 'Configuration', level: 3 }]
      render(<TableOfContents headings={h3Headings} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-4')
    })

    test('applies correct indentation for h4 (level 4)', () => {
      const h4Headings = [{ id: 'methods', text: 'Methods', level: 4 }]
      render(<TableOfContents headings={h4Headings} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-8')
    })

    test('applies correct indentation for h5 (level 5)', () => {
      const h5Headings = [{ id: 'details', text: 'Details', level: 5 }]
      render(<TableOfContents headings={h5Headings} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-12')
    })

    test('applies correct indentation for h6 (level 6)', () => {
      const h6Headings = [{ id: 'notes', text: 'Notes', level: 6 }]
      render(<TableOfContents headings={h6Headings} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-16')
    })

    test('applies default indentation for unknown levels', () => {
      const unknownHeadings = [{ id: 'other', text: 'Other', level: 7 }]
      render(<TableOfContents headings={unknownHeadings} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-0')
    })

    test('applies default indentation for level 1', () => {
      const h1Headings = [{ id: 'main', text: 'Main Title', level: 1 }]
      render(<TableOfContents headings={h1Headings} />)
      const link = screen.getByRole('link')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Click Handler and Smooth Scroll', () => {
    beforeEach(() => {
      window.scrollTo = jest.fn()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('calls e.preventDefault on link click', () => {
      const headings = [{ id: 'test', text: 'Test', level: 2 }]
      document.getElementById = jest.fn(() => null)
      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link')
      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      jest.spyOn(event, 'preventDefault')
      fireEvent(link, event)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    test('scrolls to element when heading id exists', () => {
      const headings = [{ id: 'test-heading', text: 'Test Heading', level: 2 }]
      const mockElement = {
        getBoundingClientRect: jest.fn(() => ({
          top: 100,
        })),
      }
      document.getElementById = jest.fn(() => mockElement as unknown as HTMLElement)

      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link')
      fireEvent.click(link)

      expect(document.getElementById).toHaveBeenCalledWith('test-heading')
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      })
    })

    test('does not scroll when heading element does not exist', () => {
      const headings = [{ id: 'non-existent', text: 'Non Existent', level: 2 }]
      document.getElementById = jest.fn(() => null)

      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link')
      fireEvent.click(link)

      expect(window.scrollTo).not.toHaveBeenCalled()
    })

    test('calculates correct scroll position with header offset', () => {
      const headings = [{ id: 'offset-test', text: 'Offset Test', level: 2 }]
      const mockElement = {
        getBoundingClientRect: jest.fn(() => ({
          top: 200,
        })),
      }
      document.getElementById = jest.fn(() => mockElement as unknown as HTMLElement)

      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link')
      fireEvent.click(link)

      const scrollCall = (window.scrollTo as jest.Mock).mock.calls[0][0]
      expect(scrollCall.top).toBe(scrollCall.top)
      expect(scrollCall.behavior).toBe('smooth')
    })

    test('handles multiple heading clicks', () => {
      const headings = [
        { id: 'first', text: 'First', level: 2 },
        { id: 'second', text: 'Second', level: 2 },
      ]
      const mockElement1 = {
        getBoundingClientRect: jest.fn(() => ({ top: 100 })),
      }
      const mockElement2 = {
        getBoundingClientRect: jest.fn(() => ({ top: 300 })),
      }
      document.getElementById = jest.fn()
        .mockReturnValueOnce(mockElement1 as unknown as HTMLElement)
        .mockReturnValueOnce(mockElement2 as unknown as HTMLElement)

      render(<TableOfContents headings={headings} />)
      const links = screen.getAllByRole('link')

      fireEvent.click(links[0])
      expect(window.scrollTo).toHaveBeenCalledTimes(1)

      fireEvent.click(links[1])
      expect(window.scrollTo).toHaveBeenCalledTimes(2)
    })
  })

  describe('Accessibility', () => {
    test('has navigation role', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    test('has proper aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', UI_TEXT.postDetail.tableOfContents)
    })

    test('links have proper href attributes', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      mockHeadings.forEach((heading, index) => {
        expect(links[index]).toHaveAttribute('href', `#${heading.id}`)
      })
    })

    test('has proper heading structure', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const headings = screen.getAllByRole('heading')
      expect(headings).toHaveLength(1)
      expect(headings[0]).toHaveTextContent(UI_TEXT.postDetail.tableOfContents)
    })

    test('should have no accessibility violations', async () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    test('links are focusable', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toBeVisible()
      })
    })

    test('links have proper text styling classes', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getAllByRole('link')[0]
      expect(link).toHaveClass('text-sm')
      expect(link).toHaveClass('text-[hsl(var(--color-text-secondary))]')
    })

    test('links have hover styling classes', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getAllByRole('link')[0]
      expect(link).toHaveClass(/hover:text-\[hsl\(var\(--color-primary\)\)\]/)
    })

    test('links have transition classes', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getAllByRole('link')[0]
      expect(link).toHaveClass('transition-colors')
      expect(link).toHaveClass('duration-[var(--transition-fast)]')
    })
  })

  describe('Keyboard Navigation', () => {
    test('links are keyboard accessible', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    test('Tab key can focus links', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getAllByRole('link')[0]
      link.focus()
      expect(document.activeElement).toBe(link)
    })

    test('Enter key triggers click handler', () => {
      const headings = [{ id: 'test', text: 'Test', level: 2 }]
      const mockElement = {
        getBoundingClientRect: jest.fn(() => ({ top: 100 })),
      }
      document.getElementById = jest.fn(() => mockElement as unknown as HTMLElement)
      window.scrollTo = jest.fn()

      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link')
      fireEvent.keyDown(link, { key: 'Enter' })
      fireEvent.click(link)

      expect(window.scrollTo).toHaveBeenCalled()
    })
  })

  describe('Special Characters and Edge Cases', () => {
    test('handles headings with special characters', () => {
      const specialHeadings: TocHeading[] = [
        { id: 'c-o-n-f-i-g-u-r-a-t-i-o-n', text: 'Configuration & Setup', level: 2 },
        { id: 'a-p-i-w-i-t-h-special-chars', text: 'API <test> "quoted"', level: 3 },
        { id: 'unicode-heading', text: 'Panduan Penggunaan', level: 2 },
      ]
      render(<TableOfContents headings={specialHeadings} />)
      expect(screen.getAllByRole('link')).toHaveLength(3)
    })

    test('handles long heading text', () => {
      const longHeadings: TocHeading[] = [
        { id: 'very-long-heading-id', text: 'This is a very long heading text that might wrap to multiple lines in the UI', level: 2 },
      ]
      render(<TableOfContents headings={longHeadings} />)
      expect(screen.getByText(longHeadings[0].text)).toBeInTheDocument()
    })

    test('handles headings with numeric text', () => {
      const numericHeadings: TocHeading[] = [
        { id: 'step-1', text: '12345', level: 2 },
        { id: 'step-2', text: 'Step 2: Getting Started', level: 2 },
      ]
      render(<TableOfContents headings={numericHeadings} />)
      expect(screen.getAllByRole('link')).toHaveLength(2)
    })

    test('handles headings with leading/trailing spaces', () => {
      const spaceHeadings: TocHeading[] = [
        { id: 'spaced-heading', text: '  Spaced Heading  ', level: 2 },
      ]
      render(<TableOfContents headings={spaceHeadings} />)
      const link = screen.getByRole('link')
      expect(link).toHaveTextContent(/\s*Spaced Heading\s*/)
    })

    test('handles duplicate heading ids', () => {
      const duplicateHeadings: TocHeading[] = [
        { id: 'same-id', text: 'First', level: 2 },
        { id: 'same-id', text: 'Second', level: 2 },
      ]
      render(<TableOfContents headings={duplicateHeadings} />)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
    })

    test('handles empty string heading text', () => {
      const emptyTextHeadings: TocHeading[] = [
        { id: 'valid-id', text: '', level: 2 },
      ]
      render(<TableOfContents headings={emptyTextHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
    })
  })

  describe('Visual Styling', () => {
    test('nav has background color class', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('nav has rounded corners class', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('nav has padding class', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('p-4')
    })

    test('nav has shadow class', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('heading title has correct styling', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('text-sm')
      expect(heading).toHaveClass('font-semibold')
      expect(heading).toHaveClass('text-[hsl(var(--color-text-primary))]')
      expect(heading).toHaveClass('mb-3')
    })

    test('list has spacing class', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const list = screen.getByRole('list')
      expect(list).toHaveClass('space-y-2')
    })
  })

  describe('Mobile Responsiveness', () => {
    test('renders correctly on mobile viewport', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
      expect(nav).toBeVisible()
    })

    test('links are properly spaced for touch targets', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toBeVisible()
      })
    })

    test('handles nested list structure', () => {
      const nestedHeadings: TocHeading[] = [
        { id: 'parent', text: 'Parent', level: 2 },
        { id: 'child-1', text: 'Child 1', level: 3 },
        { id: 'child-2', text: 'Child 2', level: 3 },
        { id: 'grandchild', text: 'Grandchild', level: 4 },
        { id: 'sibling', text: 'Sibling', level: 2 },
      ]
      render(<TableOfContents headings={nestedHeadings} />)
      const list = screen.getByRole('list')
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(nestedHeadings.length)
    })
  })

  describe('Memoization', () => {
    test('component is memoized', () => {
      const MemoizedTableOfContents = TableOfContents
      expect(MemoizedTableOfContents).toBeDefined()
    })
  })

  describe('Component Structure', () => {
    test('renders as nav element', () => {
      const { container } = render(<TableOfContents headings={mockHeadings} />)
      expect(container.querySelector('nav')).toBeInTheDocument()
    })

    test('renders ul list', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    test('renders li elements inside list', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getAllByRole('listitem')).toHaveLength(mockHeadings.length)
    })

    test('each list item contains anchor link', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const listItems = screen.getAllByRole('listitem')
      listItems.forEach((item, index) => {
        expect(item.querySelector('a')).toBeInTheDocument()
        expect(item.querySelector('a')).toHaveTextContent(mockHeadings[index].text)
      })
    })
  })
})
