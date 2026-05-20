import { ApiErrorImpl, ApiErrorType } from './errors'
import { TIME_CONSTANTS } from './config'

export interface RateLimitCoreOptions {
  maxRequests: number
  windowMs: number
}

export interface RateLimitCoreState {
  requestTimes: number[]
  lastReset: number
}

export interface RateLimitCoreInfo {
  remainingRequests: number
  resetTime: number
  windowMs: number
  maxRequests: number
}

export function cleanupRequests(requestTimes: number[], windowMs: number): number[] {
  const now = Date.now()
  return requestTimes.filter(timestamp => now - timestamp < windowMs)
}

export function calculateWaitTime(oldestRequest: number, now: number, windowMs: number): number {
  return oldestRequest + windowMs - now
}

export function createRateLimitError(waitTime: number): Error {
  return new ApiErrorImpl(
    ApiErrorType.RATE_LIMIT_ERROR,
    `Rate limit exceeded. Too many requests. Please try again in ${Math.ceil(waitTime / TIME_CONSTANTS.SECOND_IN_MS)} seconds.`,
    429,
    true
  )
}

export function refillTokens(lastReset: number, windowMs: number): number {
  const now = Date.now()
  return now - lastReset >= windowMs ? now : lastReset
}

export function waitForCheckSync(checking: boolean): void {
  while (checking) {
    const start = Date.now()
    while (checking && Date.now() - start < 1) {
      if (!checking) break
    }
    if (checking) {
      throw new Error('Timeout waiting for rate limiter check to complete')
    }
  }
}