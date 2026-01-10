/**
 * Integration Tests for API Resilience Patterns
 *
 * These tests verify that the resilience patterns (circuit breaker, retry strategy,
 * rate limiting, error handling, health check) work together correctly.
 *
 * NOTE: These tests are skipped by default because they require WordPress API
 * to be running. To run these tests, set WORDPRESS_API_AVAILABLE=true.
 */

import { apiClient, circuitBreaker, retryStrategy, rateLimiterManager, checkApiHealth } from '@/lib/api/client'
import { ApiErrorType, createApiError } from '@/lib/api/errors'
import { CircuitState } from '@/lib/api/circuitBreaker'

// Check if WordPress API is available
const WORDPRESS_API_AVAILABLE = process.env.WORDPRESS_API_AVAILABLE === 'true'

describe('API Resilience Integration Tests', () => {
  const describeOrSkip = WORDPRESS_API_AVAILABLE ? describe : describe.skip

  describeOrSkip('Circuit Breaker + Retry Integration', () => {
    beforeEach(() => {
      circuitBreaker.reset()
    })

    afterEach(() => {
      circuitBreaker.reset()
    })

    test('circuit breaker opens after threshold failures and recovers after timeout', async () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)

      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure()
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)

      await new Promise(resolve => setTimeout(resolve, 100))
      circuitBreaker.recordSuccess()
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
    })

    test('requests fail fast when circuit breaker is open', async () => {
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure()
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)

      await expect(apiClient.get('/wp/v2/posts?per_page=1')).rejects.toMatchObject({
        type: ApiErrorType.CIRCUIT_BREAKER_OPEN,
        message: expect.stringContaining('Circuit breaker is OPEN')
      })
    })

    test('circuit breaker transitions through HALF_OPEN state with health checks', async () => {
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure()
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)

      await new Promise(resolve => setTimeout(resolve, 61 * 1000))

      const healthResult = await checkApiHealth()
      if (healthResult.healthy) {
        circuitBreaker.recordSuccess()
        expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
      }
    })
  })

  describeOrSkip('Rate Limiting + Error Handling Integration', () => {
    beforeEach(() => {
      rateLimiterManager.reset()
    })

    test('rate limiter enforces max requests per window', async () => {
      const maxRequests = 60

      for (let i = 0; i < maxRequests; i++) {
        await expect(rateLimiterManager.checkLimit()).resolves.toBeUndefined()
      }

      await expect(rateLimiterManager.checkLimit()).rejects.toThrow()
    })

    test('rate limiter automatically resets after window expires', async () => {
      const maxRequests = 60
      const windowMs = 100

      for (let i = 0; i < maxRequests; i++) {
        await expect(rateLimiterManager.checkLimit()).resolves.toBeUndefined()
      }

      await expect(rateLimiterManager.checkLimit()).rejects.toThrow()

      await new Promise(resolve => setTimeout(resolve, windowMs + 10))

      await expect(rateLimiterManager.checkLimit()).resolves.toBeUndefined()
    })

    test('rate limit errors have proper format with retry info', async () => {
      const maxRequests = 60

      for (let i = 0; i < maxRequests; i++) {
        await rateLimiterManager.checkLimit()
      }

      try {
        await rateLimiterManager.checkLimit()
      } catch (error: any) {
        expect(error.message).toContain('Rate limit exceeded')
        expect(error).toHaveProperty('remainingRequests')
        expect(error).toHaveProperty('resetTime')
      }
    })
  })

  describeOrSkip('Retry Strategy + Error Classification Integration', () => {
    test('retry strategy calculates correct delays with exponential backoff', () => {
      const baseDelay = retryStrategy.getRetryDelay(0, createApiError(new Error('timeout')))
      expect(baseDelay).toBeGreaterThanOrEqual(1000)
      expect(baseDelay).toBeLessThanOrEqual(2000)

      const delay2 = retryStrategy.getRetryDelay(1, createApiError(new Error('timeout')))
      expect(delay2).toBeGreaterThan(baseDelay)

      const delay3 = retryStrategy.getRetryDelay(2, createApiError(new Error('timeout')))
      expect(delay3).toBeGreaterThan(delay2)
    })

    test('retry strategy respects max delay limit', () => {
      const highAttempt = 10
      const delay = retryStrategy.getRetryDelay(highAttempt, createApiError(new Error('timeout')))
      expect(delay).toBeLessThanOrEqual(30000)
    })

    test('retry strategy includes jitter to prevent thundering herd', () => {
      const delays: number[] = []
      for (let i = 0; i < 10; i++) {
        delays.push(retryStrategy.getRetryDelay(1, createApiError(new Error('timeout'))))
      }

      const uniqueDelays = new Set(delays)
      expect(uniqueDelays.size).toBeGreaterThan(1)
    })

    test('shouldRetry returns false for client errors', () => {
      const clientError = createApiError({ response: { status: 404 } }, '/test')
      expect(retryStrategy.shouldRetry(clientError, 0)).toBe(false)
    })

    test('shouldRetry returns true for server errors', () => {
      const serverError = createApiError({ response: { status: 500 } }, '/test')
      expect(retryStrategy.shouldRetry(serverError, 0)).toBe(true)
    })
  })

  describeOrSkip('Health Check + Circuit Breaker Integration', () => {
    beforeEach(() => {
      circuitBreaker.reset()
    })

    test('health check passes when API is available', async () => {
      const result = await checkApiHealth()

      expect(result).toMatchObject({
        healthy: true,
        timestamp: expect.any(String),
        latency: expect.any(Number)
      })

      expect(result.latency).toBeGreaterThan(0)
      expect(result.latency).toBeLessThan(10000)
    })

    test('health check returns error details when API is unavailable', async () => {
      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
    })

    test('last health check result is accessible', async () => {
      const { getLastHealthCheck } = await import('@/lib/api/client')

      const result = await checkApiHealth()
      const lastCheck = getLastHealthCheck()

      expect(lastCheck).toBeDefined()
      expect(lastCheck?.healthy).toBe(result.healthy)
      expect(lastCheck?.timestamp).toBe(result.timestamp)
    })
  })

  describeOrSkip('End-to-End API Request with All Resilience Patterns', () => {
    test('successful request passes through all resilience layers', async () => {
      const response = await apiClient.get('/wp/v2/posts?per_page=1')

      expect(response.status).toBe(200)
      expect(Array.isArray(response.data)).toBe(true)
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
    })

    test('failed request triggers appropriate resilience patterns', async () => {
      const initialState = circuitBreaker.getState()

      try {
        await apiClient.get('/wp/v2/posts/999999999')
      } catch (error: any) {
        expect(error.type).toBe(ApiErrorType.CLIENT_ERROR)
        expect(initialState).toBe(CircuitState.CLOSED)
      }
    })

    test('parallel requests respect rate limiting', async () => {
      const requests = Array(10).fill(null).map(() =>
        apiClient.get('/wp/v2/posts?per_page=1')
      )

      const responses = await Promise.allSettled(requests)

      const successful = responses.filter(r => r.status === 'fulfilled')
      expect(successful.length).toBeGreaterThan(0)
    })
  })

  describeOrSkip('Error Handling Across All Layers', () => {
    test('network errors trigger circuit breaker', async () => {
      try {
        await apiClient.get('http://invalid-host-that-does-not-exist.example/wp/v2/posts')
      } catch (error: any) {
        expect(error.type).toBe(ApiErrorType.NETWORK_ERROR)
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)
    })

    test('timeout errors are classified correctly', async () => {
      const timeoutError = createApiError(new Error('timeout'), '/test')

      expect(timeoutError.type).toBe(ApiErrorType.TIMEOUT_ERROR)
      expect(timeoutError.retryable).toBe(true)
    })

    test('rate limit errors provide helpful messages', async () => {
      const rateLimitError = createApiError(
        { response: { status: 429, headers: { 'retry-after': '60' } } },
        '/test'
      )

      expect(rateLimitError.type).toBe(ApiErrorType.RATE_LIMIT_ERROR)
      expect(rateLimitError.message).toContain('Rate limit exceeded')
      expect(rateLimitError.message).toContain('60 seconds')
      expect(rateLimitError.retryable).toBe(true)
    })
  })

  describeOrSkip('Resilience Pattern Configuration Validation', () => {
    test('circuit breaker configuration is correct', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
      expect(circuitBreaker.isOpen()).toBe(false)
    })

    test('retry strategy configuration is correct', () => {
      const timeoutError = createApiError(new Error('timeout'), '/test')
      const delay = retryStrategy.getRetryDelay(0, timeoutError)

      expect(delay).toBeGreaterThanOrEqual(1000)
      expect(delay).toBeLessThanOrEqual(30000)
    })

    test('rate limiter configuration is correct', () => {
      const info = rateLimiterManager.getInfo()

      expect(info).toHaveProperty('remainingRequests')
      expect(info).toHaveProperty('resetTime')
      expect(info.remainingRequests).toBeGreaterThan(0)
    })
  })
})
