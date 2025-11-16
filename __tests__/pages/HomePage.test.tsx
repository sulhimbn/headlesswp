import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '@/app/page'
import { wordpressAPI } from '@/lib/wordpress'

// Mock the WordPress API
jest.mock('@/lib/wordpress')
const mockWordpressAPI = wordpressAPI as jest.Mocked<typeof wordpressAPI>

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

jest.mock('next/image', () => {
  return function MockImage({ alt, fill, ...props }: any) {
    // Convert boolean fill to string attribute if needed
    const imageProps = { ...props }
    if (fill !== undefined) {
      imageProps.fill = fill ? "true" : "false"
    }
    return <img alt={alt} {...imageProps} />
  }
})

const mockLatestPosts = [
  {
    id: 1,
    title: { rendered: 'Latest Post 1' },
    content: { rendered: '<p>Latest content 1</p>' },
    excerpt: { rendered: '<p>Latest excerpt 1</p>' },
    slug: 'latest-post-1',
    date: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
    author: 1,
    featured_media: 1,
    categories: [1],
    tags: [1],
    status: 'publish',
    type: 'post',
    link: 'https://example.com/latest-post-1'
  },
  {
    id: 2,
    title: { rendered: 'Latest Post 2' },
    content: { rendered: '<p>Latest content 2</p>' },
    excerpt: { rendered: '<p>Latest excerpt 2</p>' },
    slug: 'latest-post-2',
    date: '2024-01-02T00:00:00Z',
    modified: '2024-01-02T00:00:00Z',
    author: 1,
    featured_media: 0,
    categories: [2],
    tags: [2],
    status: 'publish',
    type: 'post',
    link: 'https://example.com/latest-post-2'
  }
]

const mockCategoryPosts = [
  {
    id: 3,
    title: { rendered: 'Category Post 1' },
    content: { rendered: '<p>Category content 1</p>' },
    excerpt: { rendered: '<p>Category excerpt 1</p>' },
    slug: 'category-post-1',
    date: '2024-01-03T00:00:00Z',
    modified: '2024-01-03T00:00:00Z',
    author: 1,
    featured_media: 1,
    categories: [3],
    tags: [3],
    status: 'publish',
    type: 'post',
    link: 'https://example.com/category-post-1'
  },
  {
    id: 4,
    title: { rendered: 'Category Post 2' },
    content: { rendered: '<p>Category content 2</p>' },
    excerpt: { rendered: '<p>Category excerpt 2</p>' },
    slug: 'category-post-2',
    date: '2024-01-04T00:00:00Z',
    modified: '2024-01-04T00:00:00Z',
    author: 1,
    featured_media: 0,
    categories: [4],
    tags: [4],
    status: 'publish',
    type: 'post',
    link: 'https://example.com/category-post-2'
  }
]

