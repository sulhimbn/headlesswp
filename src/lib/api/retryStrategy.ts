export interface RetryStrategyOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  jitter?: boolean
}

export class RetryStrategy {
  private maxRetries: number
  private initialDelay: number
  private maxDelay: number
  private backoffMultiplier: number
  private jitter: boolean

  constructor(options: RetryStrategyOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3
    this.initialDelay = options.initialDelay ?? 1000
    this.maxDelay = options.maxDelay ?? 30000
    this.backoffMultiplier = options.backoffMultiplier ?? 2
    this.jitter = options.jitter ?? true
  }

  shouldRetry(error: unknown, retryCount: number): boolean {
    if (retryCount >= this.maxRetries) {
      return false
    }

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } }
      const status = axiosError.response?.status

      if (status === 429) {
        return true
      }

      if (status && status >= 500 && status < 600) {
        return true
      }
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      if (message.includes('timeout') || message.includes('etimedout')) {
        return retryCount < 1
      }
      if (message.includes('network') || message.includes('econnrefused')) {
        return retryCount < 1
      }
    }

    return false
  }

  getRetryDelay(retryCount: number, error?: unknown): number {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { headers?: any } }
      const errorHeaders = axiosError.response?.headers

      if (errorHeaders) {
        let retryAfterHeader: string | null | undefined

        if (typeof errorHeaders.get === 'function') {
          retryAfterHeader = errorHeaders.get('retry-after') || errorHeaders.get('Retry-After')
        } else {
          retryAfterHeader = errorHeaders['retry-after'] || errorHeaders['Retry-After']
        }

        if (retryAfterHeader) {
          const retryAfter = parseInt(retryAfterHeader, 10)
          if (!isNaN(retryAfter)) {
            return Math.min(retryAfter * 1000, this.maxDelay)
          }

          const retryAfterDate = Date.parse(retryAfterHeader)
          if (!isNaN(retryAfterDate)) {
            return Math.min(retryAfterDate - Date.now(), this.maxDelay)
          }
        }
      }
    }

    let delay = this.initialDelay * Math.pow(this.backoffMultiplier, retryCount)

    if (this.jitter) {
      delay = delay * (0.5 + Math.random())
    }

    return Math.min(delay, this.maxDelay)
  }

  async execute<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let retryCount = 0
    let lastError: unknown

    do {
      try {
        const result = await fn()
        return result
      } catch (error) {
        lastError = error

        if (!this.shouldRetry(error, retryCount)) {
          throw error
        }

        const delay = this.getRetryDelay(retryCount, error)

        if (context) {
          console.warn(
            `[RetryStrategy] ${context} failed (attempt ${retryCount + 1}/${this.maxRetries}). Retrying in ${Math.round(delay)}ms...`,
            error
          )
        }

        await this.sleep(delay)
        retryCount++
      }
    } while (retryCount <= this.maxRetries)

    throw lastError
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
