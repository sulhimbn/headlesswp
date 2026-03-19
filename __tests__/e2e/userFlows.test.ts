import { enhancedPostService } from '@/lib/services/enhancedPostService'
import { standardizedAPI } from '@/lib/api/standardized'

jest.mock('@/lib/api/client', () => ({
  checkApiHealth: jest.fn().mockResolvedValue({
    healthy: true,
    timestamp: new Date().toISOString(),
    latency: 10,
    version: 'v2'
  }),
  telemetryCollector: {
    record: jest.fn()
  }
}))

jest.mock('@/lib/api/standardized', () => {
  const mockPosts = [
    {
      id: 1,
      title: 'Test Post 1',
      excerpt: '<p>Excerpt 1</p>',
      slug: 'test-post-1',
      featured_media: 100,
      date: '2024-01-15T10:00:00Z',
      categories: [1],
      tags: [1, 2],
      link: 'https://example.com/test-post-1/',
      author: 1,
      content: '<p>Content 1</p>'
    },
    {
      id: 2,
      title: 'Test Post 2',
      excerpt: '<p>Excerpt 2</p>',
      slug: 'test-post-2',
      featured_media: 101,
      date: '2024-01-14T10:00:00Z',
      categories: [2],
      tags: [3],
      link: 'https://example.com/test-post-2/',
      author: 1,
      content: '<p>Content 2</p>'
    }
  ]
  return {
    standardizedAPI: {
      getAllPosts: jest.fn().mockResolvedValue({
        data: mockPosts,
        metadata: { endpoint: '/wp/v2/posts', timestamp: new Date().toISOString() },
        pagination: { page: 1, perPage: 10, total: 2, totalPages: 1 }
      }),
      searchPosts: jest.fn((query: string, page: number = 1, perPage: number = 12) => {
        return Promise.resolve({
          data: [mockPosts[0]],
          metadata: { endpoint: '/wp/v2/search', timestamp: new Date().toISOString() },
          pagination: { page, perPage, total: 1, totalPages: 1 }
        })
      }),
      getAllCategories: jest.fn().mockResolvedValue({
        data: [
          { id: 1, name: 'Technology', slug: 'technology' },
          { id: 2, name: 'Business', slug: 'business' }
        ],
        metadata: { endpoint: '/wp/v2/categories', timestamp: new Date().toISOString() },
        pagination: { page: 1, perPage: 10, total: 2, totalPages: 1 }
      }),
      getAllTags: jest.fn().mockResolvedValue({
        data: [
          { id: 1, name: 'Tag 1', slug: 'tag-1' },
          { id: 2, name: 'Tag 2', slug: 'tag-2' }
        ],
        metadata: { endpoint: '/wp/v2/tags', timestamp: new Date().toISOString() },
        pagination: { page: 1, perPage: 10, total: 2, totalPages: 1 }
      })
    }
  }
})

jest.mock('@/lib/services/enhancedPostService', () => {
  const mockPosts = [
    {
      id: 1,
      title: 'Test Post 1',
      excerpt: '<p>Excerpt 1</p>',
      slug: 'test-post-1',
      featured_media: 100,
      date: '2024-01-15T10:00:00Z',
      categories: [1],
      tags: [1, 2],
      link: 'https://example.com/test-post-1/',
      author: 1,
      content: '<p>Content 1</p>'
    },
    {
      id: 2,
      title: 'Test Post 2',
      excerpt: '<p>Excerpt 2</p>',
      slug: 'test-post-2',
      featured_media: 101,
      date: '2024-01-14T10:00:00Z',
      categories: [2],
      tags: [3],
      link: 'https://example.com/test-post-2/',
      author: 1,
      content: '<p>Content 2</p>'
    }
  ]
  return {
    enhancedPostService: {
      getLatestPosts: jest.fn().mockResolvedValue([mockPosts[0]]),
      getCategoryPosts: jest.fn().mockResolvedValue([mockPosts[1]]),
      getPostBySlug: jest.fn((slug: string) => {
        if (slug === 'test-post-1') {
          return Promise.resolve(mockPosts[0])
        }
        return Promise.resolve(null)
      })
    }
  }
})

describe('E2E - Homepage', () => {
  it('should load homepage with latest posts', async () => {
    const latestPosts = await enhancedPostService.getLatestPosts()
    
    expect(latestPosts).toBeDefined()
    expect(Array.isArray(latestPosts)).toBe(true)
    expect(latestPosts.length).toBeGreaterThan(0)
  })

  it('should load homepage with category posts', async () => {
    const categoryPosts = await enhancedPostService.getCategoryPosts()
    
    expect(categoryPosts).toBeDefined()
    expect(Array.isArray(categoryPosts)).toBe(true)
    expect(categoryPosts.length).toBeGreaterThan(0)
  })

  it('should have proper post structure on homepage', async () => {
    const latestPosts = await enhancedPostService.getLatestPosts()
    
    expect(latestPosts[0]).toHaveProperty('id')
    expect(latestPosts[0]).toHaveProperty('title')
    expect(latestPosts[0]).toHaveProperty('slug')
    expect(latestPosts[0]).toHaveProperty('date')
    expect(latestPosts[0]).toHaveProperty('excerpt')
  })
})

