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

    Object.defineProperty(cacheInitializer, 'initialized', { value: false, writable: true })
    Object.defineProperty(cacheInitializer, 'initPromise', { value: null, writable: true })
  })

  describe('initialize()', () => {
    it('should successfully initialize cache warming', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [
          { name: 'posts', status: 'success', latency: 100 },
          { name: 'categories', status: 'success', latency: 50 },
          { name: 'tags', status: 'success', latency: 50 },
        ],
      })

      await cacheInitializer.initialize()

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Initializing cache warming...',
        expect.objectContaining({ module: 'CacheInitializer' })
      )
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Cache initialization completed: 3/3',
        expect.objectContaining({ module: 'CacheInitializer' })
      )
    })

    it('should handle partial failures in warming', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 2,
        failed: 1,
        results: [
          { name: 'posts', status: 'success', latency: 100 },
          { name: 'categories', status: 'failed', error: 'Network error' },
          { name: 'tags', status: 'success', latency: 50 },
        ],
      })

      await cacheInitializer.initialize()

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 1/3',
        expect.objectContaining({ module: 'CacheInitializer' })
      )
    })

    it('should handle all failures in warming', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 0,
        failed: 3,
        results: [
          { name: 'posts', status: 'failed', error: 'Error 1' },
          { name: 'categories', status: 'failed', error: 'Error 2' },
          { name: 'tags', status: 'failed', error: 'Error 3' },
        ],
      })

      await cacheInitializer.initialize()

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 3/3',
        expect.objectContaining({ module: 'CacheInitializer' })
      )
    })

    it('should not reinitialize if already initialized', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [
          { name: 'posts', status: 'success', latency: 100 },
          { name: 'categories', status: 'success', latency: 50 },
          { name: 'tags', status: 'success', latency: 50 },
        ],
      })

      await cacheInitializer.initialize()
      const result = await cacheInitializer.initialize()

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)
      expect(result).toBeUndefined()
    })

    it('should return existing promise if initialization in progress', async () => {
      mockedCacheWarmer.warmAll.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          total: 3,
          success: 3,
          failed: 0,
          results: [],
        }), 100))
      )

      const promise1 = cacheInitializer.initialize()
      const promise2 = cacheInitializer.initialize()

      await expect(promise1).resolves.toBeUndefined()
      await expect(promise2).resolves.toBeUndefined()
    })

    it('should handle errors during warming', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('Network failure'))

      await expect(cacheInitializer.initialize()).rejects.toThrow('Network failure')

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        expect.any(Error),
        expect.objectContaining({ module: 'CacheInitializer' })
      )
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
        results: [],
      })

      await cacheInitializer.initialize()

      expect(cacheInitializer.isInitialized()).toBe(true)
    })

    it('should return false after failed initialization', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('Failure'))

      await expect(cacheInitializer.initialize()).rejects.toThrow()

      expect(cacheInitializer.isInitialized()).toBe(false)
    })
  })
})