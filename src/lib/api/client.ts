import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios'
import { WORDPRESS_API_BASE_URL, API_TIMEOUT, MAX_RETRIES, SKIP_RETRIES, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from './config'
import { CircuitBreaker, CircuitState } from './circuitBreaker'
import { RetryStrategy } from './retryStrategy'
import { RateLimiterManager } from './rateLimiter'
import { createApiError, ApiError, shouldTriggerCircuitBreaker } from './errors'
import { checkApiHealth, checkApiHealthRetry, getLastHealthCheck } from './healthCheck'

function getApiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost:8080'
  return `${baseUrl}/index.php?rest_route=${path}`
}

const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 60000,
  successThreshold: 2,
  onStateChange: (state) => {
    console.warn(`[CircuitBreaker] State changed to: ${state}`)
  }
})

const retryStrategy = new RetryStrategy({
  maxRetries: MAX_RETRIES,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true
})

const rateLimiterManager = new RateLimiterManager({
  maxRequests: RATE_LIMIT_MAX_REQUESTS,
  windowMs: RATE_LIMIT_WINDOW_MS,
})

const createApiClient = (): AxiosInstance => {
  const api = axios.create({
    baseURL: WORDPRESS_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: API_TIMEOUT,
  })

  api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      if (!config.signal) {
        const controller = new AbortController()
        config.signal = controller.signal
      }

      try {
        await rateLimiterManager.checkLimit()
      } catch (error) {
        return Promise.reject(error)
      }

      const circuitBreakerState = circuitBreaker.getState()
      if (circuitBreakerState === CircuitState.HALF_OPEN) {
        console.log('[APIClient] Circuit in HALF_OPEN state, performing health check...')

        const healthResult = await checkApiHealth()
        if (!healthResult.healthy) {
          console.warn('[APIClient] Health check failed, preventing request')
          const healthError = createApiError(
            new Error(`Health check failed: ${healthResult.message}. Service still recovering.`),
            config.url
          )
          return Promise.reject(healthError)
        }

        console.log(`[APIClient] Health check passed (${healthResult.latency}ms), allowing request`)
      }

      return config
    },
    (error: AxiosError) => Promise.reject(error)
  )

  api.interceptors.response.use(
    (response) => {
      circuitBreaker.recordSuccess()
      return response
    },
    async (error: AxiosError) => {
      const endpoint = error.config?.url
      const apiError = createApiError(error, endpoint)

      if (shouldTriggerCircuitBreaker(apiError)) {
        circuitBreaker.recordFailure()
      }

      if (circuitBreaker.isOpen()) {
        const circuitError = createApiError(
          new Error('Circuit breaker is OPEN. Requests are temporarily blocked.'),
          endpoint
        )
        return Promise.reject(circuitError)
      }

      if (SKIP_RETRIES) {
        return Promise.reject(apiError)
      }

      const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number }

      if (!config._retryCount) {
        config._retryCount = 0
      }

      const shouldRetry = retryStrategy.shouldRetry(error, config._retryCount)

      if (shouldRetry && config._retryCount < MAX_RETRIES) {
        config._retryCount++
        const delay = retryStrategy.getRetryDelay(config._retryCount - 1, error)

        console.warn(
          `[APIClient] Retrying request to ${endpoint} (attempt ${config._retryCount}/${MAX_RETRIES}) after ${Math.round(delay)}ms...`
        )

        await new Promise(resolve => setTimeout(resolve, delay))
        return api(config)
      }

      return Promise.reject(apiError)
    }
  )

  return api
}

export const apiClient = createApiClient()

export { getApiUrl, circuitBreaker, retryStrategy, rateLimiterManager, checkApiHealth, checkApiHealthRetry, getLastHealthCheck }
export type { ApiError }
