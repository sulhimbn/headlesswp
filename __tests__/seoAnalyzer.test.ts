import { analyzeSEO, getSEOConfig, isSEOAnalysisEnabled, clearSEOCache } from '@/lib/services/seoAnalyzer'
import { cacheManager } from '@/lib/cache'

jest.mock('@/lib/cache', () => ({
  cacheManager: {
    get: jest.fn(),
    set: jest.fn(),
    invalidate: jest.fn(),
  },
}))

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

describe('seoAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.SEO_PROVIDER = 'local'
  })

  describe('analyzeSEO', () => {
    it('should return SEO analysis with suggestions for short content', async () => {
      const result = await analyzeSEO(1, '<p>Short content</p>', 'Test Title')
      
      expect(result.score).toBeDefined()
      expect(result.suggestions).toBeInstanceOf(Array)
      expect(result.wordCount).toBeGreaterThan(0)
      expect(result.readabilityScore).toBeDefined()
      expect(result.analyzedAt).toBeDefined()
    })

    it('should return suggestions for content length', async () => {
      const shortContent = '<p>This is a short article with less than 300 words.</p>'
      const result = await analyzeSEO(1, shortContent, 'Test Title')
      
      const lengthSuggestion = result.suggestions.find(
        s => s.category === 'Content Length'
      )
      expect(lengthSuggestion).toBeDefined()
    })

    it('should analyze title length', async () => {
      const result = await analyzeSEO(1, '<p>Content here</p>', 'Short')
      
      const titleSuggestion = result.suggestions.find(
        s => s.category === 'Title'
      )
      expect(titleSuggestion).toBeDefined()
    })

    it('should use cached result if available', async () => {
      const cachedResult = {
        score: 85,
        suggestions: [],
        analyzedAt: new Date().toISOString(),
        wordCount: 100,
        readabilityScore: 80
      }
      ;(cacheManager.get as jest.Mock).mockReturnValue(cachedResult)

      const result = await analyzeSEO(1, '<p>Content</p>', 'Title')
      
      expect(result).toEqual(cachedResult)
      expect(cacheManager.get).toHaveBeenCalledWith('seo:1')
    })

    it('should cache new analysis results', async () => {
      ;(cacheManager.get as jest.Mock).mockReturnValue(null)
      ;(cacheManager.set as jest.Mock).mockImplementation()

      await analyzeSEO(1, '<p>Some content here with more than fifty characters to pass the minimum threshold for local analysis</p>', 'Test Title')
      
      expect(cacheManager.set).toHaveBeenCalled()
    })
  })

  describe('getSEOConfig', () => {
    it('should return default local config', () => {
      const config = getSEOConfig()
      
      expect(config.provider).toBe('local')
    })

    it('should read from environment variables', () => {
      process.env.SEO_PROVIDER = 'openai'
      process.env.SEO_API_KEY = 'test-key'
      process.env.SEO_MODEL = 'gpt-4'
      
      const config = getSEOConfig()
      
      expect(config.provider).toBe('openai')
      expect(config.apiKey).toBe('test-key')
      expect(config.model).toBe('gpt-4')
    })
  })

  describe('isSEOAnalysisEnabled', () => {
    it('should return true for local provider', () => {
      process.env.SEO_PROVIDER = 'local'
      expect(isSEOAnalysisEnabled()).toBe(true)
    })

    it('should return false for AI provider without API key', () => {
      process.env.SEO_PROVIDER = 'openai'
      delete process.env.SEO_API_KEY
      expect(isSEOAnalysisEnabled()).toBe(false)
    })

    it('should return true for AI provider with API key', () => {
      process.env.SEO_PROVIDER = 'openai'
      process.env.SEO_API_KEY = 'test-key'
      expect(isSEOAnalysisEnabled()).toBe(true)
    })
  })

  describe('clearSEOCache', () => {
    it('should clear cache for specific post', () => {
      clearSEOCache(1)
      
      expect(cacheManager.invalidate).toHaveBeenCalledWith('seo:1')
    })

    it('should clear all SEO cache when no postId provided', () => {
      const mockCache = new Map()
      mockCache.keys = jest.fn().mockReturnValue(['seo:1', 'seo:2', 'other:3'][Symbol.iterator]())
      ;(cacheManager as any).cache = mockCache
      
      clearSEOCache()
      
      expect(cacheManager.invalidate).toHaveBeenCalledWith('seo:1')
      expect(cacheManager.invalidate).toHaveBeenCalledWith('seo:2')
    })
  })
})
