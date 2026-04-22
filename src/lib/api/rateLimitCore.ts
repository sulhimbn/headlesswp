export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

export interface RateLimitInfo {
  remainingRequests: number
  resetTime: number
  windowMs: number
  maxRequests: number
}

export interface RateLimitState {
  requestTimes: number[]
  lastRefill: number
}

export interface IRateLimitAdapter {
  getState(key: string): Promise<RateLimitState | null>
  setState(key: string, state: RateLimitState): Promise<void>
}

export class InMemoryRateLimitAdapter implements IRateLimitAdapter {
  private store: Map<string, RateLimitState> = new Map()

  async getState(key: string): Promise<RateLimitState | null> {
    return this.store.get(key) ?? null
  }

  async setState(key: string, state: RateLimitState): Promise<void> {
    this.store.set(key, state)
  }
}

export async function waitForCheck(checking: boolean, timeoutMs: number = 1000): Promise<void> {
  if (!checking) return

  const start = Date.now()
  while (checking && Date.now() - start < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 10))
    if (!checking) return
  }

  if (checking) {
    throw new Error('Timeout waiting for rate limiter check to complete')
  }
}

export function refillTokens(state: RateLimitState, now: number, windowMs: number): void {
  const timePassed = now - state.lastRefill
  if (timePassed >= windowMs) {
    state.lastRefill = now
    state.requestTimes = []
  }
}

export function cleanupOldRequests(state: RateLimitState, now: number, windowMs: number): void {
  state.requestTimes = state.requestTimes.filter(
    timestamp => now - timestamp < windowMs
  )
}

export function calculateRemainingRequests(
  state: RateLimitState,
  now: number,
  windowMs: number,
  maxRequests: number
): number {
  cleanupOldRequests(state, now, windowMs)
  return Math.max(0, maxRequests - state.requestTimes.length)
}

export function calculateResetTime(state: RateLimitState, windowMs: number): number {
  return state.lastRefill + windowMs
}

export function createRateLimitState(): RateLimitState {
  return {
    requestTimes: [],
    lastRefill: Date.now(),
  }
}