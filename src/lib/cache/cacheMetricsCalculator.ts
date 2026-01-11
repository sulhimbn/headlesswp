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

export class CacheMetricsCalculator {
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
    return hitRate > 80 ? 'high' : hitRate > 50 ? 'medium' : 'low';
  }

  calculatePerformanceMetrics(
    stats: CacheStatistics
  ): PerformanceMetrics {
    const efficiencyScore = this.calculateEfficiencyLevel(stats.hitRate);

    return {
      efficiencyScore,
      hitRate: stats.hitRate,
      size: stats.size,
      memoryUsageMB: Math.round(stats.memoryUsageBytes / 1024 / 1024 * 100) / 100,
      cascadeInvalidations: stats.cascadeInvalidations,
      dependencyRegistrations: stats.dependencyRegistrations,
      avgTtlSeconds: Math.round(stats.avgTtl / 1000),
    };
  }

  calculateMemoryUsage<T>(
    cacheEntries: Map<string, CacheEntry<T>>
  ): number {
    let totalSize = 0;
    cacheEntries.forEach((entry, key) => {
      totalSize += key.length * 2;
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += entry.dependencies ? entry.dependencies.size * 50 : 0;
      totalSize += entry.dependents ? entry.dependents.size * 50 : 0;
      totalSize += 24;
    });
    return totalSize;
  }

  formatMetricsForDisplay(stats: CacheStatistics): FormattedMetrics {
    const efficiency = this.calculateEfficiencyLevel(stats.hitRate);
    const memoryUsageMB = Math.round(stats.memoryUsageBytes / 1024 / 1024 * 100) / 100;
    const avgTtlSeconds = Math.round(stats.avgTtl / 1000);

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
