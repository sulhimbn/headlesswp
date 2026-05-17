import { cacheInitializer } from '@/lib/services/cacheInitializer'
import { cacheWarmer } from '@/lib/services/cacheWarmer'
import { logger } from '@/lib/utils/logger'

jest.mock('@/lib/services/cacheWarmer')
jest.mock('@/lib/utils/logger')

describe('cacheInitializer', () => {
  let mockedCacheWarmer: jest.Mocked<typeof cacheWarmer>
  let mockedLogger: jest.Mocked<typeof logger>

  beforeEach(() => {
    jest.clearAllMocks()
    mockedCacheWarmer = cacheWarmer as jest.Mocked<typeof cacheWarmer>
    mockedLogger = logger as jest.Mocked<typeof logger>
    
    ;(cacheInitializer as any).initialized = false
    ;(cacheInitializer as any).initPromise = null
  })

  describe('initialize()', () => {
    it('should successfully initialize cache warming', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: []
      })

      await cacheInitializer.initialize()

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Initializing cache warming...',
        { module: 'CacheInitializer' }
      )
      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cache initialization completed: 3/3'),
        expect.any(Object)
      )
    })

    it('should skip initialization when already initialized', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: []
      })

      await cacheInitializer.initialize()
      await cacheInitializer.initialize()

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)
    })

    it('should deduplicate concurrent calls to initialize()', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: []
      })

      const promise1 = cacheInitializer.initialize()
      const promise2 = cacheInitializer.initialize()

      await Promise.all([promise1, promise2])

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('doInitialize() - partial failures', () => {
    it('should log warning when cache initialization has partial failures', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 2,
        failed: 1,
        results: [
          { name: 'posts', status: 'success', latency: 100 },
          { name: 'categories', status: 'failed', error: 'Network error' },
          { name: 'tags', status: 'success', latency: 50 }
        ]
      })

      await cacheInitializer.initialize()

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cache initialization completed with failures: 1/3'),
        expect.objectContaining({
          module: 'CacheInitializer',
          results: expect.any(Array)
        })
      )
      expect(cacheInitializer.isInitialized()).toBe(true)
    })
  })

  describe('doInitialize() - complete failure', () => {
    it('should handle complete failure and not mark as initialized', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('Cache initialization failed'))

      await expect(cacheInitializer.initialize()).rejects.toThrow('Cache initialization failed')

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        expect.any(Error),
        { module: 'CacheInitializer' }
      )
      expect(cacheInitializer.isInitialized()).toBe(false)
    })

    it('should reset initPromise after complete failure', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('Cache initialization failed'))

      try {
        await cacheInitializer.initialize()
      } catch (e) {}

      expect((cacheInitializer as any).initPromise).toBeNull()
    })

    it('should allow retry after complete failure', async () => {
      let callCount = 0
      mockedCacheWarmer.warmAll.mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          throw new Error('Cache initialization failed')
        }
        return { total: 3, success: 3, failed: 0, results: [] }
      })

      try {
        await cacheInitializer.initialize()
      } catch (e) {}

      await cacheInitializer.initialize()

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(2)
    })
  })

  describe('isInitialized()', () => {
    it('should return false before initialization', () => {
      expect(cacheInitializer.isInitialized()).toBe(false)
    })

    it('should return true after successful initialization', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: []
      })

      await cacheInitializer.initialize()

      expect(cacheInitializer.isInitialized()).toBe(true)
    })

    it('should return false after failed initialization', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('Failed'))

      try {
        await cacheInitializer.initialize()
      } catch (e) {}

      expect(cacheInitializer.isInitialized()).toBe(false)
    })
  })
})
