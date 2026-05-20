import axios, { AxiosError } from 'axios'
import { getApiUrl, checkApiHealth, checkApiHealthWithTimeout, checkApiHealthRetry, getLastHealthCheck } from '@/lib/api/client'
import { CircuitState, CircuitBreaker } from '@/lib/api/circuitBreaker'
import { RetryStrategy } from '@/lib/api/retryStrategy'
import { RateLimiterManager } from '@/lib/api/rateLimiter'
import { HealthChecker } from '@/lib/api/healthCheck'
import { ApiErrorType, shouldTriggerCircuitBreaker, createApiError } from '@/lib/api/errors'

jest.mock('@/lib/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() }
}))

describe('API Client - getApiUrl', () => {
  it('should construct correct API URL from path', () => {
    expect(getApiUrl('/wp/v2/posts')).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/posts')
  })

  it('should handle empty path', () => {
    expect(getApiUrl('')).toBe('http://localhost:8080/index.php?rest_route=')
  })

  it('should handle complex paths', () => {
    expect(getApiUrl('/wp/v2/posts/1')).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/posts/1')
  })

  it('should handle paths with query parameters', () => {
    expect(getApiUrl('/wp/v2/posts?per_page=10')).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/posts?per_page=10')
  })

  it('should handle category endpoint', () => {
    expect(getApiUrl('/wp/v2/categories')).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/categories')
  })

  it('should handle tags endpoint', () => {
    expect(getApiUrl('/wp/v2/tags')).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/tags')
  })

  it('should handle media endpoint', () => {
    expect(getApiUrl('/wp/v2/media')).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/media')
  })

  it('should handle users endpoint', () => {
    expect(getApiUrl('/wp/v2/users')).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/users')
  })

  it('should handle search endpoint', () => {
    expect(getApiUrl('/wp/v2/search')).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/search')
  })

  it('should handle post detail endpoint with slug', () => {
    expect(getApiUrl('/wp/v2/posts?slug=test-post')).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/posts?slug=test-post')
  })
})

describe('API Client - Health Check Functions', () => {
  it('should export checkApiHealth function', () => {
    expect(typeof checkApiHealth).toBe('function')
  })

  it('should export checkApiHealthWithTimeout function', () => {
    expect(typeof checkApiHealthWithTimeout).toBe('function')
  })

  it('should export checkApiHealthRetry function', () => {
    expect(typeof checkApiHealthRetry).toBe('function')
  })

  it('should export getLastHealthCheck function', () => {
    expect(typeof getLastHealthCheck).toBe('function')
  })

  it('should call checkApiHealth and return result', async () => {
    const result = await checkApiHealth()
    expect(result).toBeDefined()
    expect(result).toHaveProperty('healthy')
    expect(result).toHaveProperty('timestamp')
    expect(result).toHaveProperty('latency')
    expect(result).toHaveProperty('message')
  })

  it('should call checkApiHealthWithTimeout with custom timeout', async () => {
    const result = await checkApiHealthWithTimeout(5000)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('healthy')
  })

  it('should call checkApiHealthWithTimeout with default timeout', async () => {
    const result = await checkApiHealthWithTimeout()
    expect(result).toBeDefined()
    expect(result).toHaveProperty('healthy')
  })

  it('should call checkApiHealthRetry with custom parameters', async () => {
    const result = await checkApiHealthRetry(3, 1000)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('healthy')
  })

  it('should call checkApiHealthRetry with default parameters', async () => {
    const result = await checkApiHealthRetry()
    expect(result).toBeDefined()
    expect(result).toHaveProperty('healthy')
  })

  it('should call getLastHealthCheck and return last check result', () => {
    const lastCheck = getLastHealthCheck()
    expect(lastCheck).toBeDefined()
  })
})

describe('API Client - Error Handling', () => {
  it('should create api error with endpoint information', () => {
    const error = createApiError(new Error('Test error'), '/wp/v2/posts')
    expect(error).toBeDefined()
    expect(error.endpoint).toBe('/wp/v2/posts')
  })

  it('should create api error from axios error', () => {
    const axiosError = new AxiosError('test')
    axiosError.response = { status: 500, data: { error: 'Server Error' }, headers: {} } as any
    const error = createApiError(axiosError, '/wp/v2/posts')
    expect(error).toBeDefined()
  })

  it('should create api error for timeout', () => {
    const error = createApiError(new Error('timeout error'), '/wp/v2/posts')
    expect(error).toBeDefined()
  })

  it('should create api error for network error', () => {
    const error = createApiError(new Error('econnrefused'), '/wp/v2/posts')
    expect(error).toBeDefined()
  })

  it('should identify errors that should trigger circuit breaker', () => {
    const timeoutError: any = { type: ApiErrorType.TIMEOUT_ERROR }
    const networkError: any = { type: ApiErrorType.NETWORK_ERROR }
    const serverError: any = { type: ApiErrorType.SERVER_ERROR }
    expect(shouldTriggerCircuitBreaker(timeoutError)).toBe(true)
    expect(shouldTriggerCircuitBreaker(networkError)).toBe(true)
    expect(shouldTriggerCircuitBreaker(serverError)).toBe(true)
  })

  it('should not trigger circuit breaker for client errors', () => {
    const clientError: any = { type: ApiErrorType.CLIENT_ERROR }
    const rateLimitError: any = { type: ApiErrorType.RATE_LIMIT_ERROR }
    const unknownError: any = { type: ApiErrorType.UNKNOWN_ERROR }
    expect(shouldTriggerCircuitBreaker(clientError)).toBe(false)
    expect(shouldTriggerCircuitBreaker(rateLimitError)).toBe(false)
    expect(shouldTriggerCircuitBreaker(unknownError)).toBe(false)
  })
})

