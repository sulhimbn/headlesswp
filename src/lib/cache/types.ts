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
