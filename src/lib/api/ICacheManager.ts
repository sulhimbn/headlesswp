import type { CacheStatistics, PerformanceMetrics } from '@/lib/cache/cacheMetricsCalculator';

export interface ICacheManager {
  get<T>(key: string): T | null | Promise<T | null>;
  set<T>(key: string, data: T, ttl: number, dependencies?: string[]): void | Promise<void>;
  delete(key: string): boolean | Promise<boolean>;
  invalidate(key: string): void | Promise<void>;
  clearAll(): void | Promise<void>;
  clearPattern(pattern: string): void | Promise<void>;
  getStats(): CacheStatistics | Promise<CacheStatistics>;
  getPerformanceMetrics(): PerformanceMetrics | Promise<PerformanceMetrics>;
  cleanup(): number | Promise<number>;
  cleanupOrphanDependencies(): number | Promise<number>;
  resetStats(): void;
  getMemoryUsage(): number;
  invalidateByEntityType(entityType: 'post' | 'posts' | 'category' | 'categories' | 'tag' | 'tags' | 'media' | 'author'): number | Promise<number>;
  getKeysByPattern(pattern: string): string[] | Promise<string[]>;
  getDependencies(key: string): { dependencies: string[]; dependents: string[] } | Promise<{ dependencies: string[]; dependents: string[] }>;
  clear(pattern?: string): void | Promise<void>;
}
