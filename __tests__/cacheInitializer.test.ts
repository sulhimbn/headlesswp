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
    cacheInitializer['initialized'] = false
    cacheInitializer['initPromise'] = null
  })

  describe('initialize()', () => {
    it('should return early if already initialized', async () => {
      cacheInitializer['initialized'] = true

      const result = await cacheInitializer.initialize()

      expect(result).toBeUndefined()
      expect(mockedCacheWarmer.warmAll).not.toHaveBeenCalled()
    })

    it('should return existing initPromise if initialization is in progress', async () => {
      const pendingPromise = Promise.resolve()
      cacheInitializer['initPromise'] = pendingPromise

      const result = await cacheInitializer.initialize()

      expect(result).toBeUndefined()
      expect(mockedCacheWarmer.warmAll).not.toHaveBeenCalled()
    })

    it('should call doInitialize if not initialized and no initPromise exists', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      })

      await cacheInitializer.initialize()

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)
      expect(cacheInitializer['initialized']).toBe(true)
      expect(cacheInitializer['initPromise']).not.toBeNull()
    })

    it('should wait for ongoing initialization when called concurrently', async () => {
      let resolveWarmAll: (value: { total: number; success: number; failed: number; results: [] }) => void
      mockedCacheWarmer.warmAll.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveWarmAll = resolve
          })
      )

      const initPromise = cacheInitializer.initialize()
      await new Promise(resolve => process.nextTick(resolve))
      const secondCallPromise = cacheInitializer.initialize()

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)

      resolveWarmAll!({ total: 3, success: 3, failed: 0, results: [] })

      await Promise.all([initPromise, secondCallPromise])
    })
  })

  describe('doInitialize()', () => {
    it('should successfully initialize with no failures and log info', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      })

      await cacheInitializer.initialize()

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Initializing cache warming...',
        { module: 'CacheInitializer' }
      )
      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cache initialization completed: 3/3'),
        expect.objectContaining({ module: 'CacheInitializer', results: [] })
      )
      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(cacheInitializer.isInitialized()).toBe(true)
    })

    it('should log warn when some cache warming fails', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 2,
        failed: 1,
        results: [
          { name: 'posts', status: 'success' },
          { name: 'categories', status: 'failed', error: 'Network error' },
          { name: 'tags', status: 'success' },
        ],
      })

      await cacheInitializer.initialize()

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Initializing cache warming...',
        { module: 'CacheInitializer' }
      )
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cache initialization completed with failures: 1/3'),
        expect.objectContaining({
          module: 'CacheInitializer',
          results: expect.any(Array),
        })
      )
      expect(cacheInitializer.isInitialized()).toBe(true)
    })

    it('should log error and reset state when initialization throws', async () => {
      const testError = new Error('Cache warming failed catastrophically')
      mockedCacheWarmer.warmAll.mockRejectedValue(testError)

      await expect(cacheInitializer.initialize()).rejects.toThrow(
        'Cache warming failed catastrophically'
      )

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        testError,
        { module: 'CacheInitializer' }
      )
      expect(cacheInitializer['initialized']).toBe(false)
      expect(cacheInitializer['initPromise']).toBeNull()
    })

    it('should preserve existing initPromise after successful initialization', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      })

      await cacheInitializer.initialize()

      expect(cacheInitializer['initPromise']).not.toBeNull()
    })

    it('should reset initPromise to null after failed initialization', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('Failed'))

      await expect(cacheInitializer.initialize()).rejects.toThrow()

      expect(cacheInitializer['initPromise']).toBeNull()
    })
  })

  describe('isInitialized()', () => {
    it('should return false when not initialized', () => {
      cacheInitializer['initialized'] = false
      expect(cacheInitializer.isInitialized()).toBe(false)
    })

    it('should return true when initialized', () => {
      cacheInitializer['initialized'] = true
      expect(cacheInitializer.isInitialized()).toBe(true)
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete initialization cycle', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [
          { name: 'posts', status: 'success', latency: 50 },
          { name: 'categories', status: 'success', latency: 30 },
          { name: 'tags', status: 'success', latency: 20 },
        ],
      })

      expect(cacheInitializer.isInitialized()).toBe(false)

      await cacheInitializer.initialize()

      expect(cacheInitializer.isInitialized()).toBe(true)
      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)
    })

    it('should handle second initialization call after success', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: [],
      })

      await cacheInitializer.initialize()
      expect(cacheInitializer.isInitialized()).toBe(true)

      const result = await cacheInitializer.initialize()
      expect(result).toBeUndefined()
      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)
    })

    it('should allow re-initialization after failed attempt', async () => {
      mockedCacheWarmer.warmAll
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({
          total: 3,
          success: 3,
          failed: 0,
          results: [],
        })

      await expect(cacheInitializer.initialize()).rejects.toThrow('First attempt failed')
      expect(cacheInitializer.isInitialized()).toBe(false)

      await cacheInitializer.initialize()
      expect(cacheInitializer.isInitialized()).toBe(true)
      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(2)
    })

    it('should handle partial failures with correct logging', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 1,
        failed: 2,
        results: [
          { name: 'posts', status: 'success', latency: 50 },
          { name: 'categories', status: 'failed', error: 'Timeout' },
          { name: 'tags', status: 'failed', error: 'Connection refused' },
        ],
      })

      await cacheInitializer.initialize()

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('2/3'),
        expect.anything()
      )
      expect(cacheInitializer.isInitialized()).toBe(true)
    })
  })

  describe('error handling edge cases', () => {
    it('should handle warmAll throwing non-Error', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue('string error')

      await expect(cacheInitializer.initialize()).rejects.toBe('string error')

      expect(cacheInitializer['initialized']).toBe(false)
      expect(cacheInitializer['initPromise']).toBeNull()
    })

    it('should handle warmAll throwing null/undefined', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(null)

      await expect(cacheInitializer.initialize()).rejects.toBeNull()

      expect(cacheInitializer['initialized']).toBe(false)
    })

    it('should handle warmAll throwing object error', async () => {
      const errorObj = { code: 'ERR_CACHE', message: 'Cache error' }
      mockedCacheWarmer.warmAll.mockRejectedValue(errorObj)

      await expect(cacheInitializer.initialize()).rejects.toEqual(errorObj)

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        errorObj,
        { module: 'CacheInitializer' }
      )
    })
  })
})