describe('API Client - RetryStrategy class', () => {
  it('should create RetryStrategy with custom options', () => {
    const customRetry = new RetryStrategy({ maxRetries: 5, initialDelay: 2000, maxDelay: 60000, backoffMultiplier: 3, jitter: false })
    expect(customRetry).toBeDefined()
  })

  it('should use default options', () => {
    const defaultRetry = new RetryStrategy()
    expect(defaultRetry).toBeDefined()
  })

  it('should retry on 429 status', () => {
    const retry = new RetryStrategy()
    const error = { response: { status: 429 } }
    expect(retry.shouldRetry(error, 0)).toBe(true)
  })

  it('should retry on 500 status', () => {
    const retry = new RetryStrategy()
    const error = { response: { status: 500 } }
    expect(retry.shouldRetry(error, 0)).toBe(true)
  })

  it('should retry on 502 status', () => {
    const retry = new RetryStrategy()
    const error = { response: { status: 502 } }
    expect(retry.shouldRetry(error, 0)).toBe(true)
  })

  it('should retry on 503 status', () => {
    const retry = new RetryStrategy()
    const error = { response: { status: 503 } }
    expect(retry.shouldRetry(error, 0)).toBe(true)
  })

  it('should retry on 504 status', () => {
    const retry = new RetryStrategy()
    const error = { response: { status: 504 } }
    expect(retry.shouldRetry(error, 0)).toBe(true)
  })

  it('should not retry on 404 status', () => {
    const retry = new RetryStrategy()
    const error = { response: { status: 404 } }
    expect(retry.shouldRetry(error, 0)).toBe(false)
  })

  it('should not retry on 400 status', () => {
    const retry = new RetryStrategy()
    const error = { response: { status: 400 } }
    expect(retry.shouldRetry(error, 0)).toBe(false)
  })

  it('should not retry when max retries exceeded', () => {
    const retry = new RetryStrategy({ maxRetries: 3 })
    const error = { response: { status: 500 } }
    expect(retry.shouldRetry(error, 3)).toBe(false)
  })

  it('should retry on timeout error', () => {
    const retry = new RetryStrategy()
    const error = new Error('timeout')
    expect(retry.shouldRetry(error, 0)).toBe(true)
  })

  it('should retry on network error', () => {
    const retry = new RetryStrategy()
    const error = new Error('econnrefused')
    expect(retry.shouldRetry(error, 0)).toBe(true)
  })

  it('should calculate retry delay', () => {
    const retry = new RetryStrategy()
    const delay = retry.getRetryDelay(0, { response: { status: 500 } })
    expect(delay).toBeGreaterThan(0)
  })

  it('should respect max delay', () => {
    const retry = new RetryStrategy({ maxDelay: 30000 })
    const delay = retry.getRetryDelay(10, { response: { status: 500 } })
    expect(delay).toBeLessThanOrEqual(30000)
  })

  it('should extract retry-after header in seconds', () => {
    const retry = new RetryStrategy({ maxDelay: 60000 })
    const error = { response: { status: 429, headers: { 'retry-after': '30' } } }
    expect(retry.getRetryDelay(0, error)).toBe(30000)
  })

  it('should extract retry-after header as timestamp', () => {
    const retry = new RetryStrategy({ maxDelay: 60000 })
    const futureTime = new Date(Date.now() + 30000).toISOString()
    const error = { response: { status: 429, headers: { 'retry-after': futureTime } } }
    expect(retry.getRetryDelay(0, error)).toBeGreaterThan(0)
  })
})

