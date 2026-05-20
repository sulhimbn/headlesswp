export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  dependencies?: Set<string>;
  dependents?: Set<string>;
}

export interface CacheTelemetry {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  cascadeInvalidations: number;
  dependencyRegistrations: number;
}

export interface CacheStoreOptions {
  redisUrl?: string;
  keyPrefix?: string;
  defaultTtl?: number;
}

export interface ICacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T, ttl: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(pattern?: string): Promise<string[]>;
  healthCheck(): Promise<boolean>;
  close(): Promise<void>;
}

export type CacheStoreType = 'memory' | 'redis';
