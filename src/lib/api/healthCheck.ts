import { apiClient } from './client';
import { createApiError } from './errors';
import { API_TIMEOUT } from './config';

export interface HealthCheckResult {
  healthy: boolean;
  timestamp: string;
  latency: number;
  message: string;
  version?: string;
  error?: string;
}

export class HealthChecker {
  private lastCheck: HealthCheckResult | null = null;
  private checkInProgress = false;

  async check(): Promise<HealthCheckResult> {
    if (this.checkInProgress) {
      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        latency: 0,
        message: 'Health check already in progress'
      };
    }

    this.checkInProgress = true;
    const startTime = Date.now();

    try {
      const response = await apiClient.get('/');

      const latency = Date.now() - startTime;

      const result: HealthCheckResult = {
        healthy: true,
        timestamp: new Date().toISOString(),
        latency,
        message: 'WordPress API is healthy'
      };

      if (response.headers['x-wordpress-api-version']) {
        result.version = response.headers['x-wordpress-api-version'];
      }

      this.lastCheck = result;
      return result;
    } catch (error) {
      const latency = Date.now() - startTime;
      const apiError = createApiError(error, '/');

      const result: HealthCheckResult = {
        healthy: false,
        timestamp: new Date().toISOString(),
        latency,
        message: 'WordPress API is unhealthy',
        error: apiError.message
      };

      this.lastCheck = result;
      return result;
    } finally {
      this.checkInProgress = false;
    }
  }

  getLastCheck(): HealthCheckResult | null {
    return this.lastCheck;
  }

  async checkWithTimeout(timeout: number = API_TIMEOUT): Promise<HealthCheckResult> {
    const timeoutPromise = new Promise<HealthCheckResult>((resolve) => {
      setTimeout(() => {
        resolve({
          healthy: false,
          timestamp: new Date().toISOString(),
          latency: timeout,
          message: 'Health check timed out'
        });
      }, timeout);
    });

    return Promise.race([this.check(), timeoutPromise]);
  }

  async checkRetry(maxAttempts: number = 3, delayMs: number = 1000): Promise<HealthCheckResult> {
    let lastError: HealthCheckResult | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.check();

        if (result.healthy) {
          if (attempt > 1) {
            console.warn(`[HealthCheck] Health check succeeded on attempt ${attempt}/${maxAttempts}`);
          }
          return result;
        }

        lastError = result;

        if (attempt < maxAttempts) {
          console.warn(`[HealthCheck] Health check failed (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        lastError = {
          healthy: false,
          timestamp: new Date().toISOString(),
          latency: 0,
          message: 'Health check failed unexpectedly',
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        if (attempt < maxAttempts) {
          console.warn(`[HealthCheck] Health check error (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    return lastError!;
  }
}

export const healthChecker = new HealthChecker();

export async function checkApiHealth(): Promise<HealthCheckResult> {
  return healthChecker.check();
}

export async function checkApiHealthWithTimeout(timeout: number = API_TIMEOUT): Promise<HealthCheckResult> {
  return healthChecker.checkWithTimeout(timeout);
}

export async function checkApiHealthRetry(maxAttempts: number = 3, delayMs: number = 1000): Promise<HealthCheckResult> {
  return healthChecker.checkRetry(maxAttempts, delayMs);
}

export function getLastHealthCheck(): HealthCheckResult | null {
  return healthChecker.getLastCheck();
}
