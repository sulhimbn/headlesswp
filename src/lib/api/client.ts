import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError, AxiosRequestHeaders } from 'axios'
import {
  WORDPRESS_API_BASE_URL,
  WORDPRESS_SITE_URL,
  API_TIMEOUT,
  MAX_RETRIES,
  SKIP_RETRIES,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  CIRCUIT_BREAKER_FAILURE_THRESHOLD,
  CIRCUIT_BREAKER_RECOVERY_TIMEOUT,
  CIRCUIT_BREAKER_SUCCESS_THRESHOLD,
  RETRY_INITIAL_DELAY,
  RETRY_MAX_DELAY,
  RETRY_BACKOFF_MULTIPLIER
} from './config'
import { CircuitBreaker, CircuitState } from './circuitBreaker'
import { RetryStrategy } from './retryStrategy'
import { RateLimiterManager } from './rateLimiter'
import { createApiError, ApiError, shouldTriggerCircuitBreaker } from './errors'
import { HealthChecker, HealthCheckResult } from './healthCheck'
import { logger } from '@/lib/utils/logger'
import { createMiddlewareManager, RequestMiddleware, ResponseMiddleware, RequestContext, ResponseContext } from './middleware'

function getApiUrl(path: string): string {
  return `${WORDPRESS_SITE_URL}/index.php?rest_route=${path}`
}

const circuitBreaker = new CircuitBreaker({
  failureThreshold: CIRCUIT_BREAKER_FAILURE_THRESHOLD,
  recoveryTimeout: CIRCUIT_BREAKER_RECOVERY_TIMEOUT,
  successThreshold: CIRCUIT_BREAKER_SUCCESS_THRESHOLD,
  onStateChange: (state) => {
    logger.warn(`CircuitBreaker state changed to: ${state}`, undefined, { module: 'CircuitBreaker' })
  }
})

const retryStrategy = new RetryStrategy({
  maxRetries: MAX_RETRIES,
  initialDelay: RETRY_INITIAL_DELAY,
  maxDelay: RETRY_MAX_DELAY,
  backoffMultiplier: RETRY_BACKOFF_MULTIPLIER,
  jitter: true
})

const rateLimiterManager = new RateLimiterManager({
  maxRequests: RATE_LIMIT_MAX_REQUESTS,
  windowMs: RATE_LIMIT_WINDOW_MS,
})

// Placeholder for health checker functions - will be set after apiClient is created
let checkApiHealthFn: (() => Promise<HealthCheckResult | null>) | null = null;

const middlewareManager = createMiddlewareManager();

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
        logger.warn('Circuit in HALF_OPEN state, performing health check...', undefined, { module: 'APIClient' })

        const healthResult = await checkApiHealthFn?.()
        if (healthResult && !healthResult.healthy) {
          logger.warn('Health check failed, preventing request', undefined, { module: 'APIClient' })
          const healthError = createApiError(
            new Error(`Health check failed: ${healthResult.message}. Service still recovering.`),
            config.url
          )
          return Promise.reject(healthError)
        }

        if (healthResult) {
          logger.warn(`Health check passed (${healthResult.latency}ms), allowing request`, undefined, { module: 'APIClient' })
        }
      }

      const startTime = Date.now();
      const requestContext: RequestContext = {
        url: config.url || '',
        method: config.method?.toUpperCase() || 'GET',
        headers: config.headers as Record<string, string> || {},
        timestamp: startTime
      };

      const processedContext = await middlewareManager.executeRequestMiddlewares(requestContext);

      if (processedContext.headers) {
        Object.entries(processedContext.headers).forEach(([key, value]) => {
          if (config.headers instanceof axios.AxiosHeaders) {
            config.headers.set(key, value);
          } else {
            (config.headers as Record<string, string>)[key] = value;
          }
        });
      }

      return config
    },
    (error: AxiosError) => Promise.reject(error)
  )

  api.interceptors.response.use(
    async (response) => {
      circuitBreaker.recordSuccess()

      const duration = Date.now() - (parseInt(response.config.headers['X-Request-Start-Time'] as string) || Date.now());
      const responseContext: ResponseContext = {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
        duration,
        timestamp: Date.now()
      };

      await middlewareManager.executeResponseMiddlewares(responseContext);

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

        logger.warn(
          `Retrying request to ${endpoint} (attempt ${config._retryCount}/${MAX_RETRIES}) after ${Math.round(delay)}ms...`,
          undefined,
          { module: 'APIClient' }
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

// Create health checker instance with apiClient injected (Dependency Injection)
const healthChecker = new HealthChecker(apiClient)

// Set health check function for circuit breaker interceptor
checkApiHealthFn = () => healthChecker.check()

// Export health checker functions
export async function checkApiHealth() {
  return healthChecker.check()
}

export async function checkApiHealthWithTimeout(timeout: number = API_TIMEOUT) {
  return healthChecker.checkWithTimeout(timeout)
}

export async function checkApiHealthRetry(maxAttempts: number = MAX_RETRIES, delayMs: number = RETRY_INITIAL_DELAY) {
  return healthChecker.checkRetry(maxAttempts, delayMs)
}

export function getLastHealthCheck() {
  return healthChecker.getLastCheck()
}

export { getApiUrl, circuitBreaker, retryStrategy, rateLimiterManager, healthChecker }
export type { ApiError }
export { createLoggingMiddleware, createCachingHeaderMiddleware, createRequestTimingMiddleware } from './middleware'
export { createMiddlewareManager } from './middleware'
export type { RequestMiddleware, ResponseMiddleware, RequestContext, ResponseContext } from './middleware'

export function registerRequestMiddleware(middleware: RequestMiddleware, name?: string) {
  middlewareManager.registerRequestMiddleware(middleware, name);
}

export function registerResponseMiddleware(middleware: ResponseMiddleware, name?: string) {
  middlewareManager.registerResponseMiddleware(middleware, name);
}

export function clearMiddlewares() {
  middlewareManager.clearMiddlewares();
}

export function getRegisteredMiddlewares() {
  return middlewareManager.getRegisteredMiddlewares();
}
