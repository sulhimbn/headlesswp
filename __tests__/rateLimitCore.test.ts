import { ApiErrorType } from '@/lib/api/errors'
import { cleanupRequests, calculateWaitTime, createRateLimitError, refillTokens } from '@/lib/api/rateLimitCore'

describe('rateLimitCore utilities', () => {
  describe('cleanupRequests', () => {
    it('should filter out old requests', () => {
      const now = Date.now()
      const requestTimes = [now - 500, now - 1500, now - 2000]
      const result = cleanupRequests(requestTimes, 1000)
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(now - 500)
    })

    it('should keep all requests within window', () => {
      const now = Date.now()
      const requestTimes = [now - 100, now - 500, now - 900]
      const result = cleanupRequests(requestTimes, 1000)
      expect(result).toHaveLength(3)
    })

    it('should return empty array when no valid requests', () => {
      const now = Date.now()
      const requestTimes = [now - 2000, now - 3000]
      const result = cleanupRequests(requestTimes, 1000)
      expect(result).toHaveLength(0)
    })
  })

  describe('calculateWaitTime', () => {
    it('should calculate correct wait time', () => {
      const oldestRequest = 1000
      const now = 1500
      const windowMs = 1000
      const waitTime = calculateWaitTime(oldestRequest, now, windowMs)
      expect(waitTime).toBe(500)
    })

    it('should return negative when no wait needed', () => {
      const oldestRequest = 1000
      const now = 2800
      const windowMs = 1000
      const waitTime = calculateWaitTime(oldestRequest, now, windowMs)
      expect(waitTime).toBeLessThanOrEqual(0)
    })
  })

  describe('refillTokens', () => {
    it('should return new reset time when window expired', () => {
      const lastReset = Date.now() - 2000
      const windowMs = 1000
      const result = refillTokens(lastReset, windowMs)
      expect(result).toBeGreaterThan(lastReset)
    })

    it('should return old reset time when window not expired', () => {
      const lastReset = Date.now() - 500
      const windowMs = 1000
      const result = refillTokens(lastReset, windowMs)
      expect(result).toBe(lastReset)
    })
  })

  describe('createRateLimitError', () => {
    it('should create error with correct message', () => {
      const waitTime = 5000
      const error = createRateLimitError(waitTime) as any
      expect(error.message).toContain('Rate limit exceeded')
      expect(error.message).toContain('5 seconds')
    })

    it('should create error with correct type', () => {
      const error = createRateLimitError(1000) as any
      expect(error.type).toBe(ApiErrorType.RATE_LIMIT_ERROR)
      expect(error.statusCode).toBe(429)
      expect(error.retryable).toBe(true)
    })
  })
})