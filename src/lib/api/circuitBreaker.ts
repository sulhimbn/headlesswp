import { logger } from '@/lib/utils/logger'
import {
  CIRCUIT_BREAKER_FAILURE_THRESHOLD,
  CIRCUIT_BREAKER_RECOVERY_TIMEOUT,
  CIRCUIT_BREAKER_SUCCESS_THRESHOLD
} from './config'
import {
  recordCircuitBreakerStateChange,
  recordCircuitBreakerFailure,
  recordCircuitBreakerSuccess
} from './telemetry'

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold?: number
  recoveryTimeout?: number
  successThreshold?: number
  onStateChange?: (state: CircuitState) => void
  endpoint?: string
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount: number = 0
  private successCount: number = 0
  private lastFailureTime: number = 0
  private nextAttemptTime: number = 0
  private failureThreshold: number
  private recoveryTimeout: number
  private successThreshold: number
  private onStateChange?: (state: CircuitState) => void
  private endpoint?: string

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? CIRCUIT_BREAKER_FAILURE_THRESHOLD
    this.recoveryTimeout = options.recoveryTimeout ?? CIRCUIT_BREAKER_RECOVERY_TIMEOUT
    this.successThreshold = options.successThreshold ?? CIRCUIT_BREAKER_SUCCESS_THRESHOLD
    this.onStateChange = options.onStateChange
    this.endpoint = options.endpoint
  }

  getState(): CircuitState {
    return this.state
  }

  private setState(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState
      this.onStateChange?.(newState)

      recordCircuitBreakerStateChange({
        state: newState,
        failureCount: this.failureCount,
        successCount: this.successCount,
        lastFailureTime: this.lastFailureTime || null,
        nextAttemptTime: this.nextAttemptTime || null,
        endpoint: this.endpoint
      })
    }
  }

  isOpen(): boolean {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() >= this.nextAttemptTime) {
        this.setState(CircuitState.HALF_OPEN)
        this.successCount = 0
        return false
      }
      return true
    }
    return false
  }

  onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= this.successThreshold) {
        this.failureCount = 0
        this.setState(CircuitState.CLOSED)
      }
    } else {
      this.failureCount = Math.max(0, this.failureCount - 1)
    }

    recordCircuitBreakerSuccess({
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime || null,
      nextAttemptTime: this.nextAttemptTime || null,
      endpoint: this.endpoint
    })
  }

  onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    recordCircuitBreakerFailure({
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime || null,
      nextAttemptTime: this.nextAttemptTime || null,
      endpoint: this.endpoint
    })

    if (this.failureCount >= this.failureThreshold) {
      this.nextAttemptTime = Date.now() + this.recoveryTimeout
      this.setState(CircuitState.OPEN)
      logger.warn(
        `Circuit OPEN after ${this.failureCount} failures. Will retry at ${new Date(this.nextAttemptTime).toISOString()}`,
        undefined,
        { module: 'CircuitBreaker' }
      )
    }
  }

  recordSuccess(): void {
    this.onSuccess()
  }

  recordFailure(): void {
    this.onFailure()
  }

  reset(): void {
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
    this.nextAttemptTime = 0
    this.setState(CircuitState.CLOSED)
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      failureThreshold: this.failureThreshold,
      recoveryTimeout: this.recoveryTimeout,
      successThreshold: this.successThreshold
    }
  }
}
