import { createApiError } from './errors';
import {
  API_TIMEOUT,
  MAX_RETRIES,
  RETRY_INITIAL_DELAY
} from './config';
import { logger } from '@/lib/utils/logger';

export interface HealthCheckResult {
  healthy: boolean;
  timestamp: string;
  latency: number;
  message: string;
  version?: string;
  error?: string;
}

interface HttpClient {
  get(url: string, config?: unknown): Promise<unknown>;
}

export class HealthChecker {
  private httpClient: HttpClient;
  private lastCheck: HealthCheckResult | null = null;
  private checkInProgress = false;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

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
      const response = await this.httpClient.get('/') as { headers?: { 'x-wordpress-api-version'?: string } };

      const latency = Date.now() - startTime;

      const result: HealthCheckResult = {
        healthy: true,
        timestamp: new Date().toISOString(),
        latency,
        message: 'WordPress API is healthy'
      };

      if (response.headers?.['x-wordpress-api-version']) {
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

  async checkRetry(maxAttempts: number = MAX_RETRIES, delayMs: number = RETRY_INITIAL_DELAY): Promise<HealthCheckResult> {
    let lastError: HealthCheckResult | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.check();

        if (result.healthy) {
          if (attempt > 1) {
            logger.warn(`Health check succeeded on attempt ${attempt}/${maxAttempts}`, undefined, { module: 'HealthCheck' });
          }
          return result;
        }

        lastError = result;

        if (attempt < maxAttempts) {
          logger.warn(`Health check failed (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`, undefined, { module: 'HealthCheck' });
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
          logger.warn(`Health check error (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`, undefined, { module: 'HealthCheck' });
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    return lastError!;
  }
}


