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

describe('RetryStrategy Edge Cases', () => {
  let retryStrategy: RetryStrategy

  beforeEach(() => {
    retryStrategy = new RetryStrategy({
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: false
    })
  })

  describe('Retry-After Header Parsing', () => {
    it('parses numeric Retry-After header correctly (capped at maxDelay)', () => {
      const error = {
        response: {
          status: 429,
          headers: {
            'retry-after': '60',
            get: (key: string) => {
              if (key === 'retry-after' || key === 'Retry-After') {
                return '60'
              }
              return null
            }
          }
        }
      }

      const delay = retryStrategy.getRetryDelay(0, error)

      expect(delay).toBe(10000)
    })

    it('respects max delay when Retry-After exceeds it', () => {
      const error = {
        response: {
          status: 429,
          headers: {
            'retry-after': '3600',
            get: (key: string) => '3600'
          }
        }
      }

      const delay = retryStrategy.getRetryDelay(0, error)

      expect(delay).toBe(10000)
    })

    it('parses HTTP-date Retry-After header correctly (capped at maxDelay)', () => {
      const futureTime = new Date(Date.now() + 60000).toUTCString()
      const error = {
        response: {
          status: 429,
          headers: {
            'retry-after': futureTime,
            get: (key: string) => futureTime
          }
        }
      }

      const delay = retryStrategy.getRetryDelay(0, error)

      expect(delay).toBe(10000)
    })

    it('prevents negative delays when Retry-After is in the past', () => {
      const pastTime = new Date(Date.now() - 1000).toUTCString()
      const error = {
        response: {
          status: 429,
          headers: {
            'retry-after': pastTime,
            get: (key: string) => pastTime
          }
        }
      }

      const delay = retryStrategy.getRetryDelay(0, error)

      expect(delay).toBe(0)
    })

    it('uses backoff when Retry-After header is missing', () => {
      const error = {
        response: {
          status: 500,
          headers: {}
        }
      }

      const delay = retryStrategy.getRetryDelay(1, error)

      expect(delay).toBe(200)
    })

    it('uses backoff when Retry-After header is invalid', () => {
      const error = {
        response: {
          status: 429,
          headers: {
            'retry-after': 'invalid',
            get: (key: string) => 'invalid'
          }
        }
      }

      const delay = retryStrategy.getRetryDelay(0, error)

      expect(delay).toBe(100)
    })
  })

  describe('Network Error Variants', () => {
    it('should NOT retry on ECONNRESET (not in retry list)', () => {
      const error = new Error('ECONNRESET')

      expect(retryStrategy.shouldRetry(error, 0)).toBe(false)
      expect(retryStrategy.shouldRetry(error, 1)).toBe(false)
    })

    it('should NOT retry on ENOTFOUND (not in retry list)', () => {
      const error = new Error('ENOTFOUND')

      expect(retryStrategy.shouldRetry(error, 0)).toBe(false)
      expect(retryStrategy.shouldRetry(error, 1)).toBe(false)
    })

    it('should NOT retry on ENETUNREACH (not in retry list)', () => {
      const error = new Error('ENETUNREACH')

      expect(retryStrategy.shouldRetry(error, 0)).toBe(false)
      expect(retryStrategy.shouldRetry(error, 1)).toBe(false)
    })

    it('should NOT retry on ECONNABORTED (not in retry list)', () => {
      const error = new Error('ECONNABORTED')

      expect(retryStrategy.shouldRetry(error, 0)).toBe(false)
      expect(retryStrategy.shouldRetry(error, 1)).toBe(false)
    })

    it('should retry on various timeout error messages (only those containing timeout)', () => {
      const timeoutErrors = [
        new Error('timeout of 30000ms exceeded'),
        new Error('ETIMEDOUT'),
        new Error('etimedout')
      ]

      timeoutErrors.forEach(error => {
        expect(retryStrategy.shouldRetry(error, 0)).toBe(true)
        expect(retryStrategy.shouldRetry(error, 1)).toBe(false)
      })
    })

    it('should retry on messages containing timeout keyword', () => {
      const timeoutErrors = [
        new Error('Connection timeout'),
        new Error('timeout of 30000ms exceeded'),
        new Error('Request timeout'),
        new Error('ETIMEDOUT')
      ]

      timeoutErrors.forEach(error => {
        expect(retryStrategy.shouldRetry(error, 0)).toBe(true)
        expect(retryStrategy.shouldRetry(error, 1)).toBe(false)
      })
    })

    it('should NOT retry on messages without actual timeout keyword', () => {
      const timeoutErrors = [
        new Error('Request timed out'),
        new Error('Timed out'),
        new Error('Connection lost'),
        new Error('Request failed'),
        new Error('Time exceeded')
      ]

      timeoutErrors.forEach(error => {
        expect(retryStrategy.shouldRetry(error, 0)).toBe(false)
        expect(retryStrategy.shouldRetry(error, 1)).toBe(false)
      })
    })

    it('should retry on ECONNREFUSED (network error)', () => {
      const error = new Error('ECONNREFUSED')

      expect(retryStrategy.shouldRetry(error, 0)).toBe(true)
      expect(retryStrategy.shouldRetry(error, 1)).toBe(false)
    })

    it('should retry on network error message', () => {
      const error = new Error('network error')

      expect(retryStrategy.shouldRetry(error, 0)).toBe(true)
      expect(retryStrategy.shouldRetry(error, 1)).toBe(false)
    })

    it('should retry on econnrefused (lowercase)', () => {
      const error = new Error('econnrefused')

      expect(retryStrategy.shouldRetry(error, 0)).toBe(true)
      expect(retryStrategy.shouldRetry(error, 1)).toBe(false)
    })
  })

  describe('Mixed Error Scenarios in Execute', () => {
    it('handles network error followed by success', async () => {
      const fn = jest.fn()
        .mockImplementationOnce(() => Promise.reject(new Error('ECONNREFUSED')))
        .mockImplementationOnce(() => Promise.resolve('success'))

      const result = await retryStrategy.execute(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('handles 429 error followed by success', async () => {
      const fn = jest.fn()
        .mockImplementationOnce(() => Promise.reject({ response: { status: 429 } }))
        .mockImplementationOnce(() => Promise.resolve('success'))

      const result = await retryStrategy.execute(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('handles server error followed by success', async () => {
      const fn = jest.fn()
        .mockImplementationOnce(() => Promise.reject({ response: { status: 503 } }))
        .mockImplementationOnce(() => Promise.resolve('success'))

      const result = await retryStrategy.execute(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('handles multiple different error types before success', async () => {
      const fn = jest.fn()
        .mockImplementationOnce(() => Promise.reject(new Error('ECONNREFUSED')))
        .mockImplementationOnce(() => Promise.reject({ response: { status: 429 } }))
        .mockImplementationOnce(() => Promise.resolve('success'))

      const result = await retryStrategy.execute(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('throws after exhausting retries with mixed errors', async () => {
      const fn = jest.fn()
        .mockImplementationOnce(() => Promise.reject(new Error('ECONNREFUSED')))
        .mockImplementationOnce(() => Promise.reject({ response: { status: 500 } }))
        .mockImplementationOnce(() => Promise.reject({ response: { status: 429 } }))
        .mockImplementationOnce(() => Promise.reject(new Error('final error')))

      await expect(retryStrategy.execute(fn)).rejects.toEqual(new Error('final error'))
      expect(fn).toHaveBeenCalledTimes(4)
    })
  })

  describe('Exponential Backoff Edge Cases', () => {
    it('handles zero retry count correctly', () => {
      const delay = retryStrategy.getRetryDelay(0)

      expect(delay).toBe(100)
    })

    it('calculates increasing delays with backoff multiplier', () => {
      const delay0 = retryStrategy.getRetryDelay(0)
      const delay1 = retryStrategy.getRetryDelay(1)
      const delay2 = retryStrategy.getRetryDelay(2)
      const delay3 = retryStrategy.getRetryDelay(3)

      expect(delay0).toBe(100)
      expect(delay1).toBe(200)
      expect(delay2).toBe(400)
      expect(delay3).toBe(800)
    })

    it('caps delay at maxDelay value', () => {
      const highRetryCount = 20
      const delay = retryStrategy.getRetryDelay(highRetryCount)

      expect(delay).toBe(10000)
    })

    it('produces different delays with jitter enabled', () => {
      const retryWithJitter = new RetryStrategy({
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitter: true
      })

      const delays = Array(10).fill(null).map(() =>
        retryWithJitter.getRetryDelay(1)
      )

      const uniqueDelays = new Set(delays)
      expect(uniqueDelays.size).toBeGreaterThan(1)

      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(100)
        expect(delay).toBeLessThanOrEqual(300)
      })
    })

    it('jitter range is 50-150% of base delay', () => {
      const retryWithJitter = new RetryStrategy({
        jitter: true,
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 1
      })

      const delays = Array(100).fill(null).map(() =>
        retryWithJitter.getRetryDelay(0)
      )

      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(500)
        expect(delay).toBeLessThanOrEqual(1500)
      })
    })
  })

  describe('Max Retries Boundary Conditions', () => {
    it('stops retrying exactly at maxRetries', () => {
      const retryWithMax2 = new RetryStrategy({ maxRetries: 2 })

      for (let i = 0; i < 5; i++) {
        const shouldRetry = retryWithMax2.shouldRetry({ response: { status: 500 } }, i)
        if (i < 2) {
          expect(shouldRetry).toBe(true)
        } else {
          expect(shouldRetry).toBe(false)
        }
      }
    })

    it('handles zero maxRetries', () => {
      const noRetryStrategy = new RetryStrategy({ maxRetries: 0 })

      expect(noRetryStrategy.shouldRetry({ response: { status: 500 } }, 0)).toBe(false)
    })

    it('handles very high maxRetries', () => {
      const highRetryStrategy = new RetryStrategy({ maxRetries: 100 })

      expect(highRetryStrategy.shouldRetry({ response: { status: 500 } }, 50)).toBe(true)
      expect(highRetryStrategy.shouldRetry({ response: { status: 500 } }, 99)).toBe(true)
      expect(highRetryStrategy.shouldRetry({ response: { status: 500 } }, 100)).toBe(false)
    })
  })

  describe('Error Object Shape Variations', () => {
    it('handles error without response property', () => {
      const error = new Error('Generic error')

      expect(retryStrategy.shouldRetry(error, 0)).toBe(false)
    })

    it('handles error with null response', () => {
      const error = { response: null }

      expect(retryStrategy.shouldRetry(error, 0)).toBe(false)
    })

    it('handles error with undefined status', () => {
      const error = { response: {} }

      expect(retryStrategy.shouldRetry(error, 0)).toBe(false)
    })

    it('handles error with status 0 (network error)', () => {
      const error = { response: { status: 0 } }

      expect(retryStrategy.shouldRetry(error, 0)).toBe(false)
    })

    it('handles error object that is not instance of Error', () => {
      const error = 'string error'

      expect(retryStrategy.shouldRetry(error, 0)).toBe(false)
    })
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
