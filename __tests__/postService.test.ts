import { postService } from '@/lib/services/postService'
import { wordpressAPI } from '@/lib/wordpress'
import { WordPressPost } from '@/types/wordpress'

jest.mock('@/lib/wordpress', () => ({
  wordpressAPI: {
    getPosts: jest.fn(),
    getPost: jest.fn()
  }
}))

const mockGetPosts = wordpressAPI.getPosts as jest.MockedFunction<typeof wordpressAPI.getPosts>
const mockGetPost = wordpressAPI.getPost as jest.MockedFunction<typeof wordpressAPI.getPost>

describe('postService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getLatestPosts', () => {
    it('returns posts from WordPress API on success', async () => {
      const mockPosts: WordPressPost[] = [
        {
          id: 1,
          title: { rendered: 'Post 1' },
          content: { rendered: 'Content 1' },
          excerpt: { rendered: 'Excerpt 1' },
          slug: 'post-1',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          author: 1,
          featured_media: 0,
          categories: [],
          tags: [],
          status: 'publish',
          type: 'post',
          link: ''
        }
      ]

      mockGetPosts.mockResolvedValue(mockPosts)

      const result = await postService.getLatestPosts()

      expect(result).toEqual(mockPosts)
      expect(mockGetPosts).toHaveBeenCalledWith({ per_page: 6 })
      expect(mockGetPosts).toHaveBeenCalledTimes(1)
    })

    it('returns fallback posts when API fails', async () => {
      mockGetPosts.mockRejectedValue(new Error('API Error'))

      const result = await postService.getLatestPosts()

      expect(result).toHaveLength(3)
      expect(result[0].title.rendered).toBe('Berita Utama 1')
      expect(result[1].title.rendered).toBe('Berita Utama 2')
      expect(result[2].title.rendered).toBe('Berita Utama 3')
      expect(result.every(post => post.slug.startsWith('fallback-'))).toBe(true)
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to fetch latest posts during build:',
        expect.any(Error)
      )
    })

    it('ensures unique IDs for fallback posts', async () => {
      mockGetPosts.mockRejectedValue(new Error('API Error'))

      const result = await postService.getLatestPosts()

      const ids = result.map(post => post.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('handles empty response from API', async () => {
      mockGetPosts.mockResolvedValue([])

      const result = await postService.getLatestPosts()

      expect(result).toEqual([])
      expect(mockGetPosts).toHaveBeenCalledWith({ per_page: 6 })
    })
  })

  describe('getCategoryPosts', () => {
    it('returns category posts from WordPress API on success', async () => {
      const mockPosts: WordPressPost[] = [
        {
          id: 1,
          title: { rendered: 'Category Post 1' },
          content: { rendered: 'Content 1' },
          excerpt: { rendered: 'Excerpt 1' },
          slug: 'category-post-1',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          author: 1,
          featured_media: 0,
          categories: [],
          tags: [],
          status: 'publish',
          type: 'post',
          link: ''
        }
      ]

      mockGetPosts.mockResolvedValue(mockPosts)

      const result = await postService.getCategoryPosts()

      expect(result).toEqual(mockPosts)
      expect(mockGetPosts).toHaveBeenCalledWith({ per_page: 3 })
      expect(mockGetPosts).toHaveBeenCalledTimes(1)
    })

    it('returns fallback posts when API fails', async () => {
      mockGetPosts.mockRejectedValue(new Error('API Error'))

      const result = await postService.getCategoryPosts()

      expect(result).toHaveLength(3)
      expect(result[0].title.rendered).toBe('Berita Kategori 1')
      expect(result[1].title.rendered).toBe('Berita Kategori 2')
      expect(result[2].title.rendered).toBe('Berita Kategori 3')
      expect(result.every(post => post.slug.startsWith('fallback-cat-'))).toBe(true)
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to fetch category posts during build:',
        expect.any(Error)
      )
    })

    it('handles empty array response from API', async () => {
      mockGetPosts.mockResolvedValue([])

      const result = await postService.getCategoryPosts()

      expect(result).toEqual([])
    })

    it('validates fallback slug pattern', async () => {
      mockGetPosts.mockRejectedValue(new Error('API Error'))

      const result = await postService.getCategoryPosts()

      result.forEach((post, index) => {
        expect(post.slug).toBe(`fallback-cat-${index + 1}`)
      })
    })
  })

  describe('getAllPosts', () => {
    it('returns all posts from WordPress API on success', async () => {
      const mockPosts: WordPressPost[] = [
        {
          id: 1,
          title: { rendered: 'Post 1' },
          content: { rendered: 'Content 1' },
          excerpt: { rendered: 'Excerpt 1' },
          slug: 'post-1',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          author: 1,
          featured_media: 0,
          categories: [],
          tags: [],
          status: 'publish',
          type: 'post',
          link: ''
        }
      ]

      mockGetPosts.mockResolvedValue(mockPosts)

      const result = await postService.getAllPosts()

      expect(result).toEqual(mockPosts)
      expect(mockGetPosts).toHaveBeenCalledWith({ per_page: 50 })
      expect(mockGetPosts).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when API fails', async () => {
      mockGetPosts.mockRejectedValue(new Error('API Error'))

      const result = await postService.getAllPosts()

      expect(result).toEqual([])
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to fetch all posts during build:',
        expect.any(Error)
      )
    })

    it('handles empty response from API', async () => {
      mockGetPosts.mockResolvedValue([])

      const result = await postService.getAllPosts()

      expect(result).toEqual([])
    })

    it('validates pagination limit parameter', async () => {
      const mockPosts: WordPressPost[] = []

      mockGetPosts.mockResolvedValue(mockPosts)

      await postService.getAllPosts()

      expect(mockGetPosts).toHaveBeenCalledWith({ per_page: 50 })
    })
  })

  describe('getPostBySlug', () => {
    const mockPost: WordPressPost = {
      id: 1,
      title: { rendered: 'Test Post' },
      content: { rendered: 'Test content' },
      excerpt: { rendered: 'Test excerpt' },
      slug: 'test-post',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      featured_media: 0,
      categories: [],
      tags: [],
      status: 'publish',
      type: 'post',
      link: ''
    }

    it('returns post by slug from WordPress API on success', async () => {
      mockGetPost.mockResolvedValue(mockPost)

      const result = await postService.getPostBySlug('test-post')

      expect(result).toEqual(mockPost)
      expect(mockGetPost).toHaveBeenCalledWith('test-post')
      expect(mockGetPost).toHaveBeenCalledTimes(1)
    })

    it('returns null when API fails', async () => {
      mockGetPost.mockRejectedValue(new Error('API Error'))

      const result = await postService.getPostBySlug('test-post')

      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching post with slug test-post:',
        expect.any(Error)
      )
    })

    it('returns null when API returns undefined', async () => {
      mockGetPost.mockResolvedValue(undefined as unknown as WordPressPost)

      const result = await postService.getPostBySlug('test-post')

      expect(result).toBeNull()
    })

    it('handles timeout errors gracefully', async () => {
      const timeoutError = new Error('ETIMEDOUT')
      mockGetPost.mockRejectedValue(timeoutError)

      const result = await postService.getPostBySlug('test-post')

      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching post with slug test-post:',
        timeoutError
      )
    })

    it('handles empty string slug', async () => {
      mockGetPost.mockRejectedValue(new Error('Empty slug'))

      const result = await postService.getPostBySlug('')

      expect(result).toBeNull()
      expect(mockGetPost).toHaveBeenCalledWith('')
    })

    it('handles network errors gracefully', async () => {
      const networkError = new Error('ECONNREFUSED')
      mockGetPost.mockRejectedValue(networkError)

      const result = await postService.getPostBySlug('test-post')

      expect(result).toBeNull()
    })
  })

  describe('Error Recovery Patterns', () => {
    it('maintains correct data structure in fallback posts', async () => {
      mockGetPosts.mockRejectedValue(new Error('API Error'))

      const result = await postService.getLatestPosts()

      result.forEach(post => {
        expect(post).toHaveProperty('id')
        expect(post).toHaveProperty('title')
        expect(post).toHaveProperty('content')
        expect(post).toHaveProperty('excerpt')
        expect(post).toHaveProperty('slug')
        expect(post).toHaveProperty('date')
        expect(post).toHaveProperty('modified')
        expect(post).toHaveProperty('author')
        expect(post).toHaveProperty('featured_media')
        expect(post).toHaveProperty('categories')
        expect(post).toHaveProperty('tags')
        expect(post).toHaveProperty('status')
        expect(post).toHaveProperty('type')
        expect(post).toHaveProperty('link')
      })
    })

    it('handles concurrent failures across multiple methods', async () => {
      mockGetPosts.mockRejectedValue(new Error('API Error'))
      mockGetPost.mockRejectedValue(new Error('API Error'))

      const [latestPosts, categoryPosts, allPosts, postBySlug] = await Promise.all([
        postService.getLatestPosts(),
        postService.getCategoryPosts(),
        postService.getAllPosts(),
        postService.getPostBySlug('test-slug')
      ])

      expect(latestPosts).toHaveLength(3)
      expect(categoryPosts).toHaveLength(3)
      expect(allPosts).toEqual([])
      expect(postBySlug).toBeNull()
    })

    it('provides Indonesian error messages in fallback content', async () => {
      mockGetPosts.mockRejectedValue(new Error('API Error'))

      const result = await postService.getLatestPosts()

      result.forEach(post => {
        expect(post.content.rendered).toContain('Maaf, artikel tidak dapat dimuat')
        expect(post.excerpt.rendered).toContain('Maaf, artikel tidak dapat dimuat')
      })
    })

    it('ensures fallback posts have publish status', async () => {
      mockGetPosts.mockRejectedValue(new Error('API Error'))

      const result = await postService.getLatestPosts()

      result.forEach(post => {
        expect(post.status).toBe('publish')
        expect(post.type).toBe('post')
      })
    })

    it('handles undefined error parameter', async () => {
      mockGetPosts.mockRejectedValue(undefined)

      const result = await postService.getLatestPosts()

      expect(result).toHaveLength(3)
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to fetch latest posts during build:',
        undefined
      )
    })
  })
})
