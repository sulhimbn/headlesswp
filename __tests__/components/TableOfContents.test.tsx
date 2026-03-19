import { render, screen, fireEvent } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import { UI_TEXT } from '@/lib/constants/uiText'

describe('TableOfContents Component', () => {
  describe('Rendering', () => {
    test('renders null when headings array is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      expect(container.firstChild).toBeNull()
    })

    test('renders table of contents with headings', () => {
      const headings = [
        { id: 'intro', text: 'Introduction', level: 2 },
        { id: 'main', text: 'Main Content', level: 2 },
      ]
      render(<TableOfContents headings={headings} />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByText(UI_TEXT.postDetail.tableOfContents)).toBeInTheDocument()
    })

    test('renders all heading items', () => {
      const headings = [
        { id: 'intro', text: 'Introduction', level: 2 },
        { id: 'section1', text: 'Section 1', level: 3 },
        { id: 'section2', text: 'Section 2', level: 3 },
      ]
      render(<TableOfContents headings={headings} />)
      
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Section 1')).toBeInTheDocument()
      expect(screen.getByText('Section 2')).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      const headings = [{ id: 'intro', text: 'Introduction', level: 2 }]
      render(<TableOfContents headings={headings} className="custom-class" />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
    })

    test('has proper nav element with aria-label', () => {
      const headings = [{ id: 'intro', text: 'Introduction', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', UI_TEXT.postDetail.tableOfContents)
    })
  })

  describe('Heading Links', () => {
    test('renders links with correct href', () => {
      const headings = [
        { id: 'intro', text: 'Introduction', level: 2 },
        { id: 'section1', text: 'Section 1', level: 3 },
      ]
      render(<TableOfContents headings={headings} />)
      
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', '#intro')
      expect(links[1]).toHaveAttribute('href', '#section1')
    })

    test('links use heading text as content', () => {
      const headings = [{ id: 'test-id', text: 'Test Heading', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      expect(screen.getByText('Test Heading')).toBeInTheDocument()
    })

    test('renders multiple links with same level', () => {
      const headings = [
        { id: 'item1', text: 'Item 1', level: 2 },
        { id: 'item2', text: 'Item 2', level: 2 },
        { id: 'item3', text: 'Item 3', level: 2 },
      ]
      render(<TableOfContents headings={headings} />)
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(3)
    })
  })

  describe('Indentation', () => {
    test('level 2 headings have no indentation', () => {
      const headings = [{ id: 'h2', text: 'H2', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByText('H2')
      expect(link).toHaveClass('pl-0')
    })

    test('level 3 headings have pl-4', () => {
      const headings = [{ id: 'h3', text: 'H3', level: 3 }]
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByText('H3')
      expect(link).toHaveClass('pl-4')
    })

    test('level 4 headings have pl-8', () => {
      const headings = [{ id: 'h4', text: 'H4', level: 4 }]
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByText('H4')
      expect(link).toHaveClass('pl-8')
    })

    test('level 5 headings have pl-12', () => {
      const headings = [{ id: 'h5', text: 'H5', level: 5 }]
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByText('H5')
      expect(link).toHaveClass('pl-12')
    })

    test('level 6 headings have pl-16', () => {
      const headings = [{ id: 'h6', text: 'H6', level: 6 }]
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByText('H6')
      expect(link).toHaveClass('pl-16')
    })

    test('unknown level defaults to pl-0', () => {
      const headings = [{ id: 'unknown', text: 'Unknown', level: 99 }]
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByText('Unknown')
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Click Handling', () => {
    test('click on link does not throw when element exists', () => {
      const headings = [{ id: 'intro', text: 'Introduction', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByText('Introduction')
      expect(() => fireEvent.click(link)).not.toThrow()
    })
  })

  describe('List Structure', () => {
    test('renders unordered list', () => {
      const headings = [{ id: 'intro', text: 'Introduction', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
    })

    test('renders list items for each heading', () => {
      const headings = [
        { id: 'intro', text: 'Introduction', level: 2 },
        { id: 'main', text: 'Main', level: 2 },
      ]
      render(<TableOfContents headings={headings} />)
      
      const items = screen.getAllByRole('listitem')
      expect(items).toHaveLength(2)
    })

    test('list has proper spacing', () => {
      const headings = [{ id: 'intro', text: 'Introduction', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      const list = screen.getByRole('list')
      expect(list).toHaveClass('space-y-2')
    })
  })

  describe('Styling', () => {
    test('has surface background color', () => {
      const headings = [{ id: 'intro', text: 'Introduction', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('has rounded corners', () => {
      const headings = [{ id: 'intro', text: 'Introduction', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('has shadow', () => {
      const headings = [{ id: 'intro', text: 'Introduction', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('has padding', () => {
      const headings = [{ id: 'intro', text: 'Introduction', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('p-4')
    })

    test('title has correct styling', () => {
      const headings = [{ id: 'intro', text: 'Introduction', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      const title = screen.getByText(UI_TEXT.postDetail.tableOfContents)
      expect(title).toHaveClass('text-sm', 'font-semibold')
    })

    test('links have hover styling', () => {
      const headings = [{ id: 'intro', text: 'Introduction', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByText('Introduction')
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
      expect(link).toHaveClass('transition-colors', 'duration-[var(--transition-fast)]')
    })
  })

  describe('Unique Keys', () => {
    test('list items have unique keys based on heading id', () => {
      const headings = [
        { id: 'unique-1', text: 'First', level: 2 },
        { id: 'unique-2', text: 'Second', level: 2 },
      ]
      render(<TableOfContents headings={headings} />)
      
      const items = screen.getAllByRole('listitem')
      expect(items[0]).toHaveTextContent('First')
      expect(items[1]).toHaveTextContent('Second')
    })
  })

  describe('Edge Cases', () => {
    test('handles single heading', () => {
      const headings = [{ id: 'only', text: 'Only Heading', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(1)
      expect(links[0]).toHaveTextContent('Only Heading')
    })

    test('handles headings with special characters in text', () => {
      const headings = [{ id: 'test', text: 'Test <special> & "chars"', level: 2 }]
      render(<TableOfContents headings={headings} />)
      
      expect(screen.getByText('Test <special> & "chars"')).toBeInTheDocument()
    })

    test('handles headings with different levels mixed', () => {
      const headings = [
        { id: 'h2', text: 'Level 2', level: 2 },
        { id: 'h3', text: 'Level 3', level: 3 },
        { id: 'h4', text: 'Level 4', level: 4 },
        { id: 'h2b', text: 'Level 2 again', level: 2 },
      ]
      render(<TableOfContents headings={headings} />)
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(4)
    })
  })
})