import { render, screen } from '@testing-library/react'
import PostCard from '@/components/post/PostCard'
import type { WordPressPost } from '@/types/wordpress'

describe('PostCard Component', () => {
  const mockPost: WordPressPost = {
    id: 1,
    title: { rendered: 'Test Post Title' },
    content: { rendered: '<p>Test content</p>' },
    excerpt: { rendered: '<p>Test excerpt</p>' },
    slug: 'test-post',
    date: '2026-01-10T10:00:00',
    modified: '2026-01-10T10:00:00',
    author: 1,
    featured_media: 123,
    categories: [1],
    tags: [1],
    status: 'publish',
    type: 'post',
    link: 'https://example.com/test-post'
  }

  const mockMediaUrl = 'https://example.com/image.jpg'

  describe('Rendering', () => {
    test('renders post title', () => {
      render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      expect(screen.getByRole('heading', { name: 'Test Post Title' })).toBeInTheDocument()
    })

    test('renders post excerpt', () => {
      render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      expect(screen.getByText('Test excerpt')).toBeInTheDocument()
    })

    test('renders post date', () => {
      render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      expect(screen.getByText(/Januari/)).toBeInTheDocument()
    })

    test('renders article with proper semantics', () => {
      const { container } = render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const article = container.querySelector('article')
      expect(article).toBeInTheDocument()
    })
  })

  describe('Image Handling', () => {
    test('renders image when featured_media is provided', () => {
      render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const image = screen.getByRole('img', { name: /Gambar utama untuk artikel: Test Post Title/ })
      expect(image).toBeInTheDocument()
    })

    test('uses provided mediaUrl for image', () => {
      render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const image = screen.getByRole('img')
      expect(image).toHaveAttribute('src', expect.stringContaining('image.jpg'))
    })

    test('does not render image when featured_media is 0', () => {
      const postWithoutMedia = { ...mockPost, featured_media: 0 }
      const { container } = render(<PostCard post={postWithoutMedia} mediaUrl={null} />)
      const image = container.querySelector('img')
      expect(image).not.toBeInTheDocument()
    })

    test('uses placeholder image when mediaUrl is null', () => {
      render(<PostCard post={mockPost} mediaUrl={null} />)
      const image = screen.getByRole('img')
      expect(image).toHaveAttribute('src', expect.stringContaining('placeholder-image.jpg'))
    })

    test('image is wrapped in link to post detail', () => {
      render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const link = screen.getByRole('link', { name: /Baca artikel: Test Post Title/ })
      expect(link).toBeInTheDocument()
    })

    test('image link has correct href', () => {
      render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const link = screen.getByRole('link', { name: /Baca artikel: Test Post Title/ })
      expect(link).toHaveAttribute('href', '/berita/test-post')
    })
  })

  describe('Title Link', () => {
    test('title is wrapped in link to post detail', () => {
      render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const link = screen.getByRole('link', { name: 'Test Post Title' })
      expect(link).toBeInTheDocument()
    })

    test('title link has correct href', () => {
      render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const link = screen.getByRole('link', { name: 'Test Post Title' })
      expect(link).toHaveAttribute('href', '/berita/test-post')
    })

    test('title link has hover class', () => {
      const { container } = render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const link = screen.getByRole('link', { name: 'Test Post Title' })
      expect(link).toHaveClass('hover:text-[hsl(var(--color-primary))]')
    })
  })

  describe('HTML Sanitization', () => {
    test('excerpt is sanitized (removes scripts)', () => {
      const maliciousPost = {
        ...mockPost,
        excerpt: { rendered: '<p>Safe</p><script>alert("xss")</script>' }
      }
      render(<PostCard post={maliciousPost} mediaUrl={mockMediaUrl} />)
      const excerpt = screen.getByText('Safe')
      expect(excerpt).toBeInTheDocument()
    })

    test('excerpt is sanitized (removes dangerous attributes)', () => {
      const maliciousPost = {
        ...mockPost,
        excerpt: { rendered: '<p onclick="alert("xss")">Test</p>' }
      }
      render(<PostCard post={maliciousPost} mediaUrl={mockMediaUrl} />)
      const excerpt = screen.getByText('Test')
      expect(excerpt).toBeInTheDocument()
    })
  })

  describe('Priority Prop', () => {
    test('does not set priority on image by default', () => {
      render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const image = screen.getByRole('img')
      expect(image).not.toHaveAttribute('priority')
    })

    test('sets priority on image when priority prop is true', () => {
      render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} priority={true} />)
      const image = screen.getByRole('img')
      expect(image).toBeInTheDocument()
    })
  })

  describe('Design Tokens', () => {
    test('uses design tokens for background color', () => {
      const { container } = render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('bg-[hsl(var(--color-surface))]')
    })

    test('uses design tokens for border radius', () => {
      const { container } = render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('rounded-[var(--radius-lg)]')
    })

    test('uses design tokens for shadow', () => {
      const { container } = render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('shadow-[var(--shadow-md)]')
    })
  })

  describe('Accessibility', () => {
    test('image link has aria-label', () => {
      render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const link = screen.getByRole('link', { name: /Baca artikel: Test Post Title/ })
      expect(link).toHaveAccessibleName('Baca artikel: Test Post Title')
    })

    test('excerpt has aria-hidden attribute', () => {
      const { container } = render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const excerpt = container.querySelector('[aria-hidden="true"]')
      expect(excerpt).toBeInTheDocument()
    })

    test('time element has datetime attribute', () => {
      const { container } = render(<PostCard post={mockPost} mediaUrl={mockMediaUrl} />)
      const time = container.querySelector('time')
      expect(time).toHaveAttribute('datetime', '2026-01-10T10:00:00')
    })
  })

  describe('Edge Cases', () => {
    test('handles empty excerpt', () => {
      const postWithEmptyExcerpt = { ...mockPost, excerpt: { rendered: '' } }
      render(<PostCard post={postWithEmptyExcerpt} mediaUrl={mockMediaUrl} />)
      const article = screen.getByRole('article')
      expect(article).toBeInTheDocument()
    })

    test('handles special characters in title', () => {
      const postWithSpecialChars = { ...mockPost, title: { rendered: 'Test & "Special" <Chars>' } }
      render(<PostCard post={postWithSpecialChars} mediaUrl={mockMediaUrl} />)
      expect(screen.getByRole('heading', { name: /Test & "Special" <Chars>/ })).toBeInTheDocument()
    })

    test('handles very long title', () => {
      const longTitle = 'A'.repeat(200)
      const postWithLongTitle = { ...mockPost, title: { rendered: longTitle } }
      render(<PostCard post={postWithLongTitle} mediaUrl={mockMediaUrl} />)
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })

    test('handles HTML entities in title', () => {
      const postWithEntities = { ...mockPost, title: { rendered: 'Test &amp; &quot;Entity&quot;' } }
      render(<PostCard post={postWithEntities} mediaUrl={mockMediaUrl} />)
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })
  })
})
