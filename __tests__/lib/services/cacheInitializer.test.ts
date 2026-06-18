import { cacheInitializer, CacheInitializer } from '@/lib/services/cacheInitializer'
import { cacheWarmer } from '@/lib/services/cacheWarmer'
import { logger } from '@/lib/utils/logger'

jest.mock('@/lib/services/cacheWarmer')
jest.mock('@/lib/utils/logger')

describe('CacheInitializer', () => {
  let mockedCacheWarmer: jest.Mocked<typeof cacheWarmer>
  let mockedLogger: jest.Mocked<typeof logger>
  let instance: CacheInitializer

  beforeEach(() => {
    jest.clearAllMocks()
    mockedCacheWarmer = cacheWarmer as jest.Mocked<typeof cacheWarmer>
    mockedLogger = logger as jest.Mocked<typeof logger>
    instance = new CacheInitializer()
  })

  describe('initialize()', () => {
    it('should successfully initialize when warmAll succeeds with no failures', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: []
      })

      await instance.initialize()

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Initializing cache warming...',
        { module: 'CacheInitializer' }
      )
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Cache initialization completed: 3/3',
        expect.objectContaining({ module: 'CacheInitializer' })
      )
      expect(instance.isInitialized()).toBe(true)
    })

    it('should log warning when warmAll has failures', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 2,
        failed: 1,
        results: [{ name: 'posts', status: 'failed', error: 'timeout' }]
      })

      await instance.initialize()

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 1/3',
        expect.objectContaining({ module: 'CacheInitializer' })
      )
      expect(instance.isInitialized()).toBe(true)
    })

    it('should handle error during initialization', async () => {
      const error = new Error('Network failure')
      mockedCacheWarmer.warmAll.mockRejectedValue(error)

      await expect(instance.initialize()).rejects.toThrow('Network failure')

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        error,
        { module: 'CacheInitializer' }
      )
      expect(instance.isInitialized()).toBe(false)
    })

    it('should reset initPromise after error', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('First failure'))

      await expect(instance.initialize()).rejects.toThrow()
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: []
      })

      await instance.initialize()

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(2)
    })

    it('should return early if already initialized', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: []
      })

      await instance.initialize()
      await instance.initialize()
      await instance.initialize()

      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)
    })

    it('should return existing promise for concurrent calls', async () => {
      const slowPromise = new Promise<{ total: number; success: number; failed: number; results: any[] }>((resolve) => {
        setTimeout(() => resolve({ total: 3, success: 3, failed: 0, results: [] }), 100)
      })
      mockedCacheWarmer.warmAll.mockReturnValue(slowPromise)

      const promise1 = instance.initialize()
      const promise2 = instance.initialize()
      const promise3 = instance.initialize()

      expect(promise1).toBe(promise2)
      expect(promise2).toBe(promise3)
      expect(mockedCacheWarmer.warmAll).toHaveBeenCalledTimes(1)

      await promise1
      expect(instance.isInitialized()).toBe(true)
    })

    it('should allow re-initialization after error resets state', async () => {
      mockedCacheWarmer.warmAll
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({ total: 3, success: 3, failed: 0, results: [] })

      await expect(instance.initialize()).rejects.toThrow('First failure')
      expect(instance.isInitialized()).toBe(false)

      await instance.initialize()
      expect(instance.isInitialized()).toBe(true)
    })

    it('should handle empty results array', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 0,
        success: 0,
        failed: 0,
        results: []
      })

      await instance.initialize()

      expect(instance.isInitialized()).toBe(true)
    })
  })

  describe('isInitialized()', () => {
    it('should return false before initialization', () => {
      expect(instance.isInitialized()).toBe(false)
    })

    it('should return true after successful initialization', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: []
      })

      await instance.initialize()

      expect(instance.isInitialized()).toBe(true)
    })

    it('should return false after failed initialization', async () => {
      mockedCacheWarmer.warmAll.mockRejectedValue(new Error('Failed'))

      await expect(instance.initialize()).rejects.toThrow()

      expect(instance.isInitialized()).toBe(false)
    })
  })

  describe('singleton export', () => {
    it('should export cacheInitializer singleton', () => {
      expect(cacheInitializer).toBeDefined()
      expect(typeof cacheInitializer.initialize).toBe('function')
      expect(typeof cacheInitializer.isInitialized).toBe('function')
    })

    it('should return the same instance', () => {
      expect(cacheInitializer).toBe(cacheInitializer)
    })
  })

  describe('error recovery', () => {
    it('should retry initialization after error', async () => {
      let callCount = 0
      mockedCacheWarmer.warmAll.mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          throw new Error('Transient failure')
        }
        return { total: 3, success: 3, failed: 0, results: [] }
      })

      await expect(instance.initialize()).rejects.toThrow('Transient failure')
      await instance.initialize()

      expect(callCount).toBe(2)
      expect(instance.isInitialized()).toBe(true)
    })
  })

  describe('logging behavior', () => {
    it('should log info on successful init', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 3,
        failed: 0,
        results: []
      })

      await instance.initialize()

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Initializing cache warming...',
        { module: 'CacheInitializer' }
      )
    })

    it('should log warn when some operations failed', async () => {
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 3,
        success: 1,
        failed: 2,
        results: [
          { name: 'posts', status: 'failed', error: 'timeout' },
          { name: 'categories', status: 'failed', error: 'network' }
        ]
      })

      await instance.initialize()

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Cache initialization completed with failures: 2/3',
        expect.objectContaining({ module: 'CacheInitializer' })
      )
    })

    it('should log error when initialization throws', async () => {
      const error = new Error('Cache initialization error')
      mockedCacheWarmer.warmAll.mockRejectedValue(error)

      await expect(instance.initialize()).rejects.toThrow()

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Cache initialization failed',
        error,
        { module: 'CacheInitializer' }
      )
    })

    it('should include results in log meta', async () => {
      const results: Array<{ name: string; status: 'success' | 'failed'; latency?: number; error?: string }> = [
        { name: 'posts', status: 'success', latency: 50 },
        { name: 'categories', status: 'success', latency: 30 }
      ]
      mockedCacheWarmer.warmAll.mockResolvedValue({
        total: 2,
        success: 2,
        failed: 0,
        results
      })

      await instance.initialize()

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Cache initialization completed: 2/2',
        expect.objectContaining({ results })
      )
    })
  })
})
