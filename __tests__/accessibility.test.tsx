import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Breadcrumb from '@/components/ui/Breadcrumb'
import PostCard from '@/components/post/PostCard'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SearchBar from '@/components/ui/SearchBar'
import KeyboardShortcutsProvider from '@/components/providers/KeyboardShortcutsProvider'
import type { WordPressPost } from '@/types/wordpress'

expect.extend(toHaveNoViolations)

const mockPost: WordPressPost = {
  id: 1,
  slug: 'test-post',
  title: { rendered: 'Test Post Title' },
  content: { rendered: '<p>Test content</p>' },
  excerpt: { rendered: '<p>Test excerpt</p>' },
  date: '2024-01-01T00:00:00',
  modified: '2024-01-01T00:00:00',
  featured_media: 1,
  author: 1,
  categories: [1],
  tags: [1],
  status: 'publish',
  type: 'post',
  link: 'http://localhost/test-post',
}

describe('Accessibility Tests', () => {
  describe('Button', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Button>Click me</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations when loading', async () => {
      const { container } = render(<Button isLoading>Loading</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations when disabled', async () => {
      const { container } = render(<Button disabled>Disabled</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations with different variants', async () => {
      const variants = ['primary', 'secondary', 'outline', 'ghost'] as const
      for (const variant of variants) {
        const { container } = render(<Button variant={variant}>Button</Button>)
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      }
    })
  })

  describe('Badge', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Badge>Badge</Badge>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations with href', async () => {
      const { container } = render(<Badge href="/test">Link Badge</Badge>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations with different variants', async () => {
      const variants = ['category', 'tag', 'default'] as const
      for (const variant of variants) {
        const { container } = render(<Badge variant={variant}>Badge</Badge>)
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      }
    })
  })

  describe('Breadcrumb', () => {
    it('should have no accessibility violations', async () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Category', href: '/category' },
        { label: 'Post', href: '/post' },
      ]
      const { container } = render(<Breadcrumb items={items} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have correct aria-label', () => {
      const items = [{ label: 'Post', href: '/post' }]
      render(<Breadcrumb items={items} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label')
    })
  })

  describe('PostCard', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <PostCard
          post={mockPost}
          mediaUrl="https://example.com/image.jpg"
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations without featured media', async () => {
      const postNoMedia: WordPressPost = {
        ...mockPost,
        featured_media: 0,
      }
      const { container } = render(<PostCard post={postNoMedia} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have article role', () => {
      render(<PostCard post={mockPost} />)
      const article = screen.getByRole('article')
      expect(article).toBeInTheDocument()
    })
  })

  describe('Header', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <KeyboardShortcutsProvider>
          <Header />
        </KeyboardShortcutsProvider>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have skip link or proper navigation', () => {
      render(
        <KeyboardShortcutsProvider>
          <Header />
        </KeyboardShortcutsProvider>
      )
      const nav = screen.getAllByRole('navigation')
      expect(nav.length).toBeGreaterThan(0)
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

    it('should have proper section labels', () => {
      render(<Footer />)
      const sections = screen.getAllByRole('region')
      expect(sections.length).toBeGreaterThan(0)
    })
  })

  describe('SearchBar', () => {
    it('should have no accessibility violations', async () => {
      const mockSearch = jest.fn()
      const { container } = render(<SearchBar onSearch={mockSearch} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have search role', () => {
      const mockSearch = jest.fn()
      render(<SearchBar onSearch={mockSearch} />)
      const form = screen.getByRole('search')
      expect(form).toBeInTheDocument()
    })

    it('should have accessible label', () => {
      const mockSearch = jest.fn()
      render(<SearchBar onSearch={mockSearch} />)
      const input = screen.getByLabelText(/berita/i)
      expect(input).toBeInTheDocument()
    })

    it('should have no violations when loading', async () => {
      const mockSearch = jest.fn()
      const { container } = render(
        <SearchBar onSearch={mockSearch} isLoading />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})