describe('HomePage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Successful data fetching', () => {

    it('renders page with successful data fetch', async () => {
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce(mockLatestPosts) // latest posts
        .mockResolvedValueOnce(mockCategoryPosts) // category posts

      const Page = await HomePage()
      render(Page)

      expect(screen.getByText('Mitra Banten News')).toBeInTheDocument()
      expect(screen.getByText('Berita Utama')).toBeInTheDocument()
      expect(screen.getByText('Berita Terkini')).toBeInTheDocument()
      expect(screen.getByText('Latest Post 1')).toBeInTheDocument()
      expect(screen.getByText('Latest Post 2')).toBeInTheDocument()
      expect(screen.getByText('Category Post 1')).toBeInTheDocument()
      expect(screen.getByText('Category Post 2')).toBeInTheDocument()
    })

it('renders correct number of posts in each section', async () => {
      const manyLatestPosts = Array.from({ length: 6 }, (_, i) => ({
        ...mockLatestPosts[0],
        id: i + 1,
        title: { rendered: `Latest Post ${i + 1}` },
        slug: `latest-post-${i + 1}`
      }))
      const manyCategoryPosts = Array.from({ length: 3 }, (_, i) => ({
        ...mockCategoryPosts[0],
        id: i + 10,
        title: { rendered: `Category Post ${i + 1}` },
        slug: `category-post-${i + 1}`
      }))

      mockWordpressAPI.getPosts
        .mockResolvedValueOnce(manyLatestPosts) // 6 latest posts
        .mockResolvedValueOnce(manyCategoryPosts) // 3 category posts

      const Page = await HomePage()
      render(Page)

      expect(screen.getAllByText(/Latest Post/)).toHaveLength(6)
      expect(screen.getAllByText(/Category Post/)).toHaveLength(3)
    })

    it('renders navigation links correctly', async () => {
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const Page = await HomePage()
      render(Page)

      expect(screen.getByText('Beranda')).toBeInTheDocument()
      expect(screen.getByText('Berita')).toBeInTheDocument()
      expect(screen.getByText('Politik')).toBeInTheDocument()
      expect(screen.getByText('Ekonomi')).toBeInTheDocument()
      expect(screen.getByText('Olahraga')).toBeInTheDocument()
    })

    it('renders footer correctly', async () => {
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const Page = await HomePage()
      render(Page)

      expect(screen.getByText('© 2024 Mitra Banten News. All rights reserved.')).toBeInTheDocument()
    })

    it('formats dates correctly', async () => {
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce([mockLatestPosts[0]]) // latest posts
        .mockResolvedValueOnce([mockCategoryPosts[0]]) // category posts

      const Page = await HomePage()
      render(Page)

      expect(screen.getByText('1 Januari 2024')).toBeInTheDocument()
    })

it('renders images when featured_media exists', async () => {
      const postWithImage = { ...mockLatestPosts[0], featured_media: 1 }
      
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce([postWithImage]) // latest posts
        .mockResolvedValueOnce([postWithImage]) // category posts

      const Page = await HomePage()
      render(Page)

      const images = screen.getAllByAltText('Latest Post 1')
      expect(images.length).toBe(2)
    })

it('does not render images when featured_media is 0', async () => {
      const postWithoutImage = { ...mockLatestPosts[0], featured_media: 0 }
      
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce([postWithoutImage]) // latest posts
        .mockResolvedValueOnce([postWithoutImage]) // category posts

      const Page = await HomePage()
      render(Page)

      const images = screen.queryByAltText('Latest Post 1')
      expect(images).not.toBeInTheDocument()
    })

    it('does not render images when featured_media is 0', async () => {
      const postWithoutImage = { ...mockPosts[0], featured_media: 0 }
      
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce([postWithoutImage]) // latest posts
        .mockResolvedValueOnce([postWithoutImage]) // category posts

      const Page = await HomePage()
      render(Page)

      const images = screen.queryAllByAltText('Test Post 1')
      expect(images.length).toBe(0)
    })
  })

  describe('Error handling and fallbacks', () => {
    it('renders fallback posts when API fails', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      mockWordpressAPI.getPosts
        .mockRejectedValueOnce(new Error('API Error')) // latest posts fail
        .mockRejectedValueOnce(new Error('API Error')) // category posts fail

      const Page = await HomePage()
      render(Page)

      expect(screen.getByText('Berita Utama 1')).toBeInTheDocument()
      expect(screen.getByText('Berita Utama 2')).toBeInTheDocument()
      expect(screen.getByText('Berita Utama 3')).toBeInTheDocument()
      expect(screen.getByText('Berita Kategori 1')).toBeInTheDocument()
      expect(screen.getByText('Berita Kategori 2')).toBeInTheDocument()
      expect(screen.getByText('Berita Kategori 3')).toBeInTheDocument()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch latest posts during build:',
        expect.any(Error)
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch category posts during build:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('renders fallback content for posts', async () => {
      mockWordpressAPI.getPosts
        .mockRejectedValueOnce(new Error('API Error'))
        .mockRejectedValueOnce(new Error('API Error'))

      const Page = await HomePage()
      render(Page)

      expect(screen.getAllByText('Maaf, artikel tidak dapat dimuat saat ini. Silakan coba lagi nanti.')).toHaveLength(6)
    })

it('handles mixed success and failure scenarios', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce([mockLatestPosts[0]]) // latest posts succeed
        .mockRejectedValueOnce(new Error('API Error')) // category posts fail

      const Page = await HomePage()
      render(Page)

      expect(screen.getByText('Latest Post 1')).toBeInTheDocument()
      expect(screen.getByText('Berita Kategori 1')).toBeInTheDocument()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch category posts during build:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Component structure and layout', () => {
    it('has proper semantic HTML structure', async () => {
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const Page = await HomePage()
      const { container } = render(Page)

      expect(container.querySelector('header')).toBeInTheDocument()
      expect(container.querySelector('main')).toBeInTheDocument()
      expect(container.querySelector('footer')).toBeInTheDocument()
      expect(container.querySelector('nav')).toBeInTheDocument()
      expect(container.querySelectorAll('section')).toHaveLength(2)
      expect(container.querySelectorAll('article')).toHaveLength(0) // No posts
    })

    it('has correct CSS classes and styling', async () => {
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const Page = await HomePage()
      const { container } = render(Page)

      const mainContainer = container.querySelector('.min-h-screen.bg-gray-50')
      expect(mainContainer).toBeInTheDocument()

      const header = container.querySelector('.bg-white.shadow-sm')
      expect(header).toBeInTheDocument()

      const main = container.querySelector('.max-w-7xl.mx-auto')
      expect(main).toBeInTheDocument()
    })

    it('renders post links correctly', async () => {
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce([mockLatestPosts[0]])
        .mockResolvedValueOnce([mockCategoryPosts[0]])

      const Page = await HomePage()
      render(Page)

      const links = screen.getAllByRole('link', { name: /Post/ })
      expect(links.length).toBe(2)
      expect(links[0]).toHaveAttribute('href', '/berita/latest-post-1')
    })

    it('handles empty post arrays', async () => {
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const Page = await HomePage()
      render(Page)

      expect(screen.getByText('Berita Utama')).toBeInTheDocument()
      expect(screen.getByText('Berita Terkini')).toBeInTheDocument()
      
      // Should not show any post content
      expect(screen.queryByText(/Test Post/)).not.toBeInTheDocument()
    })
  })
  })

