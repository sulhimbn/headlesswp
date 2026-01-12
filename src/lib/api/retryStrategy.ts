import { logger } from '@/lib/utils/logger'
import {
  MAX_RETRIES,
  RETRY_INITIAL_DELAY,
  RETRY_MAX_DELAY,
  RETRY_BACKOFF_MULTIPLIER,
  TIME_CONSTANTS
} from './config'

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
    this.maxRetries = options.maxRetries ?? MAX_RETRIES
    this.initialDelay = options.initialDelay ?? RETRY_INITIAL_DELAY
    this.maxDelay = options.maxDelay ?? RETRY_MAX_DELAY
    this.backoffMultiplier = options.backoffMultiplier ?? RETRY_BACKOFF_MULTIPLIER
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

  private extractRetryAfterHeader(error?: unknown): number | null {
    if (!error || typeof error !== 'object' || !('response' in error)) {
      return null;
    }

    const axiosError = error as { response?: { headers?: Record<string, string | null> | { get: (key: string) => string | null } } }
    const errorHeaders = axiosError.response?.headers;

    if (!errorHeaders) {
      return null;
    }

    let retryAfterHeader: string | null | undefined;

    if (typeof errorHeaders.get === 'function') {
      retryAfterHeader = errorHeaders.get('retry-after') || errorHeaders.get('Retry-After');
    } else {
      const headerRecord = errorHeaders as Record<string, string | null>;
      retryAfterHeader = headerRecord['retry-after'] || headerRecord['Retry-After'];
    }

    if (!retryAfterHeader) {
      return null;
    }

    const retryAfter = parseInt(retryAfterHeader, 10);
    if (!isNaN(retryAfter)) {
      return Math.min(retryAfter * TIME_CONSTANTS.SECOND_IN_MS, this.maxDelay);
    }

    const retryAfterDate = Date.parse(retryAfterHeader);
    if (!isNaN(retryAfterDate)) {
      const delay = retryAfterDate - Date.now();
      return Math.max(Math.min(delay, this.maxDelay), 0);
    }

    return null;
  }

  private calculateBackoffDelay(retryCount: number): number {
    let delay = this.initialDelay * Math.pow(this.backoffMultiplier, retryCount);

    if (this.jitter) {
      delay = delay * (0.5 + Math.random());
    }

    return Math.min(delay, this.maxDelay);
  }

  getRetryDelay(retryCount: number, error?: unknown): number {
    const headerDelay = this.extractRetryAfterHeader(error);
    if (headerDelay !== null) {
      return headerDelay;
    }

    return this.calculateBackoffDelay(retryCount);
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
          logger.warn(
            `${context} failed (attempt ${retryCount + 1}/${this.maxRetries}). Retrying in ${Math.round(delay)}ms...`,
            error,
            { module: 'RetryStrategy' }
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
