import axios from 'axios'
import { wordpressAPI } from '@/lib/wordpress'
import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress'

// Mock axios to avoid actual network calls
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock the axios.create method to return a proper mock instance
const mockApiInstance = {
  get: jest.fn(),
  interceptors: {
    response: {
      use: jest.fn()
    }
  }
}

mockedAxios.create = jest.fn().mockReturnValue(mockApiInstance)

// Mock environment variables
const originalEnv = process.env

describe('Enhanced WordPress API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('API Configuration', () => {
    it('should use default API URL when environment variable is not set', () => {
      delete process.env.NEXT_PUBLIC_WORDPRESS_API_URL
      delete process.env.NEXT_PUBLIC_WORDPRESS_URL
      
      // Re-import to test with different environment
      jest.resetModules()
      const { wordpressAPI: reImportedAPI } = require('@/lib/wordpress')
      
      expect(reImportedAPI).toBeDefined()
    })

    it('should use custom API URL when environment variable is set', () => {
      process.env.NEXT_PUBLIC_WORDPRESS_API_URL = 'https://custom-wordpress.com/wp-json'
      process.env.NEXT_PUBLIC_WORDPRESS_URL = 'https://custom-wordpress.com'
      
      jest.resetModules()
      const { wordpressAPI: reImportedAPI } = require('@/lib/wordpress')
      
      expect(reImportedAPI).toBeDefined()
    })

    it('should configure axios with correct defaults', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: expect.stringContaining('/wp-json'),
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })
    })

    it('should configure response interceptors for retry logic', () => {
      expect(mockApiInstance.interceptors.response.use).toHaveBeenCalled()
    })
  })

  describe('URL Generation', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_WORDPRESS_URL = 'https://example.com'
      jest.resetModules()
    })

    it('should generate correct API URLs using index.php fallback', () => {
      const { getApiUrl } = require('@/lib/wordpress')
      
      expect(getApiUrl('/wp/v2/posts')).toBe('https://example.com/index.php?rest_route=/wp/v2/posts')
      expect(getApiUrl('/wp/v2/categories')).toBe('https://example.com/index.php?rest_route=/wp/v2/categories')
      expect(getApiUrl('/wp/v2/users/123')).toBe('https://example.com/index.php?rest_route=/wp/v2/users/123')
    })

    it('should use localhost as fallback when no environment variable is set', () => {
      delete process.env.NEXT_PUBLIC_WORDPRESS_URL
      jest.resetModules()
      
      const { getApiUrl } = require('@/lib/wordpress')
      
      expect(getApiUrl('/wp/v2/posts')).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/posts')
    })
  })

  describe('Posts API', () => {
    const mockPosts: WordPressPost[] = [
      {
        id: 1,
        title: { rendered: 'Test Post 1' },
        content: { rendered: '<p>Test content 1</p>' },
        excerpt: { rendered: '<p>Test excerpt 1</p>' },
        slug: 'test-post-1',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        featured_media: 0,
        categories: [1, 2],
        tags: [3, 4],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post-1'
      },
      {
        id: 2,
        title: { rendered: 'Test Post 2' },
        content: { rendered: '<p>Test content 2</p>' },
        excerpt: { rendered: '<p>Test excerpt 2</p>' },
        slug: 'test-post-2',
        date: '2024-01-02T00:00:00',
        modified: '2024-01-02T00:00:00',
        author: 2,
        featured_media: 5,
        categories: [2],
        tags: [4],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post-2'
      }
    ]

    it('should get posts without parameters', async () => {
      const mockResponse = { data: mockPosts }
      mockApiInstance.get.mockResolvedValue(mockResponse)

      const result = await wordpressAPI.getPosts()

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('index.php?rest_route=/wp/v2/posts'),
        { params: undefined }
      )
      expect(result).toEqual(mockPosts)
    })

    it('should get posts with parameters', async () => {
      const mockResponse = { data: [mockPosts[0]] }
      mockApiInstance.get.mockResolvedValue(mockResponse)

      const params = { page: 1, per_page: 5, category: 1 }
      const result = await wordpressAPI.getPosts(params)

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('index.php?rest_route=/wp/v2/posts'),
        { params }
      )
      expect(result).toEqual([mockPosts[0]])
    })

    it('should get post by slug', async () => {
      const mockResponse = { data: [mockPosts[0]] }
      mockApiInstance.get.mockResolvedValue(mockResponse)

      const result = await wordpressAPI.getPost('test-post-1')

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('index.php?rest_route=/wp/v2/posts'),
        { params: { slug: 'test-post-1' } }
      )
      expect(result).toEqual(mockPosts[0])
    })

    it('should get post by ID', async () => {
      const mockResponse = { data: mockPosts[0] }
      mockApiInstance.get.mockResolvedValue(mockResponse)

      const result = await wordpressAPI.getPostById(1)

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('index.php?rest_route=/wp/v2/posts/1')
      )
      expect(result).toEqual(mockPosts[0])
    })

    it('should handle search functionality', async () => {
      const mockResponse = { data: mockPosts }
      mockApiInstance.get.mockResolvedValue(mockResponse)

      const result = await wordpressAPI.search('test query')

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('index.php?rest_route=/wp/v2/search'),
        { params: { search: 'test query' } }
      )
      expect(result).toEqual(mockPosts)
    })
  })

  describe('Categories API', () => {
    const mockCategories: WordPressCategory[] = [
      {
        id: 1,
        name: 'News',
        slug: 'news',
        description: 'News category',
        parent: 0,
        count: 10
      },
      {
        id: 2,
        name: 'Tech',
        slug: 'tech',
        description: 'Technology category',
        parent: 0,
        count: 5
      }
    ]

    it('should get all categories', async () => {
      const mockResponse = { data: mockCategories }
      mockApiInstance.get.mockResolvedValue(mockResponse)

      const result = await wordpressAPI.getCategories()

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('index.php?rest_route=/wp/v2/categories')
      )
      expect(result).toEqual(mockCategories)
    })

    it('should get category by slug', async () => {
      const mockResponse = { data: [mockCategories[0]] }
      mockApiInstance.get.mockResolvedValue(mockResponse)

      const result = await wordpressAPI.getCategory('news')

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('index.php?rest_route=/wp/v2/categories'),
        { params: { slug: 'news' } }
      )
      expect(result).toEqual(mockCategories[0])
    })
  })

  describe('Tags API', () => {
    const mockTags: WordPressTag[] = [
      {
        id: 1,
        name: 'JavaScript',
        slug: 'javascript',
        description: 'JavaScript related posts',
        count: 8
      },
      {
        id: 2,
        name: 'React',
        slug: 'react',
        description: 'React framework posts',
        count: 12
      }
    ]

    it('should get all tags', async () => {
      const mockResponse = { data: mockTags }
      mockApiInstance.get.mockResolvedValue(mockResponse)

      const result = await wordpressAPI.getTags()

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('index.php?rest_route=/wp/v2/tags')
      )
      expect(result).toEqual(mockTags)
    })

    it('should get tag by slug', async () => {
      const mockResponse = { data: [mockTags[0]] }
      mockApiInstance.get.mockResolvedValue(mockResponse)

      const result = await wordpressAPI.getTag('javascript')

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('index.php?rest_route=/wp/v2/tags'),
        { params: { slug: 'javascript' } }
      )
      expect(result).toEqual(mockTags[0])
    })
  })

  describe('Media API', () => {
    const mockMedia: WordPressMedia = {
      id: 1,
      source_url: 'https://example.com/image.jpg',
      title: { rendered: 'Test Image' },
      alt_text: 'Test alt text',
      media_type: 'image',
      mime_type: 'image/jpeg'
    }

    it('should get media by ID', async () => {
      const mockResponse = { data: mockMedia }
      mockApiInstance.get.mockResolvedValue(mockResponse)

      const result = await wordpressAPI.getMedia(1)

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('index.php?rest_route=/wp/v2/media/1')
      )
      expect(result).toEqual(mockMedia)
    })
  })

  describe('Authors API', () => {
    const mockAuthor: WordPressAuthor = {
      id: 1,
      name: 'John Doe',
      slug: 'john-doe',
      description: 'Content writer',
      avatar_urls: {
        '24': 'https://example.com/avatar-24.jpg',
        '48': 'https://example.com/avatar-48.jpg',
        '96': 'https://example.com/avatar-96.jpg'
      }
    }

    it('should get author by ID', async () => {
      const mockResponse = { data: mockAuthor }
      mockApiInstance.get.mockResolvedValue(mockResponse)

      const result = await wordpressAPI.getAuthor(1)

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('index.php?rest_route=/wp/v2/users/1')
      )
      expect(result).toEqual(mockAuthor)
    })
  })

  describe('Error Handling and Retry Logic', () => {
    it('should retry failed requests', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Test Post' } }]
      
      // First call fails, second succeeds
      mockApiInstance.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: mockPosts })

      const result = await wordpressAPI.getPosts()

      expect(mockApiInstance.get).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockPosts)
    })

    it('should retry on 5xx errors', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Test Post' } }]
      
      mockApiInstance.get
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValueOnce({ data: mockPosts })

      const result = await wordpressAPI.getPosts()

      expect(mockApiInstance.get).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockPosts)
    })

    it('should not retry on 4xx errors', async () => {
      const error = { response: { status: 404 } }
      mockApiInstance.get.mockRejectedValue(error)

      await expect(wordpressAPI.getPosts()).rejects.toEqual(error)
      expect(mockApiInstance.get).toHaveBeenCalledTimes(1)
    })

    it('should fail after max retries', async () => {
      const error = new Error('Persistent network error')
      mockApiInstance.get.mockRejectedValue(error)

      await expect(wordpressAPI.getPosts()).rejects.toThrow(error)
      expect(mockApiInstance.get).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
    })

    it('should implement exponential backoff', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Test Post' } }]
      const startTime = Date.now()
      
      mockApiInstance.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: mockPosts })

      await wordpressAPI.getPosts()

      const elapsedTime = Date.now() - startTime
      
      // Should have waited for exponential backoff (2^1 * 1000 + 2^2 * 1000 = 3000ms minimum)
      expect(elapsedTime).toBeGreaterThan(2500) // Allow some tolerance
      expect(mockApiInstance.get).toHaveBeenCalledTimes(3)
    })
  })

  describe('Data Structure Validation', () => {
    it('should handle empty response arrays', async () => {
      mockApiInstance.get.mockResolvedValue({ data: [] })

      const result = await wordpressAPI.getPosts()

      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle malformed post data gracefully', async () => {
      const malformedPost = {
        id: 1,
        title: { rendered: 'Test Post' }
        // Missing other required fields
      }
      
      mockApiInstance.get.mockResolvedValue({ data: [malformedPost] })

      const result = await wordpressAPI.getPosts()

      expect(result).toEqual([malformedPost])
    })

    it('should handle API response with additional fields', async () => {
      const postWithExtraFields = {
        id: 1,
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>Test</p>' },
        excerpt: { rendered: '<p>Test excerpt</p>' },
        slug: 'test-post',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        featured_media: 0,
        categories: [],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post',
        extra_field: 'should not break anything',
        another_extra: { nested: 'data' }
      }
      
      mockApiInstance.get.mockResolvedValue({ data: [postWithExtraFields] })

      const result = await wordpressAPI.getPosts()

      expect(result).toEqual([postWithExtraFields])
    })
  })

  describe('Type Safety', () => {
    it('should maintain correct types for API responses', async () => {
      const mockPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>Test content</p>' },
        excerpt: { rendered: '<p>Test excerpt</p>' },
        slug: 'test-post',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        featured_media: 0,
        categories: [],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post'
      }

      mockApiInstance.get.mockResolvedValue({ data: [mockPost] })

      const result = await wordpressAPI.getPosts()

      // TypeScript should ensure these are the correct types
      expect(Array.isArray(result)).toBe(true)
      expect(result[0].id).toBe(1)
      expect(result[0].title.rendered).toBe('Test Post')
      expect(typeof result[0].content.rendered).toBe('string')
    })
  })
})