import { render, screen } from '@testing-library/react'
// @ts-expect-error - jest-axe types not available
import { axe } from 'jest-axe'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PostCard from '@/components/post/PostCard'
import type { WordPressPost } from '@/types/wordpress'

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

describe('Accessibility Tests', () => {
  describe('Header', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Header />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper navigation structure', () => {
      render(<Header />)
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Footer />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have contentinfo role', () => {
      render(<Footer />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
    })

    it('should have proper heading structure', () => {
      render(<Footer />)
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
    })
  })

  describe('PostCard', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<PostCard post={mockPost} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have article role', () => {
      render(<PostCard post={mockPost} />)
      const article = screen.getByRole('article')
      expect(article).toBeInTheDocument()
    })

    it('should have proper heading for post title', () => {
      render(<PostCard post={mockPost} />)
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toBeInTheDocument()
    })
  })
})
