import { CircuitBreaker, CircuitState } from '@/lib/api/circuitBreaker'
import { RetryStrategy } from '@/lib/api/retryStrategy'
import { createApiError, ApiErrorType, shouldTriggerCircuitBreaker } from '@/lib/api/errors'

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 1000,
      successThreshold: 2
    })
  })

  it('starts in CLOSED state', () => {
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
  })

  it('opens circuit after reaching failure threshold', () => {
    circuitBreaker.recordFailure()
    circuitBreaker.recordFailure()
    circuitBreaker.recordFailure()

    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)
  })

  it('allows requests when circuit is CLOSED', () => {
    expect(circuitBreaker.isOpen()).toBe(false)
  })

  it('blocks requests when circuit is OPEN', () => {
    circuitBreaker.recordFailure()
    circuitBreaker.recordFailure()
    circuitBreaker.recordFailure()

    expect(circuitBreaker.isOpen()).toBe(true)
  })

  it('transitions to HALF_OPEN after recovery timeout', async () => {
    circuitBreaker.recordFailure()
    circuitBreaker.recordFailure()
    circuitBreaker.recordFailure()

    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)

    await new Promise(resolve => setTimeout(resolve, 1100))

    expect(circuitBreaker.isOpen()).toBe(false)
    expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN)
  })

  it('closes circuit after success threshold in HALF_OPEN', () => {
    circuitBreaker.recordFailure()
    circuitBreaker.recordFailure()
    circuitBreaker.recordFailure()

    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)

    const stats = circuitBreaker.getStats()
    const nextAttemptTime = stats.nextAttemptTime
    jest.spyOn(Date, 'now').mockReturnValue(nextAttemptTime)

    expect(circuitBreaker.isOpen()).toBe(false)
    expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN)

    circuitBreaker.recordSuccess()
    circuitBreaker.recordSuccess()

    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
  })

  it('opens circuit again on failure in HALF_OPEN', () => {
    circuitBreaker.recordFailure()
    circuitBreaker.recordFailure()
    circuitBreaker.recordFailure()

    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)

    const stats = circuitBreaker.getStats()
    const nextAttemptTime = stats.nextAttemptTime
    jest.spyOn(Date, 'now').mockReturnValue(nextAttemptTime)

    expect(circuitBreaker.isOpen()).toBe(false)
    expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN)

    circuitBreaker.recordFailure()

    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)
  })

  it('decrements failure count on success in CLOSED state', () => {
    circuitBreaker.recordFailure()
    circuitBreaker.recordFailure()

    expect(circuitBreaker.getStats().failureCount).toBe(2)

    circuitBreaker.recordSuccess()

    expect(circuitBreaker.getStats().failureCount).toBe(1)
  })

  it('resets to initial state', () => {
    circuitBreaker.recordFailure()
    circuitBreaker.recordFailure()
    circuitBreaker.recordFailure()

    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)

    circuitBreaker.reset()

    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
    expect(circuitBreaker.getStats().failureCount).toBe(0)
    expect(circuitBreaker.getStats().successCount).toBe(0)
  })

  it('returns correct stats', () => {
    const stats = circuitBreaker.getStats()

    expect(stats).toHaveProperty('state')
    expect(stats).toHaveProperty('failureCount')
    expect(stats).toHaveProperty('successCount')
    expect(stats).toHaveProperty('failureThreshold')
    expect(stats).toHaveProperty('recoveryTimeout')
    expect(stats).toHaveProperty('successThreshold')
  })
})

