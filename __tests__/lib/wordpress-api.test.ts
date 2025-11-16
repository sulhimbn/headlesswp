import { 
  getPosts, 
  getPostBySlug, 
  getCategories, 
  getTags, 
  getMediaById 
} from '@/lib/wordpress'
import DOMPurify from 'dompurify'

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((html: string) => html),
}))

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
}))

import axios from 'axios'

const mockAxiosGet = axios.get as jest.MockedFunction<typeof axios.get>

describe('WordPress API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPosts', () => {
    it('fetches posts successfully', async () => {
      const mockPosts = [
        {
          id: 1,
          title: { rendered: 'Test Post 1' },
          excerpt: { rendered: '<p>Test excerpt 1</p>' },
          slug: 'test-post-1',
          date: '2023-01-01T00:00:00',
        },
        {
          id: 2,
          title: { rendered: 'Test Post 2' },
          excerpt: { rendered: '<p>Test excerpt 2</p>' },
          slug: 'test-post-2',
          date: '2023-01-02T00:00:00',
        },
      ]

      mockAxiosGet.mockResolvedValueOnce({ data: mockPosts })

      const result = await getPosts()

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('/wp/v2/posts'),
        expect.objectContaining({
          params: expect.objectContaining({
            per_page: 10,
            page: 1,
          }),
        })
      )
      expect(result).toEqual(mockPosts)
    })

    it('handles API errors gracefully', async () => {
      const errorMessage = 'Network error'
      mockAxiosGet.mockRejectedValueOnce(new Error(errorMessage))

      await expect(getPosts()).rejects.toThrow(errorMessage)
    })

    it('sanitizes post excerpts', async () => {
      const mockPosts = [
        {
          id: 1,
          title: { rendered: 'Test Post' },
          excerpt: { rendered: '<p>Test excerpt <script>alert("xss")</script></p>' },
          slug: 'test-post',
          date: '2023-01-01T00:00:00',
        },
      ]

      mockAxiosGet.mockResolvedValueOnce({ data: mockPosts })

      await getPosts()

      expect(DOMPurify.sanitize).toHaveBeenCalled()
    })

    it('passes custom parameters correctly', async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: [] })

      await getPosts({ per_page: 5, page: 2, category: 1 })

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('/wp/v2/posts'),
        expect.objectContaining({
          params: expect.objectContaining({
            per_page: 5,
            page: 2,
            category: 1,
          }),
        })
      )
    })
  })

  describe('getPostBySlug', () => {
    it('fetches a single post by slug successfully', async () => {
      const mockPost = {
        id: 1,
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>Test content</p>' },
        excerpt: { rendered: '<p>Test excerpt</p>' },
        slug: 'test-post',
        date: '2023-01-01T00:00:00',
      }

      mockAxiosGet.mockResolvedValueOnce({ data: [mockPost] })

      const result = await getPostBySlug('test-post')

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('/wp/v2/posts'),
        expect.objectContaining({
          params: expect.objectContaining({
            slug: 'test-post',
          }),
        })
      )
      expect(result).toEqual(mockPost)
    })

    it('returns null when post not found', async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: [] })

      const result = await getPostBySlug('non-existent-post')

      expect(result).toBeNull()
    })

    it('handles API errors gracefully', async () => {
      const errorMessage = 'Network error'
      mockAxiosGet.mockRejectedValueOnce(new Error(errorMessage))

      await expect(getPostBySlug('test-post')).rejects.toThrow(errorMessage)
    })

    it('sanitizes post content', async () => {
      const mockPost = {
        id: 1,
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>Test content <script>alert("xss")</script></p>' },
        excerpt: { rendered: '<p>Test excerpt</p>' },
        slug: 'test-post',
        date: '2023-01-01T00:00:00',
      }

      mockAxiosGet.mockResolvedValueOnce({ data: [mockPost] })

      await getPostBySlug('test-post')

      expect(DOMPurify.sanitize).toHaveBeenCalled()
    })
  })

  describe('getCategories', () => {
    it('fetches categories successfully', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Technology',
          slug: 'technology',
          description: 'Tech related posts',
          count: 10,
        },
        {
          id: 2,
          name: 'News',
          slug: 'news',
          description: 'News posts',
          count: 5,
        },
      ]

      mockAxiosGet.mockResolvedValueOnce({ data: mockCategories })

      const result = await getCategories()

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('/wp/v2/categories')
      )
      expect(result).toEqual(mockCategories)
    })

    it('handles API errors gracefully', async () => {
      const errorMessage = 'Network error'
      mockAxiosGet.mockRejectedValueOnce(new Error(errorMessage))

      await expect(getCategories()).rejects.toThrow(errorMessage)
    })
  })

  describe('getTags', () => {
    it('fetches tags successfully', async () => {
      const mockTags = [
        {
          id: 1,
          name: 'JavaScript',
          slug: 'javascript',
          description: 'JavaScript related posts',
          count: 8,
        },
        {
          id: 2,
          name: 'React',
          slug: 'react',
          description: 'React posts',
          count: 6,
        },
      ]

      mockAxiosGet.mockResolvedValueOnce({ data: mockTags })

      const result = await getTags()

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('/wp/v2/tags')
      )
      expect(result).toEqual(mockTags)
    })

    it('handles API errors gracefully', async () => {
      const errorMessage = 'Network error'
      mockAxiosGet.mockRejectedValueOnce(new Error(errorMessage))

      await expect(getTags()).rejects.toThrow(errorMessage)
    })
  })

  describe('getMediaById', () => {
    it('fetches media by ID successfully', async () => {
      const mockMedia = {
        id: 1,
        source_url: 'https://example.com/image.jpg',
        alt_text: 'Test image',
        media_details: {
          width: 800,
          height: 600,
          sizes: {
            thumbnail: {
              source_url: 'https://example.com/image-150x150.jpg',
              width: 150,
              height: 150,
            },
          },
        },
      }

      mockAxiosGet.mockResolvedValueOnce({ data: mockMedia })

      const result = await getMediaById(1)

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('/wp/v2/media/1')
      )
      expect(result).toEqual(mockMedia)
    })

    it('handles API errors gracefully', async () => {
      const errorMessage = 'Network error'
      mockAxiosGet.mockRejectedValueOnce(new Error(errorMessage))

      await expect(getMediaById(1)).rejects.toThrow(errorMessage)
    })

    it('handles invalid media ID', async () => {
      const errorMessage = 'Media not found'
      mockAxiosGet.mockRejectedValueOnce(new Error(errorMessage))

      await expect(getMediaById(999)).rejects.toThrow(errorMessage)
    })
  })

  describe('API configuration', () => {
    it('uses correct base URL for development', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_WORDPRESS_URL = ''

      mockAxiosGet.mockResolvedValueOnce({ data: [] })

      await getPosts()

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:8080/wp/v2/posts'),
        expect.any(Object)
      )

      process.env.NODE_ENV = originalEnv
    })

    it('uses correct base URL for production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_WORDPRESS_URL = ''

      mockAxiosGet.mockResolvedValueOnce({ data: [] })

      await getPosts()

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('https://mitrabantennews.com/wp/v2/posts'),
        expect.any(Object)
      )

      process.env.NODE_ENV = originalEnv
    })

    it('respects custom WordPress URL from environment', async () => {
      process.env.NEXT_PUBLIC_WORDPRESS_URL = 'https://custom-wordpress.com'

      mockAxiosGet.mockResolvedValueOnce({ data: [] })

      await getPosts()

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('https://custom-wordpress.com/wp/v2/posts'),
        expect.any(Object)
      )

      delete process.env.NEXT_PUBLIC_WORDPRESS_URL
    })
  })

  describe('Error handling and edge cases', () => {
    it('handles malformed API responses', async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: null })

      const result = await getPosts()
      expect(result).toBeNull()
    })

    it('handles empty response arrays', async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: [] })

      const result = await getPosts()
      expect(result).toEqual([])
    })

    it('handles timeout errors', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded')
      mockAxiosGet.mockRejectedValueOnce(timeoutError)

      await expect(getPosts()).rejects.toThrow('timeout of 5000ms exceeded')
    })

    it('handles rate limiting errors', async () => {
      const rateLimitError = new Error('Request failed with status code 429')
      mockAxiosGet.mockRejectedValueOnce(rateLimitError)

      await expect(getPosts()).rejects.toThrow('Request failed with status code 429')
    })
  })
})