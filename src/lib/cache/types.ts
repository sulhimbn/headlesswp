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
  prefix?: string;
  defaultTtl?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  family?: number;
  connectTimeout?: number;
  maxRetriesPerRequest?: number;
}

export interface ICacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T, ttl: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clearAll(): Promise<void>;
  getKeysByPattern(pattern: string): Promise<string[]>;
  healthCheck(): Promise<boolean | CacheStoreHealth>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  invalidateWithDependents?(key: string): Promise<number>;
  registerDependencies?(key: string, dependencies: string[]): Promise<void>;
  getDependencies?(key: string): Promise<{ dependencies: string[]; dependents: string[] }>;
}

export interface CacheStoreHealth {
  healthy: boolean;
  latencyMs?: number;
  error?: string;
}
