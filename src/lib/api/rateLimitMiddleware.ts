import { NextRequest, NextResponse } from 'next/server'
import { ApiErrorType } from './errors'
import { RATE_LIMIT } from '@/lib/constants/appConstants'

export interface ApiRouteRateLimitOptions {
  key: string
  maxRequests: number
  windowMs: number
}

const API_ROUTE_RATE_LIMITS: Record<string, ApiRouteRateLimitOptions> = {
  health: { key: 'health', maxRequests: RATE_LIMIT.HEALTH_MAX_REQUESTS, windowMs: RATE_LIMIT.DEFAULT_WINDOW_MS },
  readiness: { key: 'readiness', maxRequests: RATE_LIMIT.READINESS_MAX_REQUESTS, windowMs: RATE_LIMIT.DEFAULT_WINDOW_MS },
  metrics: { key: 'metrics', maxRequests: RATE_LIMIT.METRICS_MAX_REQUESTS, windowMs: RATE_LIMIT.DEFAULT_WINDOW_MS },
  cache: { key: 'cache', maxRequests: RATE_LIMIT.CACHE_MAX_REQUESTS, windowMs: RATE_LIMIT.DEFAULT_WINDOW_MS },
  cspReport: { key: 'csp-report', maxRequests: RATE_LIMIT.CSP_REPORT_MAX_REQUESTS, windowMs: RATE_LIMIT.DEFAULT_WINDOW_MS },
}

interface RateLimitState {
  requestTimes: number[]
  lastReset: number
}

const rateLimitState: Record<string, RateLimitState> = {}

function getRateLimitState(key: string): RateLimitState {
  if (!rateLimitState[key]) {
    rateLimitState[key] = { requestTimes: [], lastReset: Date.now() }
  }
  return rateLimitState[key]
}

function cleanupOldRequests(state: RateLimitState, windowMs: number): void {
  const now = Date.now()
  state.requestTimes = state.requestTimes.filter(
    timestamp => now - timestamp < windowMs
  )
}

async function checkRateLimit(key: string, options: ApiRouteRateLimitOptions): Promise<void> {
  const state = getRateLimitState(key)
  const now = Date.now()

  if (now - state.lastReset >= options.windowMs) {
    state.requestTimes = []
    state.lastReset = now
  }

  cleanupOldRequests(state, options.windowMs)

  if (state.requestTimes.length >= options.maxRequests) {
    const oldestRequest = state.requestTimes[0]
    const waitTime = Math.ceil((oldestRequest + options.windowMs - now) / 1000)
    throw {
      type: ApiErrorType.RATE_LIMIT_ERROR,
      message: `Rate limit exceeded. Please try again in ${waitTime} seconds.`,
      statusCode: 429,
      retryAfter: waitTime,
    }
  }

  state.requestTimes.push(now)
}

export function withApiRateLimit(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse>,
  optionsKey: keyof typeof API_ROUTE_RATE_LIMITS = 'metrics'
) {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
    const options = API_ROUTE_RATE_LIMITS[optionsKey]

    try {
      await checkRateLimit(options.key, options)

      const response = await handler(request, context)
      const state = getRateLimitState(options.key)
      const remaining = Math.max(0, options.maxRequests - state.requestTimes.length)
      const resetTime = state.lastReset + options.windowMs
      const resetSeconds = Math.ceil((resetTime - Date.now()) / 1000)

      response.headers.set('X-RateLimit-Limit', options.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', resetTime.toString())
      response.headers.set('X-RateLimit-Reset-After', resetSeconds.toString())

      return response
    } catch (error) {
      const errorObj = error as { type?: string; statusCode?: number; message?: string; retryAfter?: number }
      
      if (errorObj.type === ApiErrorType.RATE_LIMIT_ERROR) {
        const retryAfter = errorObj.retryAfter || RATE_LIMIT.DEFAULT_RETRY_AFTER_SECONDS
        return NextResponse.json(
          {
            success: false,
            error: errorObj.message || 'Rate limit exceeded',
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': options.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': (Date.now() + retryAfter * 1000).toString(),
              'X-RateLimit-Reset-After': retryAfter.toString(),
              'Retry-After': retryAfter.toString(),
            },
          }
        )
      }
      
      throw error
    }
  }
}

export function resetRateLimitState(key: string): void {
  if (rateLimitState[key]) {
    rateLimitState[key].requestTimes = []
    rateLimitState[key].lastReset = 0
  }
}

export function resetAllRateLimitState(): void {
  Object.keys(rateLimitState).forEach(key => {
    resetRateLimitState(key)
  })
}
