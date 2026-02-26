import { RetryStrategy } from '@/lib/api/retryStrategy'

describe('RetryStrategy', () => {
  describe('constructor', () => {
    it('should use default values when no options provided', () => {
      const strategy = new RetryStrategy()
      expect(strategy).toBeDefined()
    })

    it('should accept custom options', () => {
      const strategy = new RetryStrategy({
        maxRetries: 5,
        initialDelay: 100,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: false
      })
      expect(strategy).toBeDefined()
    })
  })

  describe('shouldRetry', () => {
    it('should return false when retry count exceeds maxRetries', () => {
      const strategy = new RetryStrategy({ maxRetries: 3 })
      expect(strategy.shouldRetry(new Error('test'), 3)).toBe(false)
    })

    it('should return true for 429 status code', () => {
      const strategy = new RetryStrategy({ maxRetries: 3 })
      const error = { response: { status: 429 } }
      expect(strategy.shouldRetry(error, 0)).toBe(true)
    })

    it('should return true for 5xx status codes', () => {
      const strategy = new RetryStrategy({ maxRetries: 3 })
      expect(strategy.shouldRetry({ response: { status: 500 } }, 0)).toBe(true)
      expect(strategy.shouldRetry({ response: { status: 502 } }, 0)).toBe(true)
      expect(strategy.shouldRetry({ response: { status: 503 } }, 0)).toBe(true)
      expect(strategy.shouldRetry({ response: { status: 599 } }, 0)).toBe(true)
    })

    it('should return false for 4xx status codes (except 429)', () => {
      const strategy = new RetryStrategy({ maxRetries: 3 })
      expect(strategy.shouldRetry({ response: { status: 400 } }, 0)).toBe(false)
      expect(strategy.shouldRetry({ response: { status: 401 } }, 0)).toBe(false)
      expect(strategy.shouldRetry({ response: { status: 404 } }, 0)).toBe(false)
    })

    it('should return true for timeout errors on first retry', () => {
      const strategy = new RetryStrategy({ maxRetries: 3 })
      const error = new Error('timeout of 30000ms exceeded')
      expect(strategy.shouldRetry(error, 0)).toBe(true)
    })

    it('should return false for timeout errors after first retry', () => {
      const strategy = new RetryStrategy({ maxRetries: 3 })
      const error = new Error('timeout of 30000ms exceeded')
      expect(strategy.shouldRetry(error, 1)).toBe(false)
    })

    it('should return true for network errors on first retry', () => {
      const strategy = new RetryStrategy({ maxRetries: 3 })
      const error = new Error('connect ECONNREFUSED')
      expect(strategy.shouldRetry(error, 0)).toBe(true)
    })

    it('should return false for network errors after first retry', () => {
      const strategy = new RetryStrategy({ maxRetries: 3 })
      const error = new Error('connect ECONNREFUSED')
      expect(strategy.shouldRetry(error, 1)).toBe(false)
    })

    it('should return false for non-retryable errors', () => {
      const strategy = new RetryStrategy({ maxRetries: 3 })
      const error = new Error('some other error')
      expect(strategy.shouldRetry(error, 0)).toBe(false)
    })
  })

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff delay', () => {
      const strategy = new RetryStrategy({
        initialDelay: 100,
        backoffMultiplier: 2,
        maxDelay: 10000,
        jitter: false
      })
      const delay = strategy.getRetryDelay(0)
      expect(delay).toBe(100)
    })

    it('should respect maxDelay', () => {
      const strategy = new RetryStrategy({
        initialDelay: 1000,
        backoffMultiplier: 10,
        maxDelay: 5000,
        jitter: false
      })
      const delay = strategy.getRetryDelay(2)
      expect(delay).toBe(5000)
    })

    it('should add jitter when enabled', () => {
      const strategy = new RetryStrategy({
        initialDelay: 100,
        backoffMultiplier: 1,
        maxDelay: 10000,
        jitter: true
      })
      const delay = strategy.getRetryDelay(0)
      expect(delay).toBeGreaterThanOrEqual(50)
      expect(delay).toBeLessThanOrEqual(150)
    })

    it('should respect Retry-After header in seconds', () => {
      const strategy = new RetryStrategy({ maxDelay: 10000 })
      const error = {
        response: {
          status: 429,
          headers: {
            get: (key: string) => (key === 'retry-after' ? '5' : null)
          }
        }
      }
      const delay = strategy.getRetryDelay(0, error)
      expect(delay).toBe(5000)
    })

    it('should respect Retry-After header as HTTP date', () => {
      const strategy = new RetryStrategy({ maxDelay: 100000 })
      const futureDate = new Date(Date.now() + 10000).toUTCString()
      const error = {
        response: {
          status: 429,
          headers: {
            get: (key: string) => (key === 'retry-after' ? futureDate : null)
          }
        }
      }
      const delay = strategy.getRetryDelay(0, error)
      expect(delay).toBeGreaterThan(0)
      expect(delay).toBeLessThanOrEqual(100000)
    })
  })

  describe('execute', () => {
    it('should return result on successful execution', async () => {
      const strategy = new RetryStrategy()
      const result = await strategy.execute(() => Promise.resolve('success'))
      expect(result).toBe('success')
    })

    it('should throw error when all retries exhausted', async () => {
      const strategy = new RetryStrategy({ maxRetries: 2, initialDelay: 10 })
      const error = new Error('failed')
      
      await expect(
        strategy.execute(() => Promise.reject(error), 'test')
      ).rejects.toThrow('failed')
    })

    it('should retry on failure and succeed', async () => {
      const strategy = new RetryStrategy({ maxRetries: 2, initialDelay: 10 })
      let attempts = 0
      
      const result = await strategy.execute(() => {
        attempts++
        if (attempts < 2) {
          return Promise.reject({ response: { status: 500 } })
        }
        return Promise.resolve('success')
      })
      
      expect(result).toBe('success')
      expect(attempts).toBe(2)
    })

    it('should use context in log messages', async () => {
      const strategy = new RetryStrategy({ maxRetries: 1, initialDelay: 10 })
      
      await expect(
        strategy.execute(() => Promise.reject(new Error('fail')), 'TestOperation')
      ).rejects.toThrow()
    })
  })
})
