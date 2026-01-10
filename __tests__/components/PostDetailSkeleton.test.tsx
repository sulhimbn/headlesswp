import { render, screen } from '@testing-library/react'
import PostDetailSkeleton from '@/components/post/PostDetailSkeleton'

describe('PostDetailSkeleton Component', () => {
  describe('Rendering', () => {
    test('renders main element', () => {
      const { container } = render(<PostDetailSkeleton />)
      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })

    test('renders article element', () => {
      const { container } = render(<PostDetailSkeleton />)
      const article = container.querySelector('article')
      expect(article).toBeInTheDocument()
    })

    test('renders skeleton elements', () => {
      const { container } = render(<PostDetailSkeleton />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    test('has aria-busy attribute set to true', () => {
      const { container } = render(<PostDetailSkeleton />)
      const outerWrapper = container.firstChild as HTMLElement
      expect(outerWrapper).toHaveAttribute('aria-busy', 'true')
    })

    test('has aria-label attribute for loading state', () => {
      const { container } = render(<PostDetailSkeleton />)
      const outerWrapper = container.firstChild as HTMLElement
      expect(outerWrapper).toHaveAttribute('aria-label', 'Memuat detail artikel')
    })

    test('does not use aria-hidden (screen readers announce loading state)', () => {
      const { container } = render(<PostDetailSkeleton />)
      const outerWrapper = container.firstChild as HTMLElement
      expect(outerWrapper).not.toHaveAttribute('aria-hidden')
    })
  })

  describe('Layout Structure', () => {
    test('has breadcrumb skeleton at top', () => {
      const { container } = render(<PostDetailSkeleton />)
      const skeletons = Array.from(container.querySelectorAll('.animate-pulse'))
      const breadcrumb = skeletons[0] as HTMLElement
      expect(breadcrumb).toHaveClass('w-20')
    })

    test('has large featured image placeholder', () => {
      const { container } = render(<PostDetailSkeleton />)
      const imagePlaceholder = container.querySelector('article > div:first-child') as HTMLElement
      expect(imagePlaceholder).toBeInTheDocument()
      expect(imagePlaceholder).toHaveClass('h-64', 'sm:h-80', 'md:h-96')
      expect(imagePlaceholder.className).toContain('lg:h-[450px]')
    })

    test('has content section after image', () => {
      const { container } = render(<PostDetailSkeleton />)
      const article = container.querySelector('article')
      const contentSection = article?.querySelector('div:last-child')
      expect(contentSection).toBeInTheDocument()
    })

    test('has multiple skeleton text lines', () => {
      const { container } = render(<PostDetailSkeleton />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(10)
    })

    test('has content section at bottom', () => {
      const { container } = render(<PostDetailSkeleton />)
      const main = container.querySelector('main')
      const sections = main?.children
      expect(sections).toHaveLength(3)
    })
  })

  describe('Design Tokens', () => {
    test('outer wrapper uses background color token', () => {
      const { container } = render(<PostDetailSkeleton />)
      const outerWrapper = container.firstChild as HTMLElement
      expect(outerWrapper).toHaveClass('bg-[hsl(var(--color-background))]')
    })

    test('article uses surface color token', () => {
      const { container } = render(<PostDetailSkeleton />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('article uses lg radius token', () => {
      const { container } = render(<PostDetailSkeleton />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('article uses lg shadow token', () => {
      const { container } = render(<PostDetailSkeleton />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('shadow-[var(--shadow-lg)]')
    })

    test('skeleton elements use secondary dark color token', () => {
      const { container } = render(<PostDetailSkeleton />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('bg-[hsl(var(--color-secondary-dark))]')
      })
    })

    test('border uses border color token', () => {
      const { container } = render(<PostDetailSkeleton />)
      const borderDiv = container.querySelector('.border-t')
      expect(borderDiv).toHaveClass('border-[hsl(var(--color-border))]')
    })
  })

  describe('Responsive Design', () => {
    test('main has responsive padding classes', () => {
      const { container } = render(<PostDetailSkeleton />)
      const main = container.querySelector('main')
      expect(main).toHaveClass('px-4', 'sm:px-6', 'lg:px-8')
    })

    test('main has max-width constraint', () => {
      const { container } = render(<PostDetailSkeleton />)
      const main = container.querySelector('main')
      expect(main).toHaveClass('max-w-4xl', 'mx-auto')
    })

    test('image has responsive height classes', () => {
      const { container } = render(<PostDetailSkeleton />)
      const imagePlaceholder = container.querySelector('article > div:first-child') as HTMLElement
      expect(imagePlaceholder).toHaveClass('h-64', 'sm:h-80', 'md:h-96')
      expect(imagePlaceholder.className).toContain('lg:h-[450px]')
    })

    test('content section has padding', () => {
      const { container } = render(<PostDetailSkeleton />)
      const article = container.querySelector('article')
      const contentSection = article?.querySelector('div:last-child')
      expect(contentSection).toHaveClass('p-8')
    })
  })

  describe('Content Sections', () => {
    test('has meta section with date and badges', () => {
      const { container } = render(<PostDetailSkeleton />)
      const article = container.querySelector('article')
      const metaSection = article?.querySelector('.mb-6') as HTMLElement
      expect(metaSection).toBeInTheDocument()
    })

    test('has badge skeleton elements', () => {
      const { container } = render(<PostDetailSkeleton />)
      const roundedSkeletons = container.querySelectorAll('.rounded-full.animate-pulse')
      expect(roundedSkeletons.length).toBeGreaterThan(0)
    })

    test('has title skeleton', () => {
      const { container } = render(<PostDetailSkeleton />)
      const wideSkeletons = container.querySelectorAll('.animate-pulse.w-3\\/4')
      expect(wideSkeletons.length).toBeGreaterThan(0)
    })

    test('has body text skeleton lines', () => {
      const { container } = render(<PostDetailSkeleton />)
      const bodySkeletons = container.querySelectorAll('.space-y-3 > div.animate-pulse')
      expect(bodySkeletons.length).toBeGreaterThan(4)
    })
  })

  describe('Spacing', () => {
    test('main has vertical padding', () => {
      const { container } = render(<PostDetailSkeleton />)
      const main = container.querySelector('main')
      expect(main).toHaveClass('py-8')
    })

    test('article has margin top', () => {
      const { container } = render(<PostDetailSkeleton />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('mt-4')
    })

    test('breadcrumb has margin bottom', () => {
      const { container } = render(<PostDetailSkeleton />)
      const main = container.querySelector('main')
      const breadcrumbSection = main?.firstElementChild
      expect(breadcrumbSection).toHaveClass('mb-4')
    })

    test('article has margin top', () => {
      const { container } = render(<PostDetailSkeleton />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('mt-4')
    })

    test('footer section has margin top and padding top', () => {
      const { container } = render(<PostDetailSkeleton />)
      const footerSection = container.querySelector('.border-t')
      expect(footerSection).toHaveClass('mt-8', 'pt-6')
    })

    test('content section has margin top', () => {
      const { container } = render(<PostDetailSkeleton />)
      const main = container.querySelector('main')
      const lastSection = main?.lastElementChild
      expect(lastSection).toHaveClass('mt-8')
    })
  })

  describe('Edge Cases', () => {
    test('renders consistently on multiple renders', () => {
      const { rerender } = render(<PostDetailSkeleton />)
      const main1 = screen.queryByRole('main')
      rerender(<PostDetailSkeleton />)
      const main2 = screen.queryByRole('main')
      expect(main1).toBeInTheDocument()
      expect(main2).toBeInTheDocument()
    })

    test('has overflow-hidden on article', () => {
      const { container } = render(<PostDetailSkeleton />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('overflow-hidden')
    })

    test('outer wrapper has minimum height', () => {
      const { container } = render(<PostDetailSkeleton />)
      const outerWrapper = container.firstChild as HTMLElement
      expect(outerWrapper).toHaveClass('min-h-screen')
    })

    test('body text lines have consistent spacing', () => {
      const { container } = render(<PostDetailSkeleton />)
      const article = container.querySelector('article')
      const bodySkeletons = article?.querySelectorAll('.space-y-3 > div.animate-pulse')
      expect(bodySkeletons?.length).toBeGreaterThan(4)
      const firstBodySkeleton = bodySkeletons?.[0] as HTMLElement
      expect(firstBodySkeleton).toHaveClass('mb-2')
    })

    test('body text lines have varying widths', () => {
      const { container } = render(<PostDetailSkeleton />)
      const article = container.querySelector('article')
      const bodySkeletons = Array.from(article?.querySelectorAll('.space-y-3 > div.animate-pulse') || [])
      const fullLine = bodySkeletons[0] as HTMLElement
      const shortLine = bodySkeletons[5] as HTMLElement
      const shorterLine = bodySkeletons[6] as HTMLElement
      expect(fullLine).not.toHaveClass('w-5/6', 'w-4/6')
      expect(shortLine).toHaveClass('w-5/6')
      expect(shorterLine).toHaveClass('w-4/6')
    })
  })
})
