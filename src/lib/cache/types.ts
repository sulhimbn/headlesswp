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

export interface CacheExportData {
  version: string;
  exportedAt: string;
  entries: Array<{
    key: string;
    data: unknown;
    timestamp: number;
    ttl: number;
    dependencies: string[];
  }>;
  stats: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
  };
}