describe('RetryStrategy', () => {
  let retryStrategy: RetryStrategy

  beforeEach(() => {
    retryStrategy = new RetryStrategy({
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      jitter: false
    })
  })

  it('should retry on 429 rate limit errors', () => {
    const error = {
      response: { status: 429 }
    }

    expect(retryStrategy.shouldRetry(error, 0)).toBe(true)
    expect(retryStrategy.shouldRetry(error, 1)).toBe(true)
    expect(retryStrategy.shouldRetry(error, 2)).toBe(true)
    expect(retryStrategy.shouldRetry(error, 3)).toBe(false)
  })

  it('should retry on 500+ server errors', () => {
    const error500 = { response: { status: 500 } }
    const error503 = { response: { status: 503 } }

    expect(retryStrategy.shouldRetry(error500, 0)).toBe(true)
    expect(retryStrategy.shouldRetry(error503, 0)).toBe(true)
  })

  it('should retry on network errors', () => {
    const error = new Error('ECONNREFUSED')

    expect(retryStrategy.shouldRetry(error, 0)).toBe(true)
    expect(retryStrategy.shouldRetry(error, 1)).toBe(false)
  })

  it('should retry on timeout errors', () => {
    const error = new Error('ETIMEDOUT')

    expect(retryStrategy.shouldRetry(error, 0)).toBe(true)
    expect(retryStrategy.shouldRetry(error, 1)).toBe(false)
  })

  it('should not retry on 4xx client errors', () => {
    const error404 = { response: { status: 404 } }
    const error401 = { response: { status: 401 } }

    expect(retryStrategy.shouldRetry(error404, 0)).toBe(false)
    expect(retryStrategy.shouldRetry(error401, 0)).toBe(false)
  })

  it('calculates exponential backoff delay correctly', () => {
    const delay0 = retryStrategy.getRetryDelay(0)
    const delay1 = retryStrategy.getRetryDelay(1)
    const delay2 = retryStrategy.getRetryDelay(2)

    expect(delay0).toBe(100)
    expect(delay1).toBe(200)
    expect(delay2).toBe(400)
  })

  it('respects max delay limit', () => {
    const delay10 = retryStrategy.getRetryDelay(10)

    expect(delay10).toBe(1000)
  })

  it('calculates exponential backoff delay correctly', () => {
    const delay0 = retryStrategy.getRetryDelay(0)
    const delay1 = retryStrategy.getRetryDelay(1)
    const delay2 = retryStrategy.getRetryDelay(2)

    expect(delay0).toBe(100)
    expect(delay1).toBe(200)
    expect(delay2).toBe(400)
  })

  it('adds jitter when enabled', () => {
    const retryWithJitter = new RetryStrategy({ jitter: true, maxRetries: 3 })

    const delay1 = retryWithJitter.getRetryDelay(1)
    const delay2 = retryWithJitter.getRetryDelay(1)

    expect(delay1).not.toBe(delay2)
  })

  it('executes function with retries on success', async () => {
    const fn = jest.fn().mockResolvedValue('success')

    const result = await retryStrategy.execute(fn)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and succeeds', async () => {
    const fn = jest.fn()
      .mockImplementationOnce(() => Promise.reject({ response: { status: 500 } }))
      .mockImplementationOnce(() => Promise.resolve('success'))

    const result = await retryStrategy.execute(fn)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws after max retries', async () => {
    const fn = jest.fn().mockImplementation(() => Promise.reject({ response: { status: 500 } }))

    await expect(retryStrategy.execute(fn)).rejects.toEqual({ response: { status: 500 } })
    expect(fn).toHaveBeenCalledTimes(4)
  })
})

describe('Error Handling', () => {
  describe('createApiError', () => {
    it('creates timeout error from timeout message', () => {
      const error = new Error('Request timeout')
      const apiError = createApiError(error, '/test')

      expect(apiError.type).toBe(ApiErrorType.TIMEOUT_ERROR)
      expect(apiError.retryable).toBe(true)
      expect(apiError.endpoint).toBe('/test')
    })

    it('creates network error from ECONNREFUSED', () => {
      const error = new Error('ECONNREFUSED')
      const apiError = createApiError(error)

      expect(apiError.type).toBe(ApiErrorType.NETWORK_ERROR)
      expect(apiError.retryable).toBe(true)
    })

    it('creates unknown error for unknown errors', () => {
      const error = new Error('Unknown error')
      const apiError = createApiError(error)

      expect(apiError.type).toBe(ApiErrorType.UNKNOWN_ERROR)
      expect(apiError.retryable).toBe(false)
    })

    it('returns existing ApiError instance', () => {
      const originalError = createApiError(new Error('test'))
      const apiError = createApiError(originalError)

      expect(apiError).toBe(originalError)
    })
  })

  describe('shouldTriggerCircuitBreaker', () => {
    it('triggers on timeout errors', () => {
      const error = createApiError(new Error('timeout'))

      expect(shouldTriggerCircuitBreaker(error)).toBe(true)
    })

    it('triggers on network errors', () => {
      const error = createApiError(new Error('ECONNREFUSED'))

      expect(shouldTriggerCircuitBreaker(error)).toBe(true)
    })

    it('triggers on server errors', () => {
      const error = {
        type: ApiErrorType.SERVER_ERROR,
        message: 'Server error',
        retryable: true,
        timestamp: new Date().toISOString()
      }

      expect(shouldTriggerCircuitBreaker(error)).toBe(true)
    })

    it('does not trigger on client errors', () => {
      const error = {
        type: ApiErrorType.CLIENT_ERROR,
        message: 'Client error',
        retryable: false,
        timestamp: new Date().toISOString()
      }

      expect(shouldTriggerCircuitBreaker(error)).toBe(false)
    })

    it('does not trigger on rate limit errors', () => {
      const error = {
        type: ApiErrorType.RATE_LIMIT_ERROR,
        message: 'Rate limited',
        retryable: true,
        timestamp: new Date().toISOString()
      }

      expect(shouldTriggerCircuitBreaker(error)).toBe(false)
    })
  })
})
