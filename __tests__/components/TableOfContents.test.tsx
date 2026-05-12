import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

const createMockElement = (top: number): HTMLElement => {
  const mock = document.createElement('div')
  Object.defineProperty(mock, 'getBoundingClientRect', {
    value: () => ({ top, left: 0, right: 0, bottom: 0, width: 0, height: 0 }),
    writable: true
  })
  return mock
}

describe('TableOfContents Component', () => {
  const mockHeadings: TocHeading[] = [
    { id: 'introduction', text: 'Introduction', level: 2 },
    { id: 'installation', text: 'Installation', level: 2 },
    { id: 'installation-using-npm', text: 'Using NPM', level: 3 },
    { id: 'installation-using-yarn', text: 'Using Yarn', level: 3 },
    { id: 'configuration', text: 'Configuration', level: 2 },
    { id: 'advanced', text: 'Advanced Options', level: 4 },
  ]

  let scrollToMock: jest.SpyInstance

  describe('Rendering', () => {
    test('renders table of contents with headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation', { name: 'Daftar Isi' })).toBeInTheDocument()
    })

    test('renders heading title', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
    })

    test('renders all provided headings', () => {
      render(<TableOfContents headings={mockHeadings} />)
      mockHeadings.forEach((heading) => {
        expect(screen.getByText(heading.text)).toBeInTheDocument()
      })
    })

    test('renders correct number of list items', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(mockHeadings.length)
    })

    test('renders custom className', () => {
      render(<TableOfContents headings={mockHeadings} className="custom-class" />)
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('custom-class')
    })

    test('applies default className when not provided', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation', { name: 'Daftar Isi' })
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })
  })

  describe('Heading Extraction', () => {
    test('renders headings with correct href attributes', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      
      links.forEach((link, index) => {
        expect(link).toHaveAttribute('href', `#${mockHeadings[index].id}`)
      })
    })

    test('renders headings in order provided', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      
      links.forEach((link, index) => {
        expect(link).toHaveTextContent(mockHeadings[index].text)
      })
    })

    test('handles single heading', () => {
      const singleHeading = [{ id: 'only', text: 'Only Heading', level: 2 }]
      render(<TableOfContents headings={singleHeading} />)
      expect(screen.getByText('Only Heading')).toBeInTheDocument()
    })

    test('handles headings with special characters in text', () => {
      const specialHeadings: TocHeading[] = [
        { id: 'test-1', text: 'Test & Features <special>', level: 2 },
        { id: 'test-2', text: 'Code: `const x = 1`', level: 2 },
      ]
      render(<TableOfContents headings={specialHeadings} />)
      expect(screen.getByText('Test & Features <special>')).toBeInTheDocument()
      expect(screen.getByText('Code: `const x = 1`')).toBeInTheDocument()
    })
  })

  describe('Active Heading Highlighting / Indentation', () => {
    test('applies correct indentation for h2 (level 2)', () => {
      const headings: TocHeading[] = [{ id: 'h2', text: 'H2', level: 2 }]
      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link', { name: 'H2' })
      expect(link).toHaveClass('pl-0')
    })

    test('applies correct indentation for h3 (level 3)', () => {
      const headings: TocHeading[] = [{ id: 'h3', text: 'H3', level: 3 }]
      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link', { name: 'H3' })
      expect(link).toHaveClass('pl-4')
    })

    test('applies correct indentation for h4 (level 4)', () => {
      const headings: TocHeading[] = [{ id: 'h4', text: 'H4', level: 4 }]
      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link', { name: 'H4' })
      expect(link).toHaveClass('pl-8')
    })

    test('applies correct indentation for h5 (level 5)', () => {
      const headings: TocHeading[] = [{ id: 'h5', text: 'H5', level: 5 }]
      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link', { name: 'H5' })
      expect(link).toHaveClass('pl-12')
    })

    test('applies correct indentation for h6 (level 6)', () => {
      const headings: TocHeading[] = [{ id: 'h6', text: 'H6', level: 6 }]
      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link', { name: 'H6' })
      expect(link).toHaveClass('pl-16')
    })

    test('applies default indentation for unknown level', () => {
      const headings: TocHeading[] = [{ id: 'unknown', text: 'Unknown', level: 1 }]
      render(<TableOfContents headings={headings} />)
      const link = screen.getByRole('link', { name: 'Unknown' })
      expect(link).toHaveClass('pl-0')
    })

    test('applies hover styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })

    test('applies transition styles', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      expect(link).toHaveClass('transition-colors')
    })
  })

  describe('Click Navigation', () => {
    beforeEach(() => {
      scrollToMock = jest.spyOn(window, 'scrollTo').mockImplementation(() => {})
    })

    afterEach(() => {
      scrollToMock.mockRestore()
    })

    test('calls scrollTo on link click', () => {
      const mockElement = document.createElement('div')
      jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({ top: 100, left: 0, right: 0, bottom: 0, width: 0, height: 0 } as DOMRect)
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement)
      
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      
      fireEvent.click(link)
      
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth'
      })
    })

    test('prevents default link behavior', () => {
      const mockElement = createMockElement(100)
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement)
      
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      
      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'preventDefault', { value: jest.fn(), writable: false })
      fireEvent(link, event)
      
      expect((event as any).preventDefault).toHaveBeenCalled()
    })

    test('scrolls to element with offset', () => {
      const mockElement = createMockElement(100)
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement)
      
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      
      fireEvent.click(link)
      
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth'
      })
    })

    test('does not throw when target element not found', () => {
      jest.spyOn(document, 'getElementById').mockReturnValue(null)
      
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      
      expect(() => fireEvent.click(link)).not.toThrow()
    })

    test('multiple clicks fire scroll multiple times', () => {
      const mockElement = createMockElement(100)
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement)
      
      render(<TableOfContents headings={mockHeadings} />)
      const link = screen.getByRole('link', { name: 'Introduction' })
      
      fireEvent.click(link)
      fireEvent.click(link)
      fireEvent.click(link)
      
      expect(scrollToMock).toHaveBeenCalledTimes(3)
    })
  })

  describe('Accessibility', () => {
    test('has proper nav role', () => {
      render(<TableOfContents headings={mockHeadings} />)
      expect(screen.getByRole('navigation', { name: 'Daftar Isi' })).toBeInTheDocument()
    })

    test('has aria-label', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Daftar Isi')
    })

    test('links have proper href attributes', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link).toHaveAttribute('href')
      })
    })

    test('heading title has semantic heading role', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const title = screen.getByText('Daftar Isi')
      expect(title.tagName).toBe('H2')
    })

    test('list is properly structured', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
      expect(list).toHaveClass('space-y-2')
    })

    test('all links are keyboard accessible', () => {
      render(<TableOfContents headings={mockHeadings} />)
      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link).not.toHaveAttribute('tabindex')
      })
    })
  })

  describe('Edge Cases', () => {
    test('renders nothing when headings array is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })

test('renders nothing when headings is undefined', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => {
        render(<TableOfContents headings={undefined as any} />)
      }).toThrow()
      consoleSpy.mockRestore()
    })

    test('handles headings with missing id', () => {
      const headingsWithoutId: TocHeading[] = [
        { id: '', text: 'No ID', level: 2 },
      ]
      render(<TableOfContents headings={headingsWithoutId} />)
      const link = screen.getByRole('link', { name: 'No ID' })
      expect(link).toHaveAttribute('href', '#')
    })

    test('handles headings with empty text', () => {
      const headingsNoText: TocHeading[] = [
        { id: 'empty', text: '', level: 2 },
      ]
      render(<TableOfContents headings={headingsNoText} />)
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveTextContent('')
    })

    test('default className is applied when className is empty string', () => {
      render(<TableOfContents headings={mockHeadings} className="" />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })
  })
})