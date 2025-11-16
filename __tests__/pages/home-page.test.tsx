import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'
import { wordpressAPI } from '@/lib/wordpress'
import { WordPressPost } from '@/types/wordpress'

// Mock the WordPress API
jest.mock('@/lib/wordpress')
const mockedWordpressAPI = wordpressAPI as jest.Mocked<typeof wordpressAPI>

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

jest.mock('next/image', () => {
  return function MockImage({ alt, fill, ...props }: any) {
    return <img alt={alt} {...(fill && { 'data-fill': 'true' })} {...props} />
  }
})

describe('HomePage Integration Tests', () => {
  const mockPosts: WordPressPost[] = [
    {
      id: 1,
      title: { rendered: 'Berita Utama 1' },
      content: { rendered: '<p>Konten berita utama 1</p>' },
      excerpt: { rendered: '<p>Ringkasan berita utama 1</p>' },
      slug: 'berita-utama-1',
      date: '2024-01-15T10:00:00',
      modified: '2024-01-15T10:00:00',
      author: 1,
      featured_media: 101,
      categories: [1, 2],
      tags: [3, 4],
      status: 'publish',
      type: 'post',
      link: 'https://mitrabantennews.com/berita-utama-1'
    },
    {
      id: 2,
      title: { rendered: 'Berita Utama 2' },
      content: { rendered: '<p>Konten berita utama 2</p>' },
      excerpt: { rendered: '<p>Ringkasan berita utama 2</p>' },
      slug: 'berita-utama-2',
      date: '2024-01-14T15:30:00',
      modified: '2024-01-14T15:30:00',
      author: 2,
      featured_media: 102,
      categories: [1],
      tags: [5],
      status: 'publish',
      type: 'post',
      link: 'https://mitrabantennews.com/berita-utama-2'
    },
    {
      id: 3,
      title: { rendered: 'Berita Terkini 1' },
      content: { rendered: '<p>Konten berita terkini 1</p>' },
      excerpt: { rendered: '<p>Ringkasan berita terkini 1</p>' },
      slug: 'berita-terkini-1',
      date: '2024-01-16T09:15:00',
      modified: '2024-01-16T09:15:00',
      author: 1,
      featured_media: 103,
      categories: [2],
      tags: [6, 7],
      status: 'publish',
      type: 'post',
      link: 'https://mitrabantennews.com/berita-terkini-1'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Successful Data Fetching', () => {
    it('should render home page with fetched posts', async () => {
      const categoryPosts = mockPosts.slice(0, 2) // Only 2 posts for category
      const latestPosts = [mockPosts[2]] // Only 1 post for latest

      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce(categoryPosts) // category posts
        .mockResolvedValueOnce(latestPosts) // latest posts

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      // Check header
      expect(screen.getByText('Mitra Banten News')).toBeInTheDocument()
      expect(screen.getByText('Beranda')).toBeInTheDocument()
      expect(screen.getByText('Berita')).toBeInTheDocument()
      expect(screen.getByText('Politik')).toBeInTheDocument()
      expect(screen.getByText('Ekonomi')).toBeInTheDocument()
      expect(screen.getByText('Olahraga')).toBeInTheDocument()

      // Check sections
      expect(screen.getByText('Berita Utama')).toBeInTheDocument()
      expect(screen.getByText('Berita Terkini')).toBeInTheDocument()

      // Check posts are rendered (using getAllByText since there might be duplicates)
      expect(screen.getAllByText('Berita Utama 1')).toHaveLength(1)
      expect(screen.getAllByText('Berita Utama 2')).toHaveLength(1)
      expect(screen.getAllByText('Berita Terkini 1')).toHaveLength(1)

      // Check footer
      expect(screen.getByText('© 2024 Mitra Banten News. All rights reserved.')).toBeInTheDocument()
    })

    it('should render posts with correct dates in Indonesian format', async () => {
      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce([mockPosts[0]])
        .mockResolvedValueOnce([mockPosts[0]])

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      // Check Indonesian date format
      expect(screen.getAllByText('15 Januari 2024')).toHaveLength(2)
    })

it('should render correct number of posts in each section', async () => {
      const categoryPosts = mockPosts.slice(0, 3) // 3 category posts
      const latestPosts = mockPosts.slice(0, 6) // 6 latest posts

      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce(categoryPosts)
        .mockResolvedValueOnce(latestPosts)

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      // Count post titles in Berita Utama section
      const beritaUtamaSection = screen.getByText('Berita Utama').closest('section')
      const beritaUtamaPosts = beritaUtamaSection?.querySelectorAll('h3')
      expect(beritaUtamaPosts?.length).toBe(3)

      // Count post titles in Berita Terkini section
      const beritaTerkiniSection = screen.getByText('Berita Terkini').closest('section')
      const beritaTerkiniPosts = beritaTerkiniSection?.querySelectorAll('h3')
      expect(beritaTerkiniPosts?.length).toBe(3)
    })

    it('should render images for posts with featured media', async () => {
      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce([mockPosts[0]]) // post with featured_media
        .mockResolvedValueOnce([mockPosts[0]])

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThan(0)
      expect(images[0]).toHaveAttribute('alt', 'Berita Utama 1')
    })

    it('should not render images for posts without featured media', async () => {
      const postWithoutMedia = {
        ...mockPosts[0],
        featured_media: 0
      }

      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce([postWithoutMedia])
        .mockResolvedValueOnce([postWithoutMedia])

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      const images = screen.queryAllByRole('img')
      expect(images.length).toBe(0)
    })
  })

  describe('Error Handling and Fallbacks', () => {
    it('should render fallback posts when API fails', async () => {
      mockedWordpressAPI.getPosts
        .mockRejectedValueOnce(new Error('API Error'))
        .mockRejectedValueOnce(new Error('API Error'))

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      // Should render fallback posts
      expect(screen.getByText('Berita Utama 1')).toBeInTheDocument()
      expect(screen.getByText('Berita Utama 2')).toBeInTheDocument()
      expect(screen.getByText('Berita Utama 3')).toBeInTheDocument()

      // Check fallback content
      expect(screen.getAllByText('Maaf, artikel tidak dapat dimuat saat ini. Silakan coba lagi nanti.')).toHaveLength(6)
    })

    it('should render mixed content when one API call fails', async () => {
      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce([mockPosts[0]]) // category posts succeed
        .mockRejectedValueOnce(new Error('API Error')) // latest posts fail

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      // Should have real posts in Berita Utama
      expect(screen.getByText('Berita Utama 1')).toBeInTheDocument()

      // Should have fallback posts in Berita Terkini
      expect(screen.getByText('Berita Kategori 1')).toBeInTheDocument()
      expect(screen.getByText('Berita Kategori 2')).toBeInTheDocument()
      expect(screen.getByText('Berita Kategori 3')).toBeInTheDocument()
    })

    it('should handle empty API responses', async () => {
      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      // Should render fallback posts when API returns empty arrays
      expect(screen.getByText('Berita Utama 1')).toBeInTheDocument()
      expect(screen.getByText('Berita Kategori 1')).toBeInTheDocument()
    })
  })

  describe('Navigation and Links', () => {
    it('should render navigation links with correct hrefs', async () => {
      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce([mockPosts[0]])
        .mockResolvedValueOnce([mockPosts[0]])

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      // Check navigation links
      const homeLink = screen.getByText('Beranda').closest('a')
      expect(homeLink).toHaveAttribute('href', '/')

      const beritaLink = screen.getByText('Berita').closest('a')
      expect(beritaLink).toHaveAttribute('href', '/berita')

      const politikLink = screen.getByText('Politik').closest('a')
      expect(politikLink).toHaveAttribute('href', '/politik')
    })

    it('should render post detail links with correct slugs', async () => {
      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce([mockPosts[0]])
        .mockResolvedValueOnce([mockPosts[0]])

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      // Check post links
      const postLinks = screen.getAllByText('Berita Utama 1')
      postLinks.forEach(link => {
        const linkElement = link.closest('a')
        expect(linkElement).toHaveAttribute('href', '/berita/berita-utama-1')
      })
    })
  })

  describe('Content Rendering', () => {
    it('should safely render HTML content in excerpts', async () => {
      const postWithHTML = {
        ...mockPosts[0],
        excerpt: { rendered: '<p>Excerpt with <strong>bold</strong> text</p>' }
      }

      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce([postWithHTML])
        .mockResolvedValueOnce([postWithHTML])

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      // Should render the HTML content
      expect(screen.getByText(/Excerpt with/)).toBeInTheDocument()
    })

    it('should handle posts with special characters in titles', async () => {
      const postWithSpecialChars = {
        ...mockPosts[0],
        title: { rendered: 'Berita & "Special" Characters: Test' }
      }

      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce([postWithSpecialChars])
        .mockResolvedValueOnce([postWithSpecialChars])

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      expect(screen.getByText('Berita & "Special" Characters: Test')).toBeInTheDocument()
    })

    it('should handle very long post titles', async () => {
      const longTitle = 'This is a very long post title that should still render properly without breaking the layout or causing any issues'
      const postWithLongTitle = {
        ...mockPosts[0],
        title: { rendered: longTitle }
      }

      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce([postWithLongTitle])
        .mockResolvedValueOnce([postWithLongTitle])

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })
  })

  describe('Component Structure', () => {
    it('should have proper semantic HTML structure', async () => {
      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce([mockPosts[0]])
        .mockResolvedValueOnce([mockPosts[0]])

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      // Check semantic elements
      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('main')).toBeInTheDocument()   // main
      expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer

      // Check articles
      const articles = screen.getAllByRole('article')
      expect(articles.length).toBeGreaterThan(0)
    })

    it('should have correct CSS classes for styling', async () => {
      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce([mockPosts[0]])
        .mockResolvedValueOnce([mockPosts[0]])

      const HomePageComponent = await HomePage()
      const { container } = render(HomePageComponent)

      // Check main container
      expect(container.firstChild).toHaveClass('min-h-screen', 'bg-gray-50')

      // Check header
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('bg-white', 'shadow-sm')

      // Check articles
      const articles = screen.getAllByRole('article')
      articles.forEach(article => {
        expect(article).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'overflow-hidden')
      })
    })
  })

  describe('API Integration', () => {
    it('should call wordpressAPI with correct parameters', async () => {
      mockedWordpressAPI.getPosts
        .mockResolvedValueOnce(mockPosts.slice(0, 3))
        .mockResolvedValueOnce(mockPosts)

      await HomePage()

      expect(mockedWordpressAPI.getPosts).toHaveBeenCalledTimes(2)
      expect(mockedWordpressAPI.getPosts).toHaveBeenCalledWith({ per_page: 3 })
      expect(mockedWordpressAPI.getPosts).toHaveBeenCalledWith({ per_page: 6 })
    })

    it('should handle API timeout gracefully', async () => {
      mockedWordpressAPI.getPosts
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('timeout'))

      const HomePageComponent = await HomePage()
      render(HomePageComponent)

      // Should render fallback content
      expect(screen.getByText('Berita Utama 1')).toBeInTheDocument()
    })
  })
})