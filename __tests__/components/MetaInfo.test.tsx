import { render, screen } from '@testing-library/react'
import MetaInfo from '@/components/ui/MetaInfo'

describe('MetaInfo Component', () => {
  describe('Rendering - Basic Cases', () => {
    test('renders author', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    test('renders default author when not provided', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" />)
      expect(screen.getByText('By Admin')).toBeInTheDocument()
    })

    test('renders formatted date', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      expect(screen.getByText(/Januari/)).toBeInTheDocument()
    })

    test('renders time element with dateTime attribute', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const timeElement = screen.getByRole('time')
      expect(timeElement).toBeInTheDocument()
      expect(timeElement).toHaveAttribute('datetime', '2026-01-10T10:00:00')
    })

    test('renders with custom className', () => {
      const { container } = render(
        <MetaInfo date="2026-01-10T10:00:00" className="custom-class" />
      )
      const metaInfo = container.querySelector('div')
      expect(metaInfo).toHaveClass('custom-class')
    })
  })

  describe('Separator Rendering', () => {
    test('renders default separator (bullet)', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const separator = screen.getByText('•')
      expect(separator).toBeInTheDocument()
    })

    test('renders custom separator', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" separator="|" author="John Doe" />)
      const separator = screen.getByText('|')
      expect(separator).toBeInTheDocument()
    })

    test('separator has aria-hidden attribute', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const separator = screen.getByText('•')
      expect(separator).toHaveAttribute('aria-hidden', 'true')
    })

    test('renders empty separator', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" separator="" author="John Doe" />)
      const separators = screen.queryByText('•')
      expect(separators).not.toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    test('formats date in Indonesian', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      expect(screen.getByText(/Januari/)).toBeInTheDocument()
    })

    test('formats different months correctly', () => {
      render(<MetaInfo date="2026-02-15T10:00:00" author="John Doe" />)
      expect(screen.getByText(/Februari/)).toBeInTheDocument()
    })

    test('formats day and year correctly', () => {
      render(<MetaInfo date="2026-12-25T10:00:00" author="John Doe" />)
      expect(screen.getByText(/25/)).toBeInTheDocument()
      expect(screen.getByText(/2026/)).toBeInTheDocument()
    })

    test('formats date with time', () => {
      render(<MetaInfo date="2026-01-10T14:30:00" author="John Doe" />)
      const timeElement = screen.getByRole('time')
      expect(timeElement).toHaveAttribute('datetime', '2026-01-10T14:30:00')
    })
  })

  describe('Layout and Spacing', () => {
    test('has flex layout', () => {
      const { container } = render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const metaInfo = container.querySelector('div')
      expect(metaInfo).toHaveClass('flex')
    })

    test('has proper spacing between items', () => {
      const { container } = render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const metaInfo = container.querySelector('div')
      expect(metaInfo).toHaveClass('space-x-4')
    })

    test('uses text-sm class', () => {
      const { container } = render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const metaInfo = container.querySelector('div')
      expect(metaInfo).toHaveClass('text-sm')
    })

    test('aligns items in center', () => {
      const { container } = render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const metaInfo = container.querySelector('div')
      expect(metaInfo).toHaveClass('items-center')
    })
  })

  describe('Design Tokens', () => {
    test('uses design tokens for text color', () => {
      const { container } = render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const metaInfo = container.querySelector('div')
      expect(metaInfo).toHaveClass('text-[hsl(var(--color-text-muted))]')
    })
  })

  describe('Accessibility', () => {
    test('time element has semantic meaning', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const timeElement = screen.getByRole('time')
      expect(timeElement).toBeInTheDocument()
    })

    test('separator is hidden from screen readers', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const separator = screen.getByText('•')
      expect(separator).toHaveAttribute('aria-hidden', 'true')
    })

    test('date is machine-readable via datetime attribute', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const timeElement = screen.getByRole('time')
      expect(timeElement).toHaveAttribute('datetime', '2026-01-10T10:00:00')
    })
  })

  describe('Edge Cases', () => {
    test('handles empty author string', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" author="" />)
      const { container } = render(<MetaInfo date="2026-01-10T10:00:00" author="" />)
      const authorSpan = container.querySelectorAll('span')[0]
      expect(authorSpan).toBeInTheDocument()
      expect(authorSpan.textContent).toBe('')
    })

    test('handles special characters in author name', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" author='John "The Boss" O&apos;Neil' />)
      expect(screen.getByText(/John "The Boss" O'Neil/)).toBeInTheDocument()
    })

    test('handles very long author name', () => {
      const longAuthor = 'A'.repeat(100)
      render(<MetaInfo date="2026-01-10T10:00:00" author={longAuthor} />)
      expect(screen.getByText(longAuthor)).toBeInTheDocument()
    })

    test('handles date with milliseconds', () => {
      render(<MetaInfo date="2026-01-10T10:00:00.123Z" author="John Doe" />)
      const timeElement = screen.getByRole('time')
      expect(timeElement).toHaveAttribute('datetime', '2026-01-10T10:00:00.123Z')
    })

    test('handles date with timezone offset', () => {
      render(<MetaInfo date="2026-01-10T10:00:00+07:00" author="John Doe" />)
      const timeElement = screen.getByRole('time')
      expect(timeElement).toHaveAttribute('datetime', '2026-01-10T10:00:00+07:00')
    })

    test('handles separator with special characters', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" separator="→" author="John Doe" />)
      const separator = screen.getByText('→')
      expect(separator).toBeInTheDocument()
    })

    test('handles Unicode separator', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" separator="•" author="John Doe" />)
      const separator = screen.getByText('•')
      expect(separator).toBeInTheDocument()
    })

    test('handles separator as emoji', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" separator="📅" author="John Doe" />)
      const separator = screen.getByText('📅')
      expect(separator).toBeInTheDocument()
    })

    test('handles only date (no author)', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" />)
      expect(screen.getByText('By Admin')).toBeInTheDocument()
      const timeElement = screen.getByRole('time')
      expect(timeElement).toBeInTheDocument()
    })

    test('handles author with whitespace only', () => {
      const { container } = render(<MetaInfo date="2026-01-10T10:00:00" author="   " />)
      const authorSpan = container.querySelectorAll('span')[0]
      expect(authorSpan).toBeInTheDocument()
      expect(authorSpan.textContent).toBe('   ')
    })
  })

  describe('Component Structure', () => {
    test('renders author in span', () => {
      const { container } = render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const spans = container.querySelectorAll('span')
      const authorSpan = Array.from(spans).find(span => span.textContent === 'John Doe')
      expect(authorSpan).toBeInTheDocument()
    })

    test('renders separator in span', () => {
      const { container } = render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const separatorSpan = container.querySelector('span[aria-hidden="true"]')
      expect(separatorSpan).toBeInTheDocument()
    })

    test('renders date in time element', () => {
      render(<MetaInfo date="2026-01-10T10:00:00" author="John Doe" />)
      const timeElement = screen.getByRole('time')
      expect(timeElement.tagName).toBe('TIME')
    })
  })
})
