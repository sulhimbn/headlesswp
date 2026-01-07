import { createApiError, isRetryableError, shouldTriggerCircuitBreaker, shouldRetryRateLimitError, ApiErrorType } from '@/lib/api/errors'
import { AxiosError } from 'axios'

describe('Error Handling', () => {
  describe('isRetryableError', () => {
    it('returns true for retryable errors', () => {
      const error = {
        type: ApiErrorType.NETWORK_ERROR,
        message: 'Network error',
        retryable: true,
        timestamp: new Date().toISOString()
      }

      expect(isRetryableError(error)).toBe(true)
    })

    it('returns false for non-retryable errors', () => {
      const error = {
        type: ApiErrorType.CLIENT_ERROR,
        message: 'Client error',
        retryable: false,
        timestamp: new Date().toISOString()
      }

      expect(isRetryableError(error)).toBe(false)
    })

    it('handles all retryable error types', () => {
      const retryableErrorTypes = [
        ApiErrorType.NETWORK_ERROR,
        ApiErrorType.TIMEOUT_ERROR,
        ApiErrorType.RATE_LIMIT_ERROR,
        ApiErrorType.SERVER_ERROR
      ]

      retryableErrorTypes.forEach(errorType => {
        const error = {
          type: errorType,
          message: `${errorType} message`,
          retryable: true,
          timestamp: new Date().toISOString()
        }

        expect(isRetryableError(error)).toBe(true)
      })
    })

    it('handles all non-retryable error types', () => {
      const nonRetryableErrorTypes = [
        ApiErrorType.CLIENT_ERROR,
        ApiErrorType.CIRCUIT_BREAKER_OPEN,
        ApiErrorType.UNKNOWN_ERROR
      ]

      nonRetryableErrorTypes.forEach(errorType => {
        const error = {
          type: errorType,
          message: `${errorType} message`,
          retryable: false,
          timestamp: new Date().toISOString()
        }

        expect(isRetryableError(error)).toBe(false)
      })
    })
  })

  describe('shouldRetryRateLimitError', () => {
    it('returns true for rate limit errors', () => {
      const error = {
        type: ApiErrorType.RATE_LIMIT_ERROR,
        message: 'Rate limit exceeded',
        retryable: true,
        timestamp: new Date().toISOString()
      }

      expect(shouldRetryRateLimitError(error)).toBe(true)
    })

    it('returns false for non-rate limit errors', () => {
      const error = {
        type: ApiErrorType.SERVER_ERROR,
        message: 'Server error',
        retryable: true,
        timestamp: new Date().toISOString()
      }

      expect(shouldRetryRateLimitError(error)).toBe(false)
    })

    it('returns false for network errors', () => {
      const error = {
        type: ApiErrorType.NETWORK_ERROR,
        message: 'Network error',
        retryable: true,
        timestamp: new Date().toISOString()
      }

      expect(shouldRetryRateLimitError(error)).toBe(false)
    })

    it('returns false for timeout errors', () => {
      const error = {
        type: ApiErrorType.TIMEOUT_ERROR,
        message: 'Timeout error',
        retryable: true,
        timestamp: new Date().toISOString()
      }

      expect(shouldRetryRateLimitError(error)).toBe(false)
    })

    it('returns false for client errors', () => {
      const error = {
        type: ApiErrorType.CLIENT_ERROR,
        message: 'Client error',
        retryable: false,
        timestamp: new Date().toISOString()
      }

      expect(shouldRetryRateLimitError(error)).toBe(false)
    })

    it('returns false for circuit breaker open errors', () => {
      const error = {
        type: ApiErrorType.CIRCUIT_BREAKER_OPEN,
        message: 'Circuit breaker open',
        retryable: false,
        timestamp: new Date().toISOString()
      }

      expect(shouldRetryRateLimitError(error)).toBe(false)
    })

    it('returns false for unknown errors', () => {
      const error = {
        type: ApiErrorType.UNKNOWN_ERROR,
        message: 'Unknown error',
        retryable: false,
        timestamp: new Date().toISOString()
      }

      expect(shouldRetryRateLimitError(error)).toBe(false)
    })
  })

  describe('createApiError', () => {
    describe('AxiosError handling', () => {
      it('creates rate limit error from 429 status without retry-after header', () => {
        const axiosError = new AxiosError('Too many requests') as any
        axiosError.response = {
          status: 429,
          headers: {}
        }

        const apiError = createApiError(axiosError, '/api/posts')

        expect(apiError.type).toBe(ApiErrorType.RATE_LIMIT_ERROR)
        expect(apiError.message).toBe('Rate limit exceeded. Too many requests.')
        expect(apiError.statusCode).toBe(429)
        expect(apiError.retryable).toBe(true)
        expect(apiError.endpoint).toBe('/api/posts')
        expect(apiError.originalError).toBe(axiosError)
      })

      it('creates rate limit error from 429 status with retry-after header', () => {
        const axiosError = new AxiosError('Too many requests') as any
        axiosError.response = {
          status: 429,
          headers: {
            'retry-after': '60'
          }
        }

        const apiError = createApiError(axiosError, '/api/posts')

        expect(apiError.type).toBe(ApiErrorType.RATE_LIMIT_ERROR)
        expect(apiError.message).toBe('Rate limit exceeded. Too many requests. Please wait 60 seconds before retrying.')
        expect(apiError.statusCode).toBe(429)
        expect(apiError.retryable).toBe(true)
      })

      it('creates server error from 500 status', () => {
        const axiosError = new AxiosError('Internal server error') as any
        axiosError.response = {
          status: 500,
          headers: {}
        }

        const apiError = createApiError(axiosError, '/api/posts')

        expect(apiError.type).toBe(ApiErrorType.SERVER_ERROR)
        expect(apiError.message).toBe('Server error: 500 Internal server error')
        expect(apiError.statusCode).toBe(500)
        expect(apiError.retryable).toBe(true)
      })

      it('creates server error from 502 status', () => {
        const axiosError = new AxiosError('Bad gateway') as any
        axiosError.response = {
          status: 502,
          headers: {}
        }

        const apiError = createApiError(axiosError)

        expect(apiError.type).toBe(ApiErrorType.SERVER_ERROR)
        expect(apiError.statusCode).toBe(502)
        expect(apiError.retryable).toBe(true)
      })

      it('creates server error from 503 status', () => {
        const axiosError = new AxiosError('Service unavailable') as any
        axiosError.response = {
          status: 503,
          headers: {}
        }

        const apiError = createApiError(axiosError)

        expect(apiError.type).toBe(ApiErrorType.SERVER_ERROR)
        expect(apiError.statusCode).toBe(503)
        expect(apiError.retryable).toBe(true)
      })

      it('creates client error from 400 status', () => {
        const axiosError = new AxiosError('Bad request') as any
        axiosError.response = {
          status: 400,
          headers: {}
        }

        const apiError = createApiError(axiosError, '/api/posts')

        expect(apiError.type).toBe(ApiErrorType.CLIENT_ERROR)
        expect(apiError.message).toBe('Client error: 400 Bad request')
        expect(apiError.statusCode).toBe(400)
        expect(apiError.retryable).toBe(false)
      })

      it('creates client error from 404 status', () => {
        const axiosError = new AxiosError('Not found') as any
        axiosError.response = {
          status: 404,
          headers: {}
        }

        const apiError = createApiError(axiosError)

        expect(apiError.type).toBe(ApiErrorType.CLIENT_ERROR)
        expect(apiError.statusCode).toBe(404)
        expect(apiError.retryable).toBe(false)
      })

      it('creates client error from 403 status', () => {
        const axiosError = new AxiosError('Forbidden') as any
        axiosError.response = {
          status: 403,
          headers: {}
        }

        const apiError = createApiError(axiosError)

        expect(apiError.type).toBe(ApiErrorType.CLIENT_ERROR)
        expect(apiError.statusCode).toBe(403)
        expect(apiError.retryable).toBe(false)
      })
    })

    describe('Generic Error handling', () => {
      it('creates timeout error from timeout message', () => {
        const error = new Error('Request timeout: Server took too long to respond')

        const apiError = createApiError(error, '/api/posts')

        expect(apiError.type).toBe(ApiErrorType.TIMEOUT_ERROR)
        expect(apiError.message).toBe('Request timeout: Server took too long to respond')
        expect(apiError.retryable).toBe(true)
        expect(apiError.endpoint).toBe('/api/posts')
      })

      it('creates timeout error from ETIMEDOUT', () => {
        const error = new Error('ETIMEDOUT')

        const apiError = createApiError(error)

        expect(apiError.type).toBe(ApiErrorType.TIMEOUT_ERROR)
        expect(apiError.retryable).toBe(true)
      })

      it('creates network error from ENOTFOUND message', () => {
        const error = new Error('ENOTFOUND')

        const apiError = createApiError(error)

        expect(apiError.type).toBe(ApiErrorType.NETWORK_ERROR)
        expect(apiError.message).toBe('Network error: Unable to connect to server')
        expect(apiError.retryable).toBe(true)
      })

      it('creates network error from ECONNREFUSED message', () => {
        const error = new Error('ECONNREFUSED')

        const apiError = createApiError(error)

        expect(apiError.type).toBe(ApiErrorType.NETWORK_ERROR)
        expect(apiError.retryable).toBe(true)
      })

      it('creates network error from generic network message', () => {
        const error = new Error('Network error occurred')

        const apiError = createApiError(error)

        expect(apiError.type).toBe(ApiErrorType.NETWORK_ERROR)
        expect(apiError.retryable).toBe(true)
      })

      it('handles generic Error with response property (429 status)', () => {
        const error = new Error('Rate limited') as any
        error.response = {
          status: 429,
          headers: {
            'retry-after': '30'
          }
        }

        const apiError = createApiError(error)

        expect(apiError.type).toBe(ApiErrorType.RATE_LIMIT_ERROR)
        expect(apiError.message).toBe('Rate limit exceeded. Too many requests. Please wait 30 seconds before retrying.')
        expect(apiError.statusCode).toBe(429)
        expect(apiError.retryable).toBe(true)
      })

      it('handles generic Error with response property (500 status)', () => {
        const error = new Error('Server error') as any
        error.response = {
          status: 500,
          headers: {}
        }

        const apiError = createApiError(error)

        expect(apiError.type).toBe(ApiErrorType.SERVER_ERROR)
        expect(apiError.statusCode).toBe(500)
        expect(apiError.retryable).toBe(true)
      })

      it('handles generic Error with response property (400 status)', () => {
        const error = new Error('Client error') as any
        error.response = {
          status: 400,
          headers: {}
        }

        const apiError = createApiError(error)

        expect(apiError.type).toBe(ApiErrorType.CLIENT_ERROR)
        expect(apiError.statusCode).toBe(400)
        expect(apiError.retryable).toBe(false)
      })

      it('creates unknown error for non-error objects', () => {
        const error = 'string error' as unknown

        const apiError = createApiError(error)

        expect(apiError.type).toBe(ApiErrorType.UNKNOWN_ERROR)
        expect(apiError.message).toBe('Unknown error occurred')
        expect(apiError.retryable).toBe(false)
      })

      it('creates unknown error for null', () => {
        const error = null as unknown

        const apiError = createApiError(error)

        expect(apiError.type).toBe(ApiErrorType.UNKNOWN_ERROR)
        expect(apiError.message).toBe('Unknown error occurred')
        expect(apiError.retryable).toBe(false)
      })

      it('creates unknown error for undefined', () => {
        const error = undefined as unknown

        const apiError = createApiError(error)

        expect(apiError.type).toBe(ApiErrorType.UNKNOWN_ERROR)
        expect(apiError.message).toBe('Unknown error occurred')
        expect(apiError.retryable).toBe(false)
      })

      it('creates unknown error for numeric error', () => {
        const error = 500 as unknown

        const apiError = createApiError(error)

        expect(apiError.type).toBe(ApiErrorType.UNKNOWN_ERROR)
        expect(apiError.message).toBe('Unknown error occurred')
        expect(apiError.retryable).toBe(false)
      })

      it('creates unknown error for generic error object', () => {
        const error = new Error('Some generic error')

        const apiError = createApiError(error, '/api/posts')

        expect(apiError.type).toBe(ApiErrorType.UNKNOWN_ERROR)
        expect(apiError.message).toBe('Some generic error')
        expect(apiError.retryable).toBe(false)
        expect(apiError.endpoint).toBe('/api/posts')
      })
    })

    describe('ApiErrorImpl handling', () => {
      it('returns existing ApiErrorImpl instance', () => {
        const originalError = createApiError(new Error('test'))
        const apiError = createApiError(originalError)

        expect(apiError).toBe(originalError)
      })

      it('preserves all properties when returning existing ApiErrorImpl', () => {
        const originalError = createApiError(new Error('test'), '/api/posts')
        originalError.statusCode = 404

        const apiError = createApiError(originalError)

        expect(apiError).toBe(originalError)
        expect(apiError.endpoint).toBe('/api/posts')
        expect(apiError.statusCode).toBe(404)
      })
    })

    describe('Edge cases', () => {
      it('handles AxiosError without response property with unknown message', () => {
        const axiosError = new AxiosError('Unknown axios error') as any

        const apiError = createApiError(axiosError)

        expect(apiError.type).toBe(ApiErrorType.UNKNOWN_ERROR)
        expect(apiError.message).toBe('Unknown axios error')
      })

      it('handles generic Error with missing response property', () => {
        const error = new Error('Some error') as any
        delete error.response

        const apiError = createApiError(error)

        expect(apiError.type).toBe(ApiErrorType.UNKNOWN_ERROR)
        expect(apiError.message).toBe('Some error')
      })

      it('includes original error in apiError', () => {
        const originalError = new Error('Original error')
        const apiError = createApiError(originalError, '/api/posts')

        expect(apiError.originalError).toBe(originalError)
      })

      it('generates valid ISO timestamp', () => {
        const beforeDate = new Date()
        const apiError = createApiError(new Error('test'))
        const afterDate = new Date()

        const errorDate = new Date(apiError.timestamp)
        expect(errorDate.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime())
        expect(errorDate.getTime()).toBeLessThanOrEqual(afterDate.getTime())
      })

      it('includes endpoint when provided', () => {
        const apiError = createApiError(new Error('test'), '/api/posts')

        expect(apiError.endpoint).toBe('/api/posts')
      })

      it('omits endpoint when not provided', () => {
        const apiError = createApiError(new Error('test'))

        expect(apiError.endpoint).toBeUndefined()
      })
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

    it('does not trigger on unknown errors', () => {
      const error = {
        type: ApiErrorType.UNKNOWN_ERROR,
        message: 'Unknown error',
        retryable: false,
        timestamp: new Date().toISOString()
      }

      expect(shouldTriggerCircuitBreaker(error)).toBe(false)
    })

    it('does not trigger on circuit breaker open errors', () => {
      const error = {
        type: ApiErrorType.CIRCUIT_BREAKER_OPEN,
        message: 'Circuit breaker open',
        retryable: false,
        timestamp: new Date().toISOString()
      }

      expect(shouldTriggerCircuitBreaker(error)).toBe(false)
    })
  })
})
