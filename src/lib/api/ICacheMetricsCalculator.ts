import type { CacheEntry, CacheTelemetry } from '@/lib/cache/types';
import type {
  CacheStatistics,
  PerformanceMetrics,
  FormattedMetrics,
  EfficiencyLevel
} from '@/lib/cache/cacheMetricsCalculator';

export interface ICacheMetricsCalculator {
  calculateStatistics(stats: CacheTelemetry, cacheSize: number, memoryUsageBytes: number, avgTtl: number): CacheStatistics;
  calculateAverageTtl<T>(cacheEntries: Map<string, CacheEntry<T>>): number;
  calculateEfficiencyLevel(hitRate: number): EfficiencyLevel;
  calculatePerformanceMetrics(stats: CacheStatistics): PerformanceMetrics;
  calculateMemoryUsage<T>(cacheEntries: Map<string, CacheEntry<T>>): number;
  formatMetricsForDisplay(stats: CacheStatistics): FormattedMetrics;
}
