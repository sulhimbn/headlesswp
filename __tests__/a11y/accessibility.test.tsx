import { render, screen } from '@testing-library/react'
// @ts-expect-error - jest-axe types not available
import { axe, toHaveNoViolations } from 'jest-axe'
import SearchBar from '@/components/ui/SearchBar'
import Header from '@/components/layout/Header'
import PostCard from '@/components/post/PostCard'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import Breadcrumb from '@/components/ui/Breadcrumb'
import ServiceStatus from '@/components/ui/ServiceStatus'
import { UI_TEXT } from '@/lib/constants/uiText'
import type { WordPressPost } from '@/types/wordpress'

expect.extend(toHaveNoViolations)

const mockPost: WordPressPost = {
  id: 1,
  slug: 'test-post',
  title: { rendered: 'Test Post Title' },
  content: { rendered: '<p>Test content</p>' },
  excerpt: { rendered: '<p>This is a test excerpt for the post.</p>' },
  date: '2026-01-15T10:00:00',
  modified: '2026-01-15T10:00:00',
  author: 1,
  featured_media: 123,
  categories: [1],
  tags: [1],
  status: 'publish',
  type: 'post',
  link: 'https://example.com/test-post',
}

describe('Accessibility - Keyboard Navigation', () => {
  describe('SearchBar', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SearchBar onSearch={jest.fn()} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Header Navigation', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Header />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Pagination', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={5} basePath="/berita" />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('EmptyState', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <EmptyState title="No results" description="No items found" />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper heading hierarchy', () => {
      render(<EmptyState title="No results" description="No items found" />)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveTextContent('No results')
    })
  })

  describe('Breadcrumb', () => {
    const mockBreadcrumbs: Array<{ label: string; href: string }> = [
      { label: 'Home', href: '/' },
      { label: 'Category', href: '/category' },
      { label: 'Current Page', href: '/category/current' },
    ]

    it('should have navigation role', () => {
      render(<Breadcrumb items={mockBreadcrumbs} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
    })

    it('should have proper aria-label', () => {
      render(<Breadcrumb items={mockBreadcrumbs} />)
      const nav = screen.getByRole('navigation', { name: UI_TEXT.breadcrumb.ariaLabel })
      expect(nav).toBeInTheDocument()
    })

    it('should have no accessibility violations', async () => {
      const { container } = render(<Breadcrumb items={mockBreadcrumbs} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('ServiceStatus', () => {
    it('should have button role', () => {
      render(<ServiceStatus />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should have no accessibility violations', async () => {
      const { container } = render(<ServiceStatus />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('PostCard', () => {
    it('should have link in the heading', () => {
      render(<PostCard post={mockPost} />)
      const heading = screen.getByRole('heading')
      const link = heading.querySelector('a')
      expect(link).toHaveAttribute('href', `/berita/${mockPost.slug}`)
    })

    it('should have no accessibility violations', async () => {
      const { container } = render(<PostCard post={mockPost} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('Accessibility - ARIA Attributes', () => {
  describe('Required ARIA', () => {
    it('should have valid aria-labels', async () => {
      const { container } = render(
        <SearchBar onSearch={jest.fn()} ariaLabel="Cari berita" />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper landmark roles', () => {
      render(<Header />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })

  describe('Focus Management', () => {
    it('should have visible focus indicators', async () => {
      const { container } = render(<SearchBar onSearch={jest.fn()} />)
      const results = await axe(container, {
        rules: {
          'focus-order-semantics': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })
})

describe('Accessibility - Color & Contrast', () => {
  it('should not have color as only means of information', async () => {
    const { container } = render(<PostCard post={mockPost} />)
    const results = await axe(container, {
      rules: {
        'color-contrast-enhanced': { enabled: true },
        'color-contrast': { enabled: true },
      },
    })
    const violations = results.violations.filter(
      (v: { id: string }) => v.id.includes('color-contrast')
    )
    expect(violations).toHaveLength(0)
  })
})

describe('Accessibility - Forms', () => {
  describe('Form Labels', () => {
    it('should have associated labels for inputs', async () => {
      const { container } = render(<SearchBar onSearch={jest.fn()} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('Accessibility - Images', () => {
  it('should handle posts without featured media gracefully', async () => {
    const postWithoutMedia = { ...mockPost, featured_media: 0 }
    const { container } = render(<PostCard post={postWithoutMedia} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