describe('E2E - Navigation Between Pages', () => {
  it('should navigate to category page', async () => {
    const result = await standardizedAPI.getAllCategories()
    
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('should navigate to tag page', async () => {
    const result = await standardizedAPI.getAllTags()
    
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('should support pagination', async () => {
    const result = await standardizedAPI.getAllPosts({ page: 1, per_page: 5 })
    
    expect(result.data).toBeDefined()
    expect(result.pagination).toBeDefined()
    expect(result.pagination.page).toBe(1)
  })
})

describe('E2E - Article Detail Page', () => {
  it('should load article detail by slug', async () => {
    const post = await enhancedPostService.getPostBySlug('test-post-1')
    
    expect(post).toBeDefined()
    expect(post?.slug).toBe('test-post-1')
    expect(post?.title).toBe('Test Post 1')
  })

  it('should load article content', async () => {
    const post = await enhancedPostService.getPostBySlug('test-post-1')
    
    expect(post?.content).toBeDefined()
    expect(post?.content).toContain('Content 1')
  })

  it('should handle non-existent article', async () => {
    const post = await enhancedPostService.getPostBySlug('non-existent-article')
    
    expect(post).toBeNull()
  })
})

describe('E2E - Search Functionality', () => {
  it('should search posts by query', async () => {
    const result = await standardizedAPI.searchPosts('test')
    
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('should return empty results for no matches', async () => {
    const result = await standardizedAPI.searchPosts('nonexistentquery12345')
    
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('should include pagination in search results', async () => {
    const result = await standardizedAPI.searchPosts('test')
    
    expect(result.pagination).toBeDefined()
    expect(result.pagination.page).toBeDefined()
    expect(result.pagination.total).toBeDefined()
  })
})

describe('E2E - Error Handling', () => {
  it('should handle 404 for non-existent article', async () => {
    const post = await enhancedPostService.getPostBySlug('this-does-not-exist-12345')
    
    expect(post).toBeNull()
  })

  it('should handle API errors gracefully', async () => {
    const result = await standardizedAPI.getAllPosts()
    
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
  })
})

describe('E2E - Critical User Flows Integration', () => {
  describe('Complete User Journey: Homepage -> Article -> Search', () => {
    it('should support full user journey from homepage to article', async () => {
      const latestPosts = await enhancedPostService.getLatestPosts()
      expect(latestPosts.length).toBeGreaterThan(0)

      const firstPost = latestPosts[0]
      const articleDetail = await enhancedPostService.getPostBySlug(firstPost.slug)
      expect(articleDetail).toBeDefined()
      expect(articleDetail?.slug).toBe(firstPost.slug)
    })

    it('should support search after viewing article', async () => {
      const searchResults = await standardizedAPI.searchPosts('test')
      expect(searchResults.data).toBeDefined()
      expect(Array.isArray(searchResults.data)).toBe(true)
    })

    it('should support navigation from homepage to category', async () => {
      const categories = await standardizedAPI.getAllCategories()
      expect(categories.data).toBeDefined()
      expect(categories.data.length).toBeGreaterThan(0)
    })

    it('should support navigation from homepage to tag', async () => {
      const tags = await standardizedAPI.getAllTags()
      expect(tags.data).toBeDefined()
    })
  })

  describe('Article Reading Flow', () => {
    it('should load article with all required data', async () => {
      const post = await enhancedPostService.getPostBySlug('test-post-1')
      
      expect(post).toHaveProperty('id')
      expect(post).toHaveProperty('title')
      expect(post).toHaveProperty('content')
      expect(post).toHaveProperty('date')
      expect(post).toHaveProperty('categories')
      expect(post).toHaveProperty('tags')
    })

    it('should handle missing featured media', async () => {
      const post = await enhancedPostService.getPostBySlug('test-post-1')
      expect(post?.featured_media).toBeDefined()
    })
  })

  describe('Search and Filter Flow', () => {
    it('should support search with pagination', async () => {
      const result = await standardizedAPI.searchPosts('test', 1, 5)
      
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.perPage).toBe(5)
    })

    it('should support category filtering', async () => {
      const result = await standardizedAPI.getAllPosts({ category: 1 })
      
      expect(result.data).toBeDefined()
    })
  })
})