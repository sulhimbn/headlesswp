import type { CacheEntry, CacheTelemetry } from '@/lib/cache';
import type { CacheStatistics, PerformanceMetrics, FormattedMetrics } from '@/lib/cache/cacheMetricsCalculator';

export interface ICacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttl: number, dependencies?: string[]): void;
  delete(key: string): boolean;
  invalidate(key: string): void;
  clearAll(): void;
  clearPattern(pattern: string): void;
  getStats(): CacheStatistics;
  getPerformanceMetrics(): PerformanceMetrics;
  cleanup(): number;
  cleanupOrphanDependencies(): number;
  resetStats(): void;
  getMemoryUsage(): number;
  invalidateByEntityType(entityType: 'post' | 'posts' | 'category' | 'categories' | 'tag' | 'tags' | 'media' | 'author'): number;
  getKeysByPattern(pattern: string): string[];
  getDependencies(key: string): { dependencies: string[]; dependents: string[] };
  clear(pattern?: string): void;
}
