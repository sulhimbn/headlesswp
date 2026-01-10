import { render, screen } from '@testing-library/react'
import Skeleton from '@/components/ui/Skeleton'

describe('Skeleton Component', () => {
  describe('Rendering', () => {
    test('renders skeleton element', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('animate-pulse')
    })

    test('renders with default rectangular variant', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('h-10', 'w-full')
    })

    test('renders with custom className', () => {
      const { container } = render(<Skeleton className="custom-class" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('custom-class')
    })
  })

  describe('Variants', () => {
    test('renders text variant', () => {
      const { container } = render(<Skeleton variant="text" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('h-4', 'w-full', 'rounded-[var(--radius-sm)]')
    })

    test('renders circular variant', () => {
      const { container } = render(<Skeleton variant="circular" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('h-10', 'w-10', 'rounded-full')
    })

    test('renders rectangular variant (default)', () => {
      const { container } = render(<Skeleton variant="rectangular" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('h-10', 'w-full')
    })

    test('renders rounded variant', () => {
      const { container } = render(<Skeleton variant="rounded" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('h-10', 'w-full', 'rounded-[var(--radius-md)]')
    })
  })

  describe('Accessibility', () => {
    test('has aria-hidden attribute', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    })

    test('has role presentation', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveAttribute('role', 'presentation')
    })
  })

  describe('Design Tokens', () => {
    test('uses design token for background color', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('bg-[hsl(var(--color-secondary-dark))]')
    })

    test('uses design token for text variant radius', () => {
      const { container } = render(<Skeleton variant="text" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('rounded-[var(--radius-sm)]')
    })

    test('uses design token for rounded variant radius', () => {
      const { container } = render(<Skeleton variant="rounded" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('rounded-[var(--radius-md)]')
    })
  })

  describe('Edge Cases', () => {
    test('renders with empty className', () => {
      const { container } = render(<Skeleton className="" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).not.toHaveClass('custom-class')
    })

    test('renders with multiple custom classes', () => {
      const { container } = render(<Skeleton className="class1 class2 class3" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('class1', 'class2', 'class3')
    })

    test('text variant has correct height', () => {
      const { container } = render(<Skeleton variant="text" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('h-4')
    })

    test('circular variant is square', () => {
      const { container } = render(<Skeleton variant="circular" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('h-10', 'w-10')
    })
  })
})
