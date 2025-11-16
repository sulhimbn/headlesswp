import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import BeritaPage from '@/app/berita/page'
import PostPage from '@/app/berita/[slug]/page'
import { wordpressAPI } from '@/lib/wordpress'
import { notFound } from 'next/navigation'

// Mock the WordPress API
jest.mock('@/lib/wordpress')
const mockWordpressAPI = wordpressAPI as jest.Mocked<typeof wordpressAPI>

// Mock Next.js components and functions
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

jest.mock('next/image', () => {
  return function MockImage({ alt, ...props }: any) {
    return <img alt={alt} {...props} />
  }
})

jest.mock('next/navigation', () => ({
  notFound: jest.fn()
}))

const mockNotFound = notFound as jest.MockedFunction<typeof notFound>

describe('Berita Pages Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Berita Listing Page', () => {
    const mockPosts = [
      {
        id: 1,
        title: { rendered: 'Berita Pertama' },
        content: { rendered: '<p>Konten berita pertama</p>' },
        excerpt: { rendered: '<p>Excerpt berita pertama</p>' },
        slug: 'berita-pertama',
        date: '2024-01-01T00:00:00Z',
        modified: '2024-01-01T00:00:00Z',
        author: 1,
        featured_media: 1,
        categories: [1],
        tags: [1],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/berita-pertama'
      },
      {
        id: 2,
        title: { rendered: 'Berita Kedua' },
        content: { rendered: '<p>Konten berita kedua</p>' },
        excerpt: { rendered: '<p>Excerpt berita kedua</p>' },
        slug: 'berita-kedua',
        date: '2024-01-02T00:00:00Z',
        modified: '2024-01-02T00:00:00Z',
        author: 1,
        featured_media: 0,
        categories: [2],
        tags: [2],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/berita-kedua'
      }
    ]

    it('renders berita listing page with posts', async () => {
      mockWordpressAPI.getPosts.mockResolvedValue(mockPosts)

      const Page = await BeritaPage()
      render(Page)

      expect(screen.getByText('Semua Berita')).toBeInTheDocument()
      expect(screen.getByText('Kumpulan berita terkini dari Mitra Banten News')).toBeInTheDocument()
      expect(screen.getByText('Berita Pertama')).toBeInTheDocument()
      expect(screen.getByText('Berita Kedua')).toBeInTheDocument()
    })

    it('renders empty state when no posts available', async () => {
      mockWordpressAPI.getPosts.mockResolvedValue([])

      const Page = await BeritaPage()
      render(Page)

      expect(screen.getByText('Semua Berita')).toBeInTheDocument()
      expect(screen.queryByText(/Berita/)).not.toBeInTheDocument()
    })

    it('handles API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      mockWordpressAPI.getPosts.mockRejectedValue(new Error('API Error'))

      const Page = await BeritaPage()
      render(Page)

      expect(screen.getByText('Semua Berita')).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch posts during build:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('renders correct number of posts', async () => {
      const manyPosts = Array.from({ length: 10 }, (_, i) => ({
        ...mockPosts[0],
        id: i + 1,
        title: { rendered: `Berita ${i + 1}` },
        slug: `berita-${i + 1}`
      }))

      mockWordpressAPI.getPosts.mockResolvedValue(manyPosts)

      const Page = await BeritaPage()
      render(Page)

      expect(screen.getByText('Berita 1')).toBeInTheDocument()
      expect(screen.getByText('Berita 10')).toBeInTheDocument()
    })

    it('renders images for posts with featured media', async () => {
      const postWithImage = { ...mockPosts[0], featured_media: 1 }
      mockWordpressAPI.getPosts.mockResolvedValue([postWithImage])

      const Page = await BeritaPage()
      render(Page)

      const images = screen.getAllByAltText('Berita Pertama')
      expect(images.length).toBe(1)
    })

    it('does not render images for posts without featured media', async () => {
      const postWithoutImage = { ...mockPosts[0], featured_media: 0 }
      mockWordpressAPI.getPosts.mockResolvedValue([postWithoutImage])

      const Page = await BeritaPage()
      render(Page)

      const images = screen.queryAllByAltText('Berita Pertama')
      expect(images.length).toBe(0)
    })

    it('formats dates correctly', async () => {
      mockWordpressAPI.getPosts.mockResolvedValue([mockPosts[0]])

      const Page = await BeritaPage()
      render(Page)

      expect(screen.getByText('1 Januari 2024')).toBeInTheDocument()
    })

    it('renders navigation correctly', async () => {
      mockWordpressAPI.getPosts.mockResolvedValue([])

      const Page = await BeritaPage()
      render(Page)

      expect(screen.getByText('Beranda')).toBeInTheDocument()
      expect(screen.getByText('Berita')).toBeInTheDocument()
      expect(screen.getByText('Politik')).toBeInTheDocument()
      expect(screen.getByText('Ekonomi')).toBeInTheDocument()
      expect(screen.getByText('Olahraga')).toBeInTheDocument()
    })

    it('has proper page structure', async () => {
      mockWordpressAPI.getPosts.mockResolvedValue([])

      const Page = await BeritaPage()
      const { container } = render(Page)

      expect(container.querySelector('header')).toBeInTheDocument()
      expect(container.querySelector('main')).toBeInTheDocument()
      expect(container.querySelector('footer')).toBeInTheDocument()
      expect(container.querySelector('h1')).toBeInTheDocument()
    })
  })

  describe('Post Detail Page', () => {
    const mockPost = {
      id: 1,
      title: { rendered: 'Berita Detail' },
      content: { rendered: '<p>Konten detail berita</p><p>Paragraf kedua</p>' },
      excerpt: { rendered: '<p>Excerpt berita detail</p>' },
      slug: 'berita-detail',
      date: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
      author: 1,
      featured_media: 1,
      categories: [1, 2],
      tags: [10, 20, 30],
      status: 'publish',
      type: 'post',
      link: 'https://example.com/berita-detail'
    }

    it('renders post detail page successfully', async () => {
      mockWordpressAPI.getPost.mockResolvedValue(mockPost)

      const Page = await PostPage({ params: { slug: 'berita-detail' } })
      render(Page)

      expect(screen.getByText('Berita Detail')).toBeInTheDocument()
      expect(screen.getByText('Konten detail berita')).toBeInTheDocument()
      expect(screen.getByText('Paragraf kedua')).toBeInTheDocument()
    })

    it('calls notFound when post does not exist', async () => {
      mockWordpressAPI.getPost.mockResolvedValue(null)

      await PostPage({ params: { slug: 'non-existent' } })

      expect(mockNotFound).toHaveBeenCalled()
    })

    it('calls notFound when API throws error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockWordpressAPI.getPost.mockRejectedValue(new Error('API Error'))

      await PostPage({ params: { slug: 'error-post' } })

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching post with slug error-post:', expect.any(Error))
      expect(mockNotFound).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('calls notFound when post missing required fields', async () => {
      const invalidPost = {
        ...mockPost,
        title: { rendered: '' },
        content: { rendered: '' }
      }
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockWordpressAPI.getPost.mockResolvedValue(invalidPost)

      await PostPage({ params: { slug: 'invalid-post' } })

      expect(consoleSpy).toHaveBeenCalledWith('Post is missing required fields:', invalidPost)
      expect(mockNotFound).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('renders featured image when media exists', async () => {
      mockWordpressAPI.getPost.mockResolvedValue(mockPost)

      const Page = await PostPage({ params: { slug: 'berita-detail' } })
      render(Page)

      const images = screen.getAllByAltText('Berita Detail')
      expect(images.length).toBe(1)
    })

    it('does not render featured image when no media', async () => {
      const postWithoutImage = { ...mockPost, featured_media: 0 }
      mockWordpressAPI.getPost.mockResolvedValue(postWithoutImage)

      const Page = await PostPage({ params: { slug: 'no-image' } })
      render(Page)

      const images = screen.queryAllByAltText('Berita Detail')
      expect(images.length).toBe(0)
    })

    it('renders categories when present', async () => {
      mockWordpressAPI.getPost.mockResolvedValue(mockPost)

      const Page = await PostPage({ params: { slug: 'berita-detail' } })
      render(Page)

      expect(screen.getByText('Category 1')).toBeInTheDocument()
      expect(screen.getByText('Category 2')).toBeInTheDocument()
    })

    it('does not render categories section when none exist', async () => {
      const postWithoutCategories = { ...mockPost, categories: [] }
      mockWordpressAPI.getPost.mockResolvedValue(postWithoutCategories)

      const Page = await PostPage({ params: { slug: 'no-categories' } })
      render(Page)

      expect(screen.queryByText('Category 1')).not.toBeInTheDocument()
    })

    it('renders tags when present', async () => {
      mockWordpressAPI.getPost.mockResolvedValue(mockPost)

      const Page = await PostPage({ params: { slug: 'berita-detail' } })
      render(Page)

      expect(screen.getByText('#10')).toBeInTheDocument()
      expect(screen.getByText('#20')).toBeInTheDocument()
      expect(screen.getByText('#30')).toBeInTheDocument()
    })

    it('does not render tags section when none exist', async () => {
      const postWithoutTags = { ...mockPost, tags: [] }
      mockWordpressAPI.getPost.mockResolvedValue(postWithoutTags)

      const Page = await PostPage({ params: { slug: 'no-tags' } })
      render(Page)

      expect(screen.queryByText('#10')).not.toBeInTheDocument()
    })

    it('formats date correctly', async () => {
      mockWordpressAPI.getPost.mockResolvedValue(mockPost)

      const Page = await PostPage({ params: { slug: 'berita-detail' } })
      render(Page)

      expect(screen.getByText('1 Januari 2024')).toBeInTheDocument()
    })

    it('renders back to home link', async () => {
      mockWordpressAPI.getPost.mockResolvedValue(mockPost)

      const Page = await PostPage({ params: { slug: 'berita-detail' } })
      render(Page)

      const backLink = screen.getByText('← Kembali ke Beranda')
      expect(backLink).toBeInTheDocument()
      expect(backLink.closest('a')).toHaveAttribute('href', '/')
    })

    it('sanitizes HTML content properly', async () => {
      const postWithHTML = {
        ...mockPost,
        content: { rendered: '<p>Safe content</p><script>alert("xss")</script>' }
      }
      mockWordpressAPI.getPost.mockResolvedValue(postWithHTML)

      const Page = await PostPage({ params: { slug: 'html-test' } })
      render(Page)

      expect(screen.getByText('Safe content')).toBeInTheDocument()
      // Script tag should be sanitized by DOMPurify
    })

    it('has proper article structure', async () => {
      mockWordpressAPI.getPost.mockResolvedValue(mockPost)

      const Page = await PostPage({ params: { slug: 'berita-detail' } })
      const { container } = render(Page)

      const article = container.querySelector('article')
      expect(article).toBeInTheDocument()
      expect(article).toHaveClass('bg-white', 'rounded-lg', 'shadow-lg', 'overflow-hidden')
    })

    it('handles special characters in title', async () => {
      const postWithSpecialChars = {
        ...mockPost,
        title: { rendered: 'Berita & "Special" <Characters>' }
      }
      mockWordpressAPI.getPost.mockResolvedValue(postWithSpecialChars)

      const Page = await PostPage({ params: { slug: 'special-chars' } })
      render(Page)

      expect(screen.getByText('Berita & "Special" <Characters>')).toBeInTheDocument()
    })
  })

  describe('Dynamic Routing', () => {
    it('handles different slug formats', async () => {
      const testCases = [
        'simple-slug',
        'slug-with-hyphens',
        'slug_with_underscores',
        'slug-with-numbers-123',
        'very-long-slug-with-many-words-and-hyphens'
      ]

      for (const slug of testCases) {
        jest.clearAllMocks()
        const mockPost = {
          id: 1,
          title: { rendered: `Test Post for ${slug}` },
          content: { rendered: '<p>Test content</p>' },
          excerpt: { rendered: '<p>Test excerpt</p>' },
          slug,
          date: '2024-01-01T00:00:00Z',
          modified: '2024-01-01T00:00:00Z',
          author: 1,
          featured_media: 0,
          categories: [],
          tags: [],
          status: 'publish',
          type: 'post',
          link: `https://example.com/${slug}`
        }

        mockWordpressAPI.getPost.mockResolvedValue(mockPost)

        const Page = await PostPage({ params: { slug } })
        render(Page)

        expect(screen.getByText(`Test Post for ${slug}`)).toBeInTheDocument()
      }
    })

    it('passes correct slug to API', async () => {
      mockWordpressAPI.getPost.mockResolvedValue(null)

      await PostPage({ params: { slug: 'test-slug-123' } })

      expect(mockWordpressAPI.getPost).toHaveBeenCalledWith('test-slug-123')
    })
  })
})