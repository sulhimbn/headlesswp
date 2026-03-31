export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  dependencies?: Set<string>;
  dependents?: Set<string>;
}

export interface CacheExportEntry {
  key: string;
  data: unknown;
  ttl: number;
  timestamp: number;
}

export interface ExportCacheResult {
  success: boolean;
  version: string;
  exportedAt: string;
  entryCount: number;
  entries?: CacheExportEntry[];
  error?: string;
}

export interface ImportCacheResult {
  success: boolean;
  imported: number;
  skipped: number;
  error?: string;
}

export interface CacheTelemetry {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  cascadeInvalidations: number;
  dependencyRegistrations: number;
}
