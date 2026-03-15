import { cacheInitializer } from '@/lib/services/cacheInitializer'
import { cacheWarmer } from '@/lib/services/cacheWarmer'
import { logger } from '@/lib/utils/logger'

jest.mock('@/lib/services/cacheWarmer')
jest.mock('@/lib/utils/logger')

describe('CacheInitializer', () => {
  let mockedCacheWarmer: jest.Mocked<typeof cacheWarmer>
  let mockedLogger: jest.Mocked<typeof logger>

  beforeEach(() => {
    jest.clearAllMocks()
    mockedCacheWarmer = cacheWarmer as jest.Mocked<typeof cacheWarmer>
    mockedLogger = logger as jest.Mocked<typeof logger>
    
    cacheInitializer['initialized'] = false
    cacheInitializer['initPromise'] = null
  })

  describe('initialize()', () => {
    it('should initialize cache warming', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 5,
        success: 5,
        failed: 0,
        results: [],
      })

      await cacheInitializer.initialize()

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Initializing cache warming...',
        expect.objectContaining({ module: 'CacheInitializer' })
      )
    })

    it('should log success when all caches warm successfully', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 5,
        success: 5,
        failed: 0,
        results: [],
      })

      await cacheInitializer.initialize()

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Cache initialization completed: 5/5',
        expect.objectContaining({ module: 'CacheInitializer' })
      )
    })

    it('should log warning when some caches fail to warm', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 5,
        success: 3,
        failed: 2,
        results: [
          { name: 'posts', status: 'success' },
          { name: 'categories', status: 'failed' },
          { name: 'tags', status: 'success' },
        ],
      })

      await cacheInitializer.initialize()

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 2/5',
        expect.objectContaining({ module: 'CacheInitializer' })
      )
    })

    it('should set initialized flag after successful initialization', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 5,
        success: 5,
        failed: 0,
        results: [],
      })

      expect(cacheInitializer.isInitialized()).toBe(false)
      await cacheInitializer.initialize()
      expect(cacheInitializer.isInitialized()).toBe(true)
    })

    it('should not reinitialize if already initialized', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 5,
        success: 5,
        failed: 0,
        results: [],
      })

      await cacheInitializer.initialize()
      await cacheInitializer.initialize()

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)
    })

    it('should return promise if initialization is in progress', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 5,
        success: 5,
        failed: 0,
        results: [],
      })

      const promise1 = cacheInitializer.initialize()
      const promise2 = cacheInitializer.initialize()

      await expect(promise1).resolves.toBeUndefined()
      await expect(promise2).resolves.toBeUndefined()
    })

    it('should handle initialization error', async () => {
      const error = new Error('Warming failed')
      mockedCacheWarmer.warmAll.mockRejectedValue(error)

      await expect(cacheInitializer.initialize()).rejects.toThrow('Warming failed')

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        error,
        expect.objectContaining({ module: 'CacheInitializer' })
      )
    })

    it('should reset initialized flag on error', async () => {
      const error = new Error('Warming failed')
      mockedCacheWarmer.warmAll.mockRejectedValue(error)

      await expect(cacheInitializer.initialize()).rejects.toThrow()
      expect(cacheInitializer.isInitialized()).toBe(false)
    })

    it('should allow reinitialization after error', async () => {
      const error = new Error('Warming failed')
      mockedCacheWarmer.warmAll
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          total: 5,
          success: 5,
          failed: 0,
          results: [],
        })

      await expect(cacheInitializer.initialize()).rejects.toThrow()
      
      const result = cacheInitializer.initialize()
      await expect(result).resolves.toBeUndefined()
    })
  })

  describe('isInitialized()', () => {
    it('should return false before initialization', () => {
      expect(cacheInitializer.isInitialized()).toBe(false)
    })

    it('should return true after successful initialization', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 5,
        success: 5,
        failed: 0,
        results: [],
      })

      await cacheInitializer.initialize()
      expect(cacheInitializer.isInitialized()).toBe(true)
    })
  })
})
