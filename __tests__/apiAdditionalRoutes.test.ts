import { cacheManager } from '@/lib/cache'

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({ data: [] })
  },
  getApiUrl: jest.fn(() => 'https://test.com/wp-json')
}))

jest.mock('@/lib/wordpress', () => ({
  wordpressAPI: {
    getCategories: jest.fn().mockResolvedValue([])
  }
}))

describe('API Route Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    cacheManager.clearAll()
  })

  describe('RSS Route', () => {
    it('should export dynamic configuration', async () => {
      const { GET } = await import('@/app/api/rss/route')
      const { dynamic } = await import('@/app/api/rss/route')
      expect(dynamic).toBe('force-dynamic')
    })

    it('should have GET export', async () => {
      const { GET } = await import('@/app/api/rss/route')
      expect(GET).toBeDefined()
      expect(typeof GET).toBe('function')
    })
  })

  describe('Category RSS Route', () => {
    it('should have GET export', async () => {
      const { GET } = await import('@/app/api/rss/category/[slug]/route')
      expect(GET).toBeDefined()
    })
  })

  describe('Media Route', () => {
    it('should have GET export', async () => {
      const { GET } = await import('@/app/api/media/[id]/route')
      expect(GET).toBeDefined()
    })
  })

  describe('Posts Route', () => {
    it('should have GET export', async () => {
      const { GET } = await import('@/app/api/posts/route')
      expect(GET).toBeDefined()
    })
  })

  describe('Performance Route', () => {
    it('should have GET export', async () => {
      const { GET } = await import('@/app/api/observability/performance/route')
      expect(GET).toBeDefined()
    })
  })

  describe('Summary Route', () => {
    it('should have GET export', async () => {
      const { GET } = await import('@/app/api/summary/[id]/route')
      expect(GET).toBeDefined()
    })
  })
})