import { render, screen } from '@testing-library/react'
// @ts-expect-error - jest-axe types not available
import { axe } from 'jest-axe'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PostCard from '@/components/post/PostCard'
import SearchBar from '@/components/ui/SearchBar'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import SectionHeading from '@/components/ui/SectionHeading'
import Breadcrumb from '@/components/ui/Breadcrumb'
import MetaInfo from '@/components/ui/MetaInfo'
import SocialShare from '@/components/ui/SocialShare'
import { UI_TEXT } from '@/lib/constants/uiText'
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

  describe('SearchBar', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SearchBar onSearch={jest.fn()} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have search role', () => {
      render(<SearchBar onSearch={jest.fn()} />)
      const form = screen.getByRole('search')
      expect(form).toBeInTheDocument()
    })

    it('should have searchbox role', () => {
      render(<SearchBar onSearch={jest.fn()} />)
      const searchbox = screen.getByRole('searchbox')
      expect(searchbox).toBeInTheDocument()
    })

    it('should have proper label for screen readers', () => {
      render(<SearchBar onSearch={jest.fn()} ariaLabel="Cari berita" />)
      const searchbox = screen.getByLabelText('Cari berita')
      expect(searchbox).toBeInTheDocument()
    })
  })

  describe('Button', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Button>Click me</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have button role', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should have proper focus styles', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:ring-2')
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

    it('should have navigation role with proper label', () => {
      render(
        <Pagination currentPage={1} totalPages={5} basePath="/berita" />
      )
      const navigation = screen.getByRole('navigation', { name: UI_TEXT.pagination.ariaLabel })
      expect(navigation).toBeInTheDocument()
    })

    it('should have page links with proper labels', () => {
      render(
        <Pagination currentPage={1} totalPages={5} basePath="/berita" />
      )
      const pageLink = screen.getByRole('link', { name: `${UI_TEXT.pagination.page} 1` })
      expect(pageLink).toBeInTheDocument()
      expect(pageLink).toHaveAttribute('aria-current', 'page')
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

    it('should have status role', () => {
      render(<EmptyState title="No results" description="No items found" />)
      const status = screen.getByRole('status')
      expect(status).toBeInTheDocument()
    })

    it('should have heading', () => {
      render(<EmptyState title="No results" description="No items found" />)
      const heading = screen.getByRole('heading')
      expect(heading).toBeInTheDocument()
    })
  })

  describe('Badge', () => {
    it('should have no accessibility violations (span)', async () => {
      const { container } = render(<Badge>Category</Badge>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations (link)', async () => {
      const { container } = render(<Badge href="/berita">Category</Badge>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper link role when href is provided', () => {
      render(<Badge href="/berita">Category</Badge>)
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
    })

    it('should have no role when rendered as span', () => {
      render(<Badge>Category</Badge>)
      const span = screen.getByText('Category')
      expect(span).toBeInTheDocument()
    })
  })

  describe('SectionHeading', () => {
    it('should have no accessibility violations (h2 default)', async () => {
      const { container } = render(<SectionHeading>Test Heading</SectionHeading>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should render as h1 when specified', () => {
      render(<SectionHeading level="h1">Heading 1</SectionHeading>)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
    })

    it('should render as h2 when specified', () => {
      render(<SectionHeading level="h2">Heading 2</SectionHeading>)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
    })

    it('should render as h3 when specified', () => {
      render(<SectionHeading level="h3">Heading 3</SectionHeading>)
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toBeInTheDocument()
    })

    it('should render with custom id when provided', () => {
      render(<SectionHeading id="custom-id">Custom ID Heading</SectionHeading>)
      const heading = screen.getByRole('heading')
      expect(heading).toHaveAttribute('id', 'custom-id')
    })
  })

  describe('Breadcrumb', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Breadcrumb items={[]} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have navigation role with proper label', () => {
      render(<Breadcrumb items={[]} />)
      const nav = screen.getByRole('navigation', { name: 'Navigasi breadcrumb' })
      expect(nav).toBeInTheDocument()
    })

    it('should have proper list structure', () => {
      render(<Breadcrumb items={[{ label: 'News', href: '/news' }]} />)
      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
    })
  })

  describe('MetaInfo', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<MetaInfo date="2026-01-15" author="John Doe" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper semantic structure', () => {
      render(<MetaInfo date="2026-01-15" author="John Doe" />)
      const time = screen.getByRole('time')
      expect(time).toBeInTheDocument()
    })
  })

  describe('SocialShare', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SocialShare url="https://example.com" title="Test" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have buttons with proper aria-labels', () => {
      render(<SocialShare url="https://example.com" title="Test" />)
      const twitterButton = screen.getByRole('button', { name: /Twitter/i })
      expect(twitterButton).toBeInTheDocument()
    })

    it('should have copy link button', () => {
      render(<SocialShare url="https://example.com" title="Test" />)
      const copyButton = screen.getByRole('button', { name: /Salin tautan/i })
      expect(copyButton).toBeInTheDocument()
    })
  })
})