describe('API Client - CircuitBreaker class', () => {
  it('should create CircuitBreaker with custom options', () => {
    const customCB = new CircuitBreaker({ failureThreshold: 3, recoveryTimeout: 30000, successThreshold: 1, onStateChange: () => {} })
    expect(customCB).toBeDefined()
  })

  it('should use default options', () => {
    const defaultCB = new CircuitBreaker()
    expect(defaultCB).toBeDefined()
  })

  it('should start in closed state', () => {
    const cb = new CircuitBreaker()
    expect(cb.getState()).toBe(CircuitState.CLOSED)
  })

  it('should record success responses', () => {
    const cb = new CircuitBreaker()
    cb.recordSuccess()
    expect(cb.getStats().state).toBe(CircuitState.CLOSED)
  })

  it('should record failure responses', () => {
    const cb = new CircuitBreaker()
    cb.recordFailure()
    expect(cb.getStats().failureCount).toBe(1)
  })

  it('should transition to open state after failure threshold', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 })
    cb.recordFailure()
    cb.recordFailure()
    cb.recordFailure()
    expect(cb.getState()).toBe(CircuitState.OPEN)
  })

  it('should indicate open state', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 })
    cb.recordFailure()
    cb.recordFailure()
    cb.recordFailure()
    expect(cb.isOpen()).toBe(true)
  })

  it('should transition to half-open after recovery timeout', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, recoveryTimeout: 100 })
    cb.recordFailure()
    cb.recordFailure()
    cb.recordFailure()
    expect(cb.getState()).toBe(CircuitState.OPEN)
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(cb.isOpen()).toBe(false)
  })

  it('should reset circuit breaker', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 })
    cb.recordFailure()
    cb.recordFailure()
    cb.recordFailure()
    cb.reset()
    expect(cb.getStats().failureCount).toBe(0)
    expect(cb.getStats().state).toBe(CircuitState.CLOSED)
  })

  it('should call onStateChange callback', () => {
    const stateChanges: CircuitState[] = []
    const cb = new CircuitBreaker({ failureThreshold: 3, onStateChange: (state) => { stateChanges.push(state) } })
    cb.recordFailure()
    cb.recordFailure()
    cb.recordFailure()
    expect(stateChanges).toContain(CircuitState.OPEN)
  })
})

describe('API Client - RateLimiterManager class', () => {
  it('should create RateLimiterManager with options', () => {
    const rateLimiter = new RateLimiterManager({ maxRequests: 10, windowMs: 60000 })
    expect(rateLimiter).toBeDefined()
  })

  it('should check rate limit successfully', async () => {
    const rateLimiter = new RateLimiterManager({ maxRequests: 10, windowMs: 60000 })
    await expect(rateLimiter.checkLimit()).resolves.toBeUndefined()
  })

  it('should get rate limit info', () => {
    const rateLimiter = new RateLimiterManager({ maxRequests: 10, windowMs: 60000 })
    const info = rateLimiter.getInfo()
    expect(info.remainingRequests).toBe(10)
    expect(info.maxRequests).toBe(10)
  })

  it('should reset rate limiter', () => {
    const rateLimiter = new RateLimiterManager({ maxRequests: 10, windowMs: 60000 })
    rateLimiter.reset()
    expect(rateLimiter.getInfo().remainingRequests).toBe(10)
  })

  it('should track multiple named limiters', async () => {
    const rateLimiter = new RateLimiterManager({ maxRequests: 10, windowMs: 60000 })
    await rateLimiter.checkLimit('user1')
    await rateLimiter.checkLimit('user2')
    expect(rateLimiter.getInfo('user1').remainingRequests).toBe(9)
    expect(rateLimiter.getInfo('user2').remainingRequests).toBe(9)
  })

  it('should reset specific limiter', () => {
    const rateLimiter = new RateLimiterManager({ maxRequests: 10, windowMs: 60000 })
    rateLimiter.reset('specific')
    expect(rateLimiter.getInfo('specific').remainingRequests).toBe(10)
  })

  it('should reset all limiters', () => {
    const rateLimiter = new RateLimiterManager({ maxRequests: 10, windowMs: 60000 })
    rateLimiter.reset('a')
    rateLimiter.reset('b')
    rateLimiter.resetAll()
  })
})

describe('API Client - HealthChecker class', () => {
  it('should create HealthChecker with httpClient', () => {
    const healthChecker = new HealthChecker(axios.create())
    expect(healthChecker).toBeDefined()
  })

  it('should perform health check', async () => {
    const mockClient = { get: jest.fn().mockResolvedValue({ headers: {} }) }
    const healthChecker = new HealthChecker(mockClient as any)
    const result = await healthChecker.check()
    expect(result.healthy).toBe(true)
  })

  it('should handle health check failure', async () => {
    const mockClient = { get: jest.fn().mockRejectedValue(new Error('Network error')) }
    const healthChecker = new HealthChecker(mockClient as any)
    const result = await healthChecker.check()
    expect(result.healthy).toBe(false)
  })

  it('should return last check result', () => {
    const mockClient = { get: jest.fn().mockResolvedValue({ headers: {} }) }
    const healthChecker = new HealthChecker(mockClient as any)
    expect(healthChecker.getLastCheck()).toBeNull()
  })

  it('should handle concurrent health checks', async () => {
    const mockClient = { get: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ headers: {} }), 10))) }
    const healthChecker = new HealthChecker(mockClient as any)
    const result = await healthChecker.check()
    expect(result).toBeDefined()
  })
})