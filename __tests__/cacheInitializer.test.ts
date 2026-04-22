import { CacheInitializer } from '../src/lib/services/cacheInitializer'
import { cacheWarmer } from '../src/lib/services/cacheWarmer'

jest.mock('../src/lib/services/cacheWarmer', () => ({
  cacheWarmer: {
    warmAll: jest.fn(),
  },
}))

jest.mock('../src/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('CacheInitializer', () => {
  let cacheInitializer: CacheInitializer

  beforeEach(() => {
    jest.clearAllMocks()
    cacheInitializer = new CacheInitializer()
  })

  describe('initialize', () => {
    it('should initialize cache successfully', async () => {
      ;(cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        success: 5,
        failed: 0,
        total: 5,
        results: {},
      })

      await cacheInitializer.initialize()

      expect(cacheInitializer.isInitialized()).toBe(true)
    })

    it('should skip initialization if already initialized', async () => {
      ;(cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        success: 5,
        failed: 0,
        total: 5,
        results: {},
      })

      await cacheInitializer.initialize()
      await cacheInitializer.initialize()

      expect(cacheWarmer.warmAll).toHaveBeenCalledTimes(1)
    })

    it('should handle partial failures', async () => {
      ;(cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        success: 4,
        failed: 1,
        total: 5,
        results: { categories: 'failed' },
      })

      await cacheInitializer.initialize()

      expect(cacheInitializer.isInitialized()).toBe(true)
    })

    it('should handle initialization errors', async () => {
      ;(cacheWarmer.warmAll as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(cacheInitializer.initialize()).rejects.toThrow('Network error')
      expect(cacheInitializer.isInitialized()).toBe(false)
    })
  })

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      expect(cacheInitializer.isInitialized()).toBe(false)
    })

    it('should return true after successful initialization', async () => {
      ;(cacheWarmer.warmAll as jest.Mock).mockResolvedValue({
        success: 5,
        failed: 0,
        total: 5,
        results: {},
      })

      await cacheInitializer.initialize()
      expect(cacheInitializer.isInitialized()).toBe(true)
    })

    it('should return false after failed initialization', async () => {
      ;(cacheWarmer.warmAll as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(cacheInitializer.initialize()).rejects.toThrow()
      expect(cacheInitializer.isInitialized()).toBe(false)
    })
  })
})