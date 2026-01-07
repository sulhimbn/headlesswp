import axios, { AxiosError } from 'axios'
import { getApiUrl } from '@/lib/api/client'
import { CircuitBreaker, CircuitState } from '@/lib/api/circuitBreaker'
import { createApiError, shouldTriggerCircuitBreaker, ApiErrorType } from '@/lib/api/errors'
import { RateLimiterManager } from '@/lib/api/rateLimiter'
import { RetryStrategy } from '@/lib/api/retryStrategy'
import { checkApiHealth } from '@/lib/api/healthCheck'
import { logger } from '@/lib/utils/logger'

jest.mock('@/lib/api/healthCheck')
jest.mock('@/lib/utils/logger')

describe('API Client Components', () => {
  let mockedCheckApiHealth: jest.MockedFunction<typeof checkApiHealth>
  let mockedLogger: jest.Mocked<typeof logger>

  beforeEach(() => {
    jest.clearAllMocks()
    mockedCheckApiHealth = checkApiHealth as jest.MockedFunction<typeof checkApiHealth>
    mockedLogger = logger as jest.Mocked<typeof logger>
  })

  describe('getApiUrl function', () => {
    it('should construct correct API URL from path', () => {
      const path = '/wp/v2/posts'
      const url = getApiUrl(path)
      
      expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/posts')
    })

    it('should handle empty path', () => {
      const url = getApiUrl('')
      
      expect(url).toBe('http://localhost:8080/index.php?rest_route=')
    })

    it('should handle complex paths', () => {
      const path = '/wp/v2/posts/1'
      const url = getApiUrl(path)
      
      expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/posts/1')
    })

    it('should handle paths with query parameters', () => {
      const path = '/wp/v2/posts?per_page=10'
      const url = getApiUrl(path)
      
      expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/posts?per_page=10')
    })

    it('should handle category endpoint', () => {
      const path = '/wp/v2/categories'
      const url = getApiUrl(path)
      
      expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/categories')
    })

    it('should handle tags endpoint', () => {
      const path = '/wp/v2/tags'
      const url = getApiUrl(path)
      
      expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/tags')
    })

    it('should handle media endpoint', () => {
      const path = '/wp/v2/media'
      const url = getApiUrl(path)
      
      expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/media')
    })

    it('should handle users endpoint', () => {
      const path = '/wp/v2/users'
      const url = getApiUrl(path)
      
      expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/users')
    })

    it('should handle search endpoint', () => {
      const path = '/wp/v2/search'
      const url = getApiUrl(path)
      
      expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/search')
    })
  })

  describe('Rate Limiter - Request Throttling', () => {
    it('should allow requests within rate limit', async () => {
      const rateLimiter = new RateLimiterManager({
        maxRequests: 60,
        windowMs: 60000,
      })

      await expect(rateLimiter.checkLimit()).resolves.not.toThrow()
    })

    it('should enforce rate limit when exceeded', async () => {
      const rateLimiter = new RateLimiterManager({
        maxRequests: 2,
        windowMs: 1000,
      })

      await rateLimiter.checkLimit()
      await rateLimiter.checkLimit()
      
      await expect(rateLimiter.checkLimit()).rejects.toThrow('Rate limit exceeded')
    })

    it('should allow requests after rate limit window expires', async () => {
      jest.useFakeTimers()
      const rateLimiter = new RateLimiterManager({
        maxRequests: 2,
        windowMs: 1000,
      })

      await rateLimiter.checkLimit()
      await rateLimiter.checkLimit()
      
      jest.advanceTimersByTime(1001)
      
      await expect(rateLimiter.checkLimit()).resolves.not.toThrow()
      
      jest.useRealTimers()
    })

    it('should provide rate limit info on error', async () => {
      jest.useFakeTimers()
      const rateLimiter = new RateLimiterManager({
        maxRequests: 2,
        windowMs: 1000,
      })

      await rateLimiter.checkLimit()
      await rateLimiter.checkLimit()
      
      try {
        await rateLimiter.checkLimit()
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.message).toContain('Rate limit exceeded')
        expect(error.type).toBe(ApiErrorType.RATE_LIMIT_ERROR)
      }
      
      jest.useRealTimers()
    })

    it('should handle multiple rate limiters with different keys', async () => {
      const rateLimiterManager = new RateLimiterManager({
        maxRequests: 2,
        windowMs: 1000,
      })

      await rateLimiterManager.checkLimit('api1')
      await rateLimiterManager.checkLimit('api1')
      
      await rateLimiterManager.checkLimit('api2')
      await rateLimiterManager.checkLimit('api2')
      
      await expect(rateLimiterManager.checkLimit('api1')).rejects.toThrow()
      await expect(rateLimiterManager.checkLimit('api2')).rejects.toThrow()
    })
  })

  describe('Circuit Breaker - Failure Isolation', () => {
    it('should start in CLOSED state', () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 60000,
        successThreshold: 2,
      })

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
    })

    it('should remain CLOSED under failure threshold', () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 60000,
        successThreshold: 2,
      })

      for (let i = 0; i < 4; i++) {
        circuitBreaker.recordFailure()
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
    })

    it('should open circuit when failure threshold reached', () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 60000,
        successThreshold: 2,
      })

      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)
    })

    it('should move to HALF_OPEN after recovery timeout', async () => {
      jest.useFakeTimers()
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 1000,
        successThreshold: 2,
      })

      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)

      jest.advanceTimersByTime(1001)
      
      circuitBreaker.isOpen()

      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN)
      
      jest.useRealTimers()
    })

    it('should close circuit after success threshold reached', () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 60000,
        successThreshold: 2,
      })

      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)

      jest.useFakeTimers()
      jest.advanceTimersByTime(61000)
      
      circuitBreaker.isOpen()
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN)

      circuitBreaker.recordSuccess()
      circuitBreaker.recordSuccess()

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
      
      jest.useRealTimers()
    })

    it('should reopen circuit on failure in HALF_OPEN state', () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 1000,
        successThreshold: 2,
      })

      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)

      jest.useFakeTimers()
      jest.advanceTimersByTime(1001)
      
      circuitBreaker.isOpen()
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN)

      circuitBreaker.recordSuccess()
      circuitBreaker.recordFailure()

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)
      
      jest.useRealTimers()
    })

    it('should call state change callback when state changes', () => {
      const onStateChange = jest.fn()
      
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 60000,
        successThreshold: 2,
        onStateChange,
      })

      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()

      expect(onStateChange).toHaveBeenCalledWith(CircuitState.OPEN)
    })
  })

  describe('Error Creation - Type Classification', () => {
    it('should create NETWORK_ERROR for network issues', () => {
      const error = createApiError(
        new Error('network error'),
        '/wp/v2/posts'
      )

      expect(error.type).toBe(ApiErrorType.NETWORK_ERROR)
      expect(error.message).toContain('Network error')
      expect(error.endpoint).toBe('/wp/v2/posts')
      expect(error.timestamp).toBeDefined()
      expect(error.retryable).toBe(true)
    })

    it('should create TIMEOUT_ERROR for timeout issues', () => {
      const error = createApiError(
        new Error('timeout'),
        '/wp/v2/posts'
      )

      expect(error.type).toBe(ApiErrorType.TIMEOUT_ERROR)
      expect(error.message).toContain('timeout')
      expect(error.retryable).toBe(true)
    })

    it('should create UNKNOWN_ERROR for unknown errors', () => {
      const error = createApiError(
        new Error('Unknown error'),
        '/wp/v2/posts'
      )

      expect(error.type).toBe(ApiErrorType.UNKNOWN_ERROR)
      expect(error.message).toBe('Unknown error')
      expect(error.retryable).toBe(false)
    })

    it('should handle errors without endpoint', () => {
      const error = createApiError(new Error('Unknown error'), undefined)

      expect(error.type).toBe(ApiErrorType.UNKNOWN_ERROR)
      expect(error.endpoint).toBeUndefined()
      expect(error.retryable).toBe(false)
    })

    it('should include timestamp in error', () => {
      const beforeTime = new Date().toISOString()
      const error = createApiError(new Error('test'), '/wp/v2/posts')
      const afterTime = new Date().toISOString()

      expect(error.timestamp).toBeDefined()
      expect(error.timestamp >= beforeTime).toBe(true)
      expect(error.timestamp <= afterTime).toBe(true)
    })
  })

  describe('Circuit Breaker Trigger Logic', () => {
    it('should trigger on NETWORK_ERROR', () => {
      const apiError = createApiError(new Error('Network Error'), '/wp/v2/posts')
      apiError.type = ApiErrorType.NETWORK_ERROR

      expect(shouldTriggerCircuitBreaker(apiError)).toBe(true)
    })

    it('should trigger on TIMEOUT_ERROR', () => {
      const apiError = createApiError(new Error('Timeout'), '/wp/v2/posts')
      apiError.type = ApiErrorType.TIMEOUT_ERROR

      expect(shouldTriggerCircuitBreaker(apiError)).toBe(true)
    })

    it('should trigger on SERVER_ERROR', () => {
      const apiError = createApiError(new Error('Server Error'), '/wp/v2/posts')
      apiError.type = ApiErrorType.SERVER_ERROR

      expect(shouldTriggerCircuitBreaker(apiError)).toBe(true)
    })

    it('should not trigger on CLIENT_ERROR', () => {
      const apiError = createApiError(new Error('Not Found'), '/wp/v2/posts')
      apiError.type = ApiErrorType.CLIENT_ERROR

      expect(shouldTriggerCircuitBreaker(apiError)).toBe(false)
    })

    it('should not trigger on UNKNOWN_ERROR', () => {
      const apiError = createApiError(new Error('Unknown'), '/wp/v2/posts')
      apiError.type = ApiErrorType.UNKNOWN_ERROR

      expect(shouldTriggerCircuitBreaker(apiError)).toBe(false)
    })
  })

  describe('Retry Strategy - Exponential Backoff', () => {
    it('should calculate correct retry delays', () => {
      const retryStrategy = new RetryStrategy({
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: false,
      })

      expect(retryStrategy.getRetryDelay(0)).toBe(1000)
      expect(retryStrategy.getRetryDelay(1)).toBe(2000)
      expect(retryStrategy.getRetryDelay(2)).toBe(4000)
    })

    it('should respect max delay limit', () => {
      const retryStrategy = new RetryStrategy({
        maxRetries: 10,
        initialDelay: 10000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: false,
      })

      expect(retryStrategy.getRetryDelay(5)).toBe(30000)
    })

    it('should add jitter when enabled', () => {
      const retryStrategy = new RetryStrategy({
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
      })

      const delay1 = retryStrategy.getRetryDelay(0)
      const delay2 = retryStrategy.getRetryDelay(0)

      expect(delay1).not.toBe(delay2)
    })

    it('should determine retry eligibility correctly', () => {
      const retryStrategy = new RetryStrategy({
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: false,
      })

      const networkError = createApiError(new Error('Network Error'), '/wp/v2/posts')
      networkError.type = ApiErrorType.NETWORK_ERROR

      expect(retryStrategy.shouldRetry(networkError as any, 0)).toBe(true)
      expect(retryStrategy.shouldRetry(networkError as any, 3)).toBe(false)
    })

    it('should not retry client errors', () => {
      const retryStrategy = new RetryStrategy({
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: false,
      })

      const clientError = createApiError(new Error('Not Found'), '/wp/v2/posts')
      clientError.type = ApiErrorType.CLIENT_ERROR

      expect(retryStrategy.shouldRetry(clientError as any, 0)).toBe(false)
    })
  })

  describe('Health Check Integration', () => {
    it('should return healthy result when API is responsive', async () => {
      mockedCheckApiHealth.mockResolvedValueOnce({
        healthy: true,
        timestamp: new Date().toISOString(),
        latency: 100,
        message: 'API is healthy',
        version: '2.0',
      })

      const result = await mockedCheckApiHealth()

      expect(result.healthy).toBe(true)
      expect(result.latency).toBe(100)
      expect(result.version).toBe('2.0')
    })

    it('should return unhealthy result when API is down', async () => {
      mockedCheckApiHealth.mockResolvedValueOnce({
        healthy: false,
        timestamp: new Date().toISOString(),
        latency: 100,
        message: 'API is unhealthy',
        error: 'Connection refused',
      })

      const result = await mockedCheckApiHealth()

      expect(result.healthy).toBe(false)
      expect(result.error).toBe('Connection refused')
    })
  })

  describe('Logging Integration', () => {
    it('should log circuit breaker state changes', () => {
      mockedLogger.warn.mockClear()

      mockedLogger.warn(
        'CircuitBreaker state changed to: OPEN',
        undefined,
        { module: 'CircuitBreaker' }
      )

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'CircuitBreaker state changed to: OPEN',
        undefined,
        { module: 'CircuitBreaker' }
      )
    })

    it('should log retry attempts', () => {
      mockedLogger.warn.mockClear()

      mockedLogger.warn(
        'Retrying request to /wp/v2/posts (attempt 2/3) after 1000ms...',
        undefined,
        { module: 'APIClient' }
      )

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Retrying request to /wp/v2/posts (attempt 2/3) after 1000ms...',
        undefined,
        { module: 'APIClient' }
      )
    })

    it('should log health check failures', () => {
      mockedLogger.warn.mockClear()

      mockedLogger.warn(
        'Health check failed, preventing request',
        undefined,
        { module: 'APIClient' }
      )

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Health check failed, preventing request',
        undefined,
        { module: 'APIClient' }
      )
    })

    it('should log HALF_OPEN state health checks', () => {
      mockedLogger.warn.mockClear()

      mockedLogger.warn(
        'Circuit in HALF_OPEN state, performing health check...',
        undefined,
        { module: 'APIClient' }
      )

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Circuit in HALF_OPEN state, performing health check...',
        undefined,
        { module: 'APIClient' }
      )
    })

    it('should log successful health check after HALF_OPEN', () => {
      mockedLogger.warn.mockClear()

      mockedLogger.warn(
        'Health check passed (100ms), allowing request',
        undefined,
        { module: 'APIClient' }
      )

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Health check passed (100ms), allowing request',
        undefined,
        { module: 'APIClient' }
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero initial delay in retry strategy', () => {
      const retryStrategy = new RetryStrategy({
        maxRetries: 3,
        initialDelay: 0,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: false,
      })

      expect(retryStrategy.getRetryDelay(0)).toBe(0)
    })

    it('should handle failure threshold of 1 in circuit breaker', () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 1,
        recoveryTimeout: 60000,
        successThreshold: 2,
      })

      circuitBreaker.recordFailure()

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)
    })

    it('should handle max retries of 0 in retry strategy', () => {
      const retryStrategy = new RetryStrategy({
        maxRetries: 0,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: false,
      })

      const error = createApiError(new Error('Network Error'), '/wp/v2/posts')
      error.type = ApiErrorType.NETWORK_ERROR

      expect(retryStrategy.shouldRetry(error as any, 0)).toBe(false)
    })

    it('should handle zero rate limit', async () => {
      const rateLimiter = new RateLimiterManager({
        maxRequests: 0,
        windowMs: 60000,
      })

      await expect(rateLimiter.checkLimit()).rejects.toThrow('Rate limit exceeded')
    })
  })
})
