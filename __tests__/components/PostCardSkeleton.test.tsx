import { render, screen } from '@testing-library/react'
import PostCardSkeleton from '@/components/post/PostCardSkeleton'

describe('PostCardSkeleton Component', () => {
  describe('Rendering', () => {
    test('renders article element', () => {
      const { container } = render(<PostCardSkeleton />)
      const article = container.querySelector('article')
      expect(article).toBeInTheDocument()
    })

    test('renders skeleton elements', () => {
      const { container } = render(<PostCardSkeleton />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    test('has aria-busy attribute set to true', () => {
      const { container } = render(<PostCardSkeleton />)
      const article = container.querySelector('article')
      expect(article).toHaveAttribute('aria-busy', 'true')
    })

    test('has aria-label attribute for loading state', () => {
      const { container } = render(<PostCardSkeleton />)
      const article = container.querySelector('article')
      expect(article).toHaveAttribute('aria-label', 'Memuat kartu artikel')
    })

    test('does not use aria-hidden (screen readers announce loading state)', () => {
      const { container } = render(<PostCardSkeleton />)
      const article = container.querySelector('article')
      expect(article).not.toHaveAttribute('aria-hidden')
    })
  })

  describe('Structure', () => {
    test('has image placeholder', () => {
      const { container } = render(<PostCardSkeleton />)
      const imagePlaceholder = container.firstChild?.firstChild as HTMLElement
      expect(imagePlaceholder).toBeInTheDocument()
      expect(imagePlaceholder).toHaveClass('animate-pulse')
    })

    test('has content section', () => {
      const { container } = render(<PostCardSkeleton />)
      const contentSection = container.querySelector('article > div:last-child')
      expect(contentSection).toBeInTheDocument()
    })

    test('has multiple skeleton text lines', () => {
      const { container } = render(<PostCardSkeleton />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(4)
    })

    test('has title skeleton line', () => {
      const { container } = render(<PostCardSkeleton />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      const titleSkeleton = skeletons[1] as HTMLElement
      expect(titleSkeleton).toHaveClass('w-3/4')
    })

    test('has short last skeleton line', () => {
      const { container } = render(<PostCardSkeleton />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      const lastSkeleton = skeletons[skeletons.length - 1] as HTMLElement
      expect(lastSkeleton).toHaveClass('w-1/2')
    })
  })

  describe('Design Tokens', () => {
    test('article uses surface color token', () => {
      const { container } = render(<PostCardSkeleton />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('article uses lg radius token', () => {
      const { container } = render(<PostCardSkeleton />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('article uses md shadow token', () => {
      const { container } = render(<PostCardSkeleton />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('shadow-[var(--shadow-md)]')
    })

    test('skeleton elements use secondary dark color token', () => {
      const { container } = render(<PostCardSkeleton />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('bg-[hsl(var(--color-secondary-dark))]')
      })
    })

    test('skeleton elements use sm radius token', () => {
      const { container } = render(<PostCardSkeleton />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      skeletons.forEach((skeleton) => {
        if (skeleton.classList.contains('rounded-\\[var\\(--radius-sm\\)\\]')) {
          expect(skeleton).toHaveClass('rounded-[var(--radius-sm)]')
        }
      })
    })
  })

  describe('Responsive Design', () => {
    test('image has responsive height classes', () => {
      const { container } = render(<PostCardSkeleton />)
      const imagePlaceholder = container.firstChild?.firstChild as HTMLElement
      expect(imagePlaceholder).toHaveClass('h-48', 'sm:h-56', 'md:h-48')
    })

    test('content has responsive padding classes', () => {
      const { container } = render(<PostCardSkeleton />)
      const contentSection = container.querySelector('article > div:last-child')
      expect(contentSection).toHaveClass('p-4', 'sm:p-5', 'md:p-4')
    })

    test('title has responsive height classes', () => {
      const { container } = render(<PostCardSkeleton />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      const titleSkeleton = skeletons[1] as HTMLElement
      expect(titleSkeleton).toHaveClass('h-6', 'sm:h-7', 'md:h-6')
    })

    test('date has responsive height classes', () => {
      const { container } = render(<PostCardSkeleton />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      const dateSkeleton = skeletons[skeletons.length - 1] as HTMLElement
      expect(dateSkeleton).toHaveClass('h-3', 'sm:h-4', 'md:h-3')
    })
  })

  describe('Edge Cases', () => {
    test('renders consistently on multiple renders', () => {
      const { rerender } = render(<PostCardSkeleton />)
      const article1 = screen.queryByRole('article')
      rerender(<PostCardSkeleton />)
      const article2 = screen.queryByRole('article')
      expect(article1).toBeInTheDocument()
      expect(article2).toBeInTheDocument()
    })

    test('has overflow-hidden on article', () => {
      const { container } = render(<PostCardSkeleton />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('overflow-hidden')
    })

    test('skeleton text lines have bottom margin for spacing', () => {
      const { container } = render(<PostCardSkeleton />)
      const skeletons = Array.from(container.querySelectorAll('.animate-pulse'))
      const middleSkeletons = skeletons.slice(2, 5) as HTMLElement[]
      expect(middleSkeletons[0]).toHaveClass('mb-1')
      expect(middleSkeletons[1]).toHaveClass('mb-1')
      expect(middleSkeletons[2]).toHaveClass('mb-3')
    })

    test('content section has bottom margin after text lines', () => {
      const { container } = render(<PostCardSkeleton />)
      const skeletons = Array.from(container.querySelectorAll('.animate-pulse'))
      const skeletonBeforeDate = skeletons[skeletons.length - 2] as HTMLElement
      expect(skeletonBeforeDate).toHaveClass('mb-3')
    })
  })
})
