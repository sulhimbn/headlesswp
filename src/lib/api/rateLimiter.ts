import { ApiErrorImpl, ApiErrorType } from './errors'
import { TIME_CONSTANTS } from './config'

export interface RateLimiterOptions {
  maxRequests: number
  windowMs: number
}

export interface RateLimitInfo {
  remainingRequests: number
  resetTime: number
  windowMs: number
  maxRequests: number
}

export class RateLimiter {
  private lastRefill: number
  private options: RateLimiterOptions
  private requestTimes: number[]

  constructor(options: RateLimiterOptions) {
    this.options = options
    this.lastRefill = Date.now()
    this.requestTimes = []
  }

  private refillTokens(): void {
    const now = Date.now()
    const timePassed = now - this.lastRefill

    if (timePassed >= this.options.windowMs) {
      this.lastRefill = now
      this.requestTimes = []
    }
  }

  async checkLimit(): Promise<void> {
    this.refillTokens()

    const now = Date.now()
    this.requestTimes = this.requestTimes.filter(
      timestamp => now - timestamp < this.options.windowMs
    )

    if (this.requestTimes.length >= this.options.maxRequests) {
      const oldestRequest = this.requestTimes[0]
      const waitTime = oldestRequest + this.options.windowMs - now

      throw new ApiErrorImpl(
        ApiErrorType.RATE_LIMIT_ERROR,
        `Rate limit exceeded. Too many requests. Please try again in ${Math.ceil(waitTime / TIME_CONSTANTS.SECOND_IN_MS)} seconds.`,
        429,
        true
      )
    }

    this.requestTimes.push(now)
  }

  getInfo(): RateLimitInfo {
    this.refillTokens()
    const now = Date.now()
    this.requestTimes = this.requestTimes.filter(
      timestamp => now - timestamp < this.options.windowMs
    )

    return {
      remainingRequests: Math.max(0, this.options.maxRequests - this.requestTimes.length),
      resetTime: this.lastRefill + this.options.windowMs,
      windowMs: this.options.windowMs,
      maxRequests: this.options.maxRequests,
    }
  }

  reset(): void {
    this.lastRefill = Date.now()
    this.requestTimes = []
  }
}

export class RateLimiterManager {
  private limiters: Map<string, RateLimiter>
  private defaultOptions: RateLimiterOptions

  constructor(defaultOptions: RateLimiterOptions) {
    this.defaultOptions = defaultOptions
    this.limiters = new Map()
  }

  getLimiter(key: string = 'default'): RateLimiter {
    if (!this.limiters.has(key)) {
      this.limiters.set(key, new RateLimiter(this.defaultOptions))
    }
    return this.limiters.get(key)!
  }

  async checkLimit(key: string = 'default'): Promise<void> {
    const limiter = this.getLimiter(key)
    await limiter.checkLimit()
  }

  getInfo(key: string = 'default'): RateLimitInfo {
    const limiter = this.getLimiter(key)
    return limiter.getInfo()
  }

  reset(key: string = 'default'): void {
    const limiter = this.getLimiter(key)
    limiter.reset()
  }

  resetAll(): void {
    this.limiters.clear()
  }
}