describe('Content rendering', () => {
    it('sanitizes HTML content in excerpts', async () => {
      const postWithHTML = {
        ...mockLatestPosts[0],
        excerpt: { rendered: '<p>Test excerpt with <strong>bold</strong> text</p>' }
      }
      
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce([postWithHTML])
        .mockResolvedValueOnce([postWithHTML])

      const Page = await HomePage()
      render(Page)

      expect(screen.getByText('Test excerpt with bold text')).toBeInTheDocument()
    })

    it('handles special characters in titles', async () => {
      const postWithSpecialChars = {
        ...mockLatestPosts[0],
        title: { rendered: 'Test & "Special" <Characters>' }
      }
      
      mockWordpressAPI.getPosts
        .mockResolvedValueOnce([postWithSpecialChars])
        .mockResolvedValueOnce([postWithSpecialChars])

      const Page = await HomePage()
      render(Page)

      expect(screen.getByText('Test & "Special" <Characters>')).toBeInTheDocument()
    })
  })

  describe('Performance considerations', () => {
    it('handles large numbers of posts efficiently', async () => {
      const manyPosts = Array.from({ length: 10 }, (_, i) => ({
        ...mockLatestPosts[0],
        id: i + 1,
        title: { rendered: `Test Post ${i + 1}` },
        slug: `test-post-${i + 1}`
      }))

      mockWordpressAPI.getPosts
        .mockResolvedValueOnce(manyPosts)
        .mockResolvedValueOnce(manyPosts.slice(0, 5))

      const Page = await HomePage()
      render(Page)

      expect(screen.getAllByText(/Test Post/)).toHaveLength(15)
    })
  })
