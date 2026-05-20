export interface RedisConfig {
  url: string;
  enabled: boolean;
  retryStrategy?: {
    maxRetries: number;
    retryInterval: number;
  };
  keyPrefix?: string;
}

export function getRedisConfig(): RedisConfig {
  return {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true',
    retryStrategy: {
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
      retryInterval: parseInt(process.env.REDIS_RETRY_INTERVAL || '1000', 10),
    },
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'headlesswp:cache:',
  };
}

export const REDIS_CONFIG = getRedisConfig();
