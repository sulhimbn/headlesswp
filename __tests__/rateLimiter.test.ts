import { RateLimiter, RateLimiterManager } from '../src/lib/api/rateLimiter'
import { ApiErrorType } from '../src/lib/api/errors'

describe('RateLimiter', () => {
  describe('checkLimit', () => {
    it('should allow requests within the limit', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      })

      for (let i = 0; i < 5; i++) {
        await expect(limiter.checkLimit()).resolves.not.toThrow()
      }
    })

    it('should throw rate limit error when exceeding the limit', async () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 1000,
      })

      await limiter.checkLimit()
      await limiter.checkLimit()
      await limiter.checkLimit()

      await expect(limiter.checkLimit()).rejects.toThrow('Rate limit exceeded')
    })

    it('should reset limit after window expires', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 100,
      })

      await limiter.checkLimit()
      await limiter.checkLimit()

      await expect(limiter.checkLimit()).rejects.toThrow('Rate limit exceeded')

      await new Promise(resolve => setTimeout(resolve, 150))

      await expect(limiter.checkLimit()).resolves.not.toThrow()
    })

    it('should allow requests after old ones expire from window', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 100,
      })

      await limiter.checkLimit()
      await new Promise(resolve => setTimeout(resolve, 110))
      await limiter.checkLimit()
      await expect(limiter.checkLimit()).resolves.not.toThrow()
    })

    it('should provide remaining requests count', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      })

      const info1 = limiter.getInfo()
      expect(info1.remainingRequests).toBe(5)

      await limiter.checkLimit()
      await limiter.checkLimit()

      const info2 = limiter.getInfo()
      expect(info2.remainingRequests).toBe(3)
    })
  })

  describe('getInfo', () => {
    it('should return correct rate limit information', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
      })

      const info = limiter.getInfo()

      expect(info.maxRequests).toBe(10)
      expect(info.windowMs).toBe(60000)
      expect(info.remainingRequests).toBeGreaterThanOrEqual(0)
      expect(info.remainingRequests).toBeLessThanOrEqual(10)
      expect(typeof info.resetTime).toBe('number')
    })

    it('should update remaining requests after usage', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      })

      await limiter.checkLimit()
      await limiter.checkLimit()

      const info = limiter.getInfo()
      expect(info.remainingRequests).toBe(3)
    })
  })

  describe('reset', () => {
    it('should reset rate limiter to initial state', async () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 1000,
      })

      await limiter.checkLimit()
      await limiter.checkLimit()
      await limiter.checkLimit()

      await expect(limiter.checkLimit()).rejects.toThrow()

      limiter.reset()

      const info = limiter.getInfo()
      expect(info.remainingRequests).toBe(3)

      await expect(limiter.checkLimit()).resolves.not.toThrow()
    })
  })
})

