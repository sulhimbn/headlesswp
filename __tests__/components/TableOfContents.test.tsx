import { render, screen } from '@testing-library/react'
import TableOfContents from '@/components/ui/TableOfContents'
import type { TocHeading } from '@/lib/utils/tableOfContents'

describe('TableOfContents Component', () => {
  describe('Rendering', () => {
    test('renders with headings', () => {
      const headings: TocHeading[] = [
        { id: 'intro', text: 'Introduction', level: 2 },
        { id: 'getting-started', text: 'Getting Started', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      const headings: TocHeading[] = [
        { id: 'test', text: 'Test', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} className="custom-class" />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
    })

    test('renders heading with different levels', () => {
      const headings: TocHeading[] = [
        { id: 'h2', text: 'Heading 2', level: 2 },
        { id: 'h3', text: 'Heading 3', level: 3 },
        { id: 'h4', text: 'Heading 4', level: 4 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      expect(screen.getByText('Heading 2')).toBeInTheDocument()
      expect(screen.getByText('Heading 3')).toBeInTheDocument()
      expect(screen.getByText('Heading 4')).toBeInTheDocument()
    })

    test('renders all list items', () => {
      const headings: TocHeading[] = [
        { id: 'one', text: 'One', level: 2 },
        { id: 'two', text: 'Two', level: 2 },
        { id: 'three', text: 'Three', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(3)
    })
  })

  describe('Null Return', () => {
    test('returns null when headings is empty', () => {
      const { container } = render(<TableOfContents headings={[]} />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Navigation', () => {
    test('generates correct href for each heading', () => {
      const headings: TocHeading[] = [
        { id: 'my-heading', text: 'My Heading', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'My Heading' })
      expect(link).toHaveAttribute('href', '#my-heading')
    })
  })

  describe('Accessibility', () => {
    test('has navigation role with aria-label', () => {
      const headings: TocHeading[] = [
        { id: 'test', text: 'Test', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      expect(screen.getByRole('navigation')).toHaveAttribute(
        'aria-label',
        'Daftar Isi'
      )
    })

    test('renders as nav element', () => {
      const headings: TocHeading[] = [
        { id: 'test', text: 'Test', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      expect(screen.getByRole('navigation').tagName).toBe('NAV')
    })
  })

  describe('Indentation', () => {
    test('applies correct indentation for level 2', () => {
      const headings: TocHeading[] = [
        { id: 'h2', text: 'Level 2', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Level 2' })
      expect(link).toHaveClass('pl-0')
    })

    test('applies correct indentation for level 3', () => {
      const headings: TocHeading[] = [
        { id: 'h3', text: 'Level 3', level: 3 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Level 3' })
      expect(link).toHaveClass('pl-4')
    })

    test('applies correct indentation for level 4', () => {
      const headings: TocHeading[] = [
        { id: 'h4', text: 'Level 4', level: 4 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Level 4' })
      expect(link).toHaveClass('pl-8')
    })

    test('applies correct indentation for level 5', () => {
      const headings: TocHeading[] = [
        { id: 'h5', text: 'Level 5', level: 5 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Level 5' })
      expect(link).toHaveClass('pl-12')
    })

    test('applies correct indentation for level 6', () => {
      const headings: TocHeading[] = [
        { id: 'h6', text: 'Level 6', level: 6 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Level 6' })
      expect(link).toHaveClass('pl-16')
    })

    test('defaults to pl-0 for unknown levels', () => {
      const headings: TocHeading[] = [
        { id: 'unknown', text: 'Unknown', level: 1 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Unknown' })
      expect(link).toHaveClass('pl-0')
    })
  })

  describe('Styles', () => {
    test('has surface background class', () => {
      const headings: TocHeading[] = [
        { id: 'test', text: 'Test', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('has rounded-lg class', () => {
      const headings: TocHeading[] = [
        { id: 'test', text: 'Test', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('has shadow class', () => {
      const headings: TocHeading[] = [
        { id: 'test', text: 'Test', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('heading has hover effect', () => {
      const headings: TocHeading[] = [
        { id: 'test', text: 'Test', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const link = screen.getByRole('link', { name: 'Test' })
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })
  })

  describe('Title', () => {
    test('renders title heading', () => {
      const headings: TocHeading[] = [
        { id: 'test', text: 'Test', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      expect(screen.getByText('Daftar Isi')).toBeInTheDocument()
    })

    test('title has correct styles', () => {
      const headings: TocHeading[] = [
        { id: 'test', text: 'Test', level: 2 },
      ]
      
      render(<TableOfContents headings={headings} />)
      
      const title = screen.getByText('Daftar Isi')
      expect(title).toHaveClass('text-sm')
      expect(title).toHaveClass('font-semibold')
    })
  })
})