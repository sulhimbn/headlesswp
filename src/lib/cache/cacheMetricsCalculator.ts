import { CACHE_METRICS, MEMORY } from '@/lib/constants/appConstants'
import type { ICacheMetricsCalculator } from '@/lib/api/ICacheMetricsCalculator';

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

export interface CacheStatistics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  cascadeInvalidations: number;
  dependencyRegistrations: number;
  total: number;
  hitRate: number;
  invalidationRate: number;
  size: number;
  memoryUsageBytes: number;
  avgTtl: number;
}

export type EfficiencyLevel = 'high' | 'medium' | 'low';

export interface PerformanceMetrics {
  efficiencyScore: EfficiencyLevel;
  hitRate: number;
  size: number;
  memoryUsageMB: number;
  cascadeInvalidations: number;
  dependencyRegistrations: number;
  avgTtlSeconds: number;
}

export interface FormattedMetrics {
  efficiency: EfficiencyLevel;
  hitRate: string;
  memoryUsage: string;
  avgTtl: string;
  cascadeInvalidations: number;
  dependencyRegistrations: number;
}

export class CacheMetricsCalculator implements ICacheMetricsCalculator {
  calculateStatistics(
    stats: CacheTelemetry,
    cacheSize: number,
    memoryUsageBytes: number,
    avgTtl: number
  ): CacheStatistics {
    const total = stats.hits + stats.misses;
    const hitRate = total > 0 ? (stats.hits / total) * 100 : 0;
    const invalidationRate = stats.deletes > 0
      ? (stats.cascadeInvalidations / stats.deletes) * 100
      : 0;

    return {
      ...stats,
      total,
      hitRate: Math.round(hitRate * 100) / 100,
      invalidationRate: Math.round(invalidationRate * 100) / 100,
      size: cacheSize,
      memoryUsageBytes,
      avgTtl,
    };
  }

  calculateAverageTtl<T>(
    cacheEntries: Map<string, CacheEntry<T>>
  ): number {
    if (cacheEntries.size === 0) return 0;

    let totalTtl = 0;
    cacheEntries.forEach(entry => {
      totalTtl += entry.ttl;
    });

    return Math.round(totalTtl / cacheEntries.size);
  }

  calculateEfficiencyLevel(hitRate: number): EfficiencyLevel {
    return hitRate > CACHE_METRICS.HIGH_EFFICIENCY_THRESHOLD ? 'high' : hitRate > CACHE_METRICS.MEDIUM_EFFICIENCY_THRESHOLD ? 'medium' : 'low';
  }

  calculatePerformanceMetrics(
    stats: CacheStatistics
  ): PerformanceMetrics {
    const efficiencyScore = this.calculateEfficiencyLevel(stats.hitRate);

    return {
      efficiencyScore,
      hitRate: stats.hitRate,
      size: stats.size,
      memoryUsageMB: Math.round(stats.memoryUsageBytes / MEMORY.BYTES_TO_MB * CACHE_METRICS.MEMORY_ROUNDING_FACTOR) / CACHE_METRICS.MEMORY_ROUNDING_FACTOR,
      cascadeInvalidations: stats.cascadeInvalidations,
      dependencyRegistrations: stats.dependencyRegistrations,
      avgTtlSeconds: Math.round(stats.avgTtl / CACHE_METRICS.MILLISECONDS_TO_SECONDS),
    };
  }

  calculateMemoryUsage<T>(
    cacheEntries: Map<string, CacheEntry<T>>
  ): number {
    let totalSize = 0;
    cacheEntries.forEach((entry, key) => {
      totalSize += key.length * MEMORY.BYTES_PER_CHARACTER_UTF16;
      totalSize += JSON.stringify(entry.data).length * MEMORY.BYTES_PER_CHARACTER_UTF16;
      totalSize += entry.dependencies ? entry.dependencies.size * MEMORY.PER_DEPENDENCY_ENTRY_BYTES : 0;
      totalSize += entry.dependents ? entry.dependents.size * MEMORY.PER_DEPENDENT_ENTRY_BYTES : 0;
      totalSize += MEMORY.PER_ENTRY_OVERHEAD_BYTES;
    });
    return totalSize;
  }

  formatMetricsForDisplay(stats: CacheStatistics): FormattedMetrics {
    const efficiency = this.calculateEfficiencyLevel(stats.hitRate);
    const memoryUsageMB = Math.round(stats.memoryUsageBytes / MEMORY.BYTES_TO_MB * CACHE_METRICS.MEMORY_ROUNDING_FACTOR) / CACHE_METRICS.MEMORY_ROUNDING_FACTOR;
    const avgTtlSeconds = Math.round(stats.avgTtl / CACHE_METRICS.MILLISECONDS_TO_SECONDS);

    return {
      efficiency,
      hitRate: `${stats.hitRate.toFixed(2)}%`,
      memoryUsage: `${memoryUsageMB.toFixed(2)} MB`,
      avgTtl: `${avgTtlSeconds}s`,
      cascadeInvalidations: stats.cascadeInvalidations,
      dependencyRegistrations: stats.dependencyRegistrations,
    };
  }
}