describe('RateLimiterManager', () => {
  describe('checkLimit', () => {
    it('should use default limiter when no key provided', async () => {
      const manager = new RateLimiterManager({
        maxRequests: 5,
        windowMs: 1000,
      })

      for (let i = 0; i < 5; i++) {
        await expect(manager.checkLimit()).resolves.not.toThrow()
      }

      await expect(manager.checkLimit()).rejects.toThrow('Rate limit exceeded')
    })

    it('should create separate limiters for different keys', async () => {
      const manager = new RateLimiterManager({
        maxRequests: 2,
        windowMs: 1000,
      })

      await manager.checkLimit('key1')
      await manager.checkLimit('key1')
      await expect(manager.checkLimit('key1')).rejects.toThrow()

      await expect(manager.checkLimit('key2')).resolves.not.toThrow()
      await expect(manager.checkLimit('key2')).resolves.not.toThrow()
      await expect(manager.checkLimit('key2')).rejects.toThrow()
    })

    it('should track requests independently per key', async () => {
      const manager = new RateLimiterManager({
        maxRequests: 3,
        windowMs: 1000,
      })

      await manager.checkLimit('user1')
      await manager.checkLimit('user2')
      await manager.checkLimit('user1')

      await manager.checkLimit('user2')
      await manager.checkLimit('user1')

      await expect(manager.checkLimit('user1')).rejects.toThrow()
      await expect(manager.checkLimit('user2')).resolves.not.toThrow()
    })
  })

  describe('getInfo', () => {
    it('should return info for default limiter', () => {
      const manager = new RateLimiterManager({
        maxRequests: 10,
        windowMs: 60000,
      })

      const info = manager.getInfo()
      expect(info.maxRequests).toBe(10)
      expect(info.remainingRequests).toBe(10)
    })

    it('should return info for specific key', () => {
      const manager = new RateLimiterManager({
        maxRequests: 5,
        windowMs: 1000,
      })

      const info = manager.getInfo('test-key')
      expect(info.maxRequests).toBe(5)
    })

    it('should track remaining requests per key', async () => {
      const manager = new RateLimiterManager({
        maxRequests: 3,
        windowMs: 1000,
      })

      await manager.checkLimit('key1')
      await manager.checkLimit('key1')

      const info = manager.getInfo('key1')
      expect(info.remainingRequests).toBe(1)

      const infoDefault = manager.getInfo()
      expect(infoDefault.remainingRequests).toBe(3)
    })
  })

  describe('reset', () => {
    it('should reset specific key limiter', async () => {
      const manager = new RateLimiterManager({
        maxRequests: 2,
        windowMs: 1000,
      })

      await manager.checkLimit('key1')
      await manager.checkLimit('key1')

      await expect(manager.checkLimit('key1')).rejects.toThrow()

      manager.reset('key1')

      await expect(manager.checkLimit('key1')).resolves.not.toThrow()
    })

    it('should reset all limiters', async () => {
      const manager = new RateLimiterManager({
        maxRequests: 2,
        windowMs: 1000,
      })

      await manager.checkLimit('key1')
      await manager.checkLimit('key1')
      await manager.checkLimit('key2')
      await manager.checkLimit('key2')

      await expect(manager.checkLimit('key1')).rejects.toThrow()
      await expect(manager.checkLimit('key2')).rejects.toThrow()

      manager.resetAll()

      await expect(manager.checkLimit('key1')).resolves.not.toThrow()
      await expect(manager.checkLimit('key2')).resolves.not.toThrow()
    })
  })
})

describe('Rate Limiting Error Handling', () => {
  it('should throw ApiError with RATE_LIMIT_ERROR type', async () => {
    const limiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 1000,
    })

    await limiter.checkLimit()

    try {
      await limiter.checkLimit()
      fail('Should have thrown an error')
    } catch (error) {
      expect(error).toBeDefined()
      expect((error as any).type).toBe(ApiErrorType.RATE_LIMIT_ERROR)
      expect((error as any).retryable).toBe(true)
    }
  })

  it('should provide helpful error message', async () => {
    const limiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 1000,
    })

    await limiter.checkLimit()

    try {
      await limiter.checkLimit()
      fail('Should have thrown an error')
    } catch (error) {
      expect((error as Error).message).toContain('Rate limit exceeded')
    }
  })
})

describe('Rate Limiting Configuration', () => {
  it('should use custom maxRequests and windowMs', async () => {
    const limiter = new RateLimiter({
      maxRequests: 10,
      windowMs: 500,
    })

    const info = limiter.getInfo()
    expect(info.maxRequests).toBe(10)
    expect(info.windowMs).toBe(500)

    for (let i = 0; i < 10; i++) {
      await expect(limiter.checkLimit()).resolves.not.toThrow()
    }

    await expect(limiter.checkLimit()).rejects.toThrow()
  })

  it('should work with very short windows', async () => {
    const limiter = new RateLimiter({
      maxRequests: 2,
      windowMs: 50,
    })

    await limiter.checkLimit()
    await limiter.checkLimit()
    await expect(limiter.checkLimit()).rejects.toThrow()

    await new Promise(resolve => setTimeout(resolve, 60))

    await expect(limiter.checkLimit()).resolves.not.toThrow()
  })

  it('should handle burst traffic', async () => {
    const limiter = new RateLimiter({
      maxRequests: 100,
      windowMs: 1000,
    })

    const promises = []
    for (let i = 0; i < 100; i++) {
      promises.push(limiter.checkLimit())
    }

    await Promise.all(promises)

    await expect(limiter.checkLimit()).rejects.toThrow()
  })
})
