import {
  CacheMetricsCalculator,
  CacheTelemetry,
  CacheStatistics,
  PerformanceMetrics,
  FormattedMetrics,
  CacheEntry,
} from '@/lib/cache/cacheMetricsCalculator';

describe('CacheMetricsCalculator', () => {
  let calculator: CacheMetricsCalculator;

  beforeEach(() => {
    calculator = new CacheMetricsCalculator();
  });

  describe('calculateStatistics', () => {
    it('should calculate hit rate correctly with hits and misses', () => {
      const stats: CacheTelemetry = {
        hits: 80,
        misses: 20,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
      };
      const cacheSize = 10;
      const memoryUsageBytes = 1000;
      const avgTtl = 5000;

      const result = calculator.calculateStatistics(
        stats,
        cacheSize,
        memoryUsageBytes,
        avgTtl
      );

      expect(result.hits).toBe(80);
      expect(result.misses).toBe(20);
      expect(result.total).toBe(100);
      expect(result.hitRate).toBe(80);
      expect(result.invalidationRate).toBe(40);
      expect(result.size).toBe(cacheSize);
      expect(result.memoryUsageBytes).toBe(memoryUsageBytes);
      expect(result.avgTtl).toBe(avgTtl);
    });

    it('should return 0 hit rate when total is 0', () => {
      const stats: CacheTelemetry = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        cascadeInvalidations: 0,
        dependencyRegistrations: 0,
      };
      const cacheSize = 0;
      const memoryUsageBytes = 0;
      const avgTtl = 0;

      const result = calculator.calculateStatistics(
        stats,
        cacheSize,
        memoryUsageBytes,
        avgTtl
      );

      expect(result.hitRate).toBe(0);
      expect(result.invalidationRate).toBe(0);
    });

    it('should return 0 invalidation rate when deletes is 0', () => {
      const stats: CacheTelemetry = {
        hits: 100,
        misses: 0,
        sets: 10,
        deletes: 0,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
      };
      const cacheSize = 10;
      const memoryUsageBytes = 1000;
      const avgTtl = 5000;

      const result = calculator.calculateStatistics(
        stats,
        cacheSize,
        memoryUsageBytes,
        avgTtl
      );

      expect(result.invalidationRate).toBe(0);
    });

    it('should handle high hit rate (100%)', () => {
      const stats: CacheTelemetry = {
        hits: 1000,
        misses: 0,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
      };
      const cacheSize = 10;
      const memoryUsageBytes = 1000;
      const avgTtl = 5000;

      const result = calculator.calculateStatistics(
        stats,
        cacheSize,
        memoryUsageBytes,
        avgTtl
      );

      expect(result.hitRate).toBe(100);
      expect(result.total).toBe(1000);
    });

    it('should calculate invalidation rate correctly', () => {
      const stats: CacheTelemetry = {
        hits: 50,
        misses: 50,
        sets: 10,
        deletes: 20,
        cascadeInvalidations: 10,
        dependencyRegistrations: 3,
      };
      const cacheSize = 10;
      const memoryUsageBytes = 1000;
      const avgTtl = 5000;

      const result = calculator.calculateStatistics(
        stats,
        cacheSize,
        memoryUsageBytes,
        avgTtl
      );

      expect(result.invalidationRate).toBe(50);
    });

    it('should round hit rate to 2 decimal places', () => {
      const stats: CacheTelemetry = {
        hits: 1,
        misses: 3,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
      };
      const cacheSize = 10;
      const memoryUsageBytes = 1000;
      const avgTtl = 5000;

      const result = calculator.calculateStatistics(
        stats,
        cacheSize,
        memoryUsageBytes,
        avgTtl
      );

      expect(result.hitRate).toBe(25);
    });

    it('should include all original telemetry fields', () => {
      const stats: CacheTelemetry = {
        hits: 80,
        misses: 20,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
      };
      const cacheSize = 10;
      const memoryUsageBytes = 1000;
      const avgTtl = 5000;

      const result = calculator.calculateStatistics(
        stats,
        cacheSize,
        memoryUsageBytes,
        avgTtl
      );

      expect(result.sets).toBe(stats.sets);
      expect(result.deletes).toBe(stats.deletes);
      expect(result.cascadeInvalidations).toBe(stats.cascadeInvalidations);
      expect(result.dependencyRegistrations).toBe(stats.dependencyRegistrations);
    });
  });

  describe('calculateAverageTtl', () => {
    it('should calculate average TTL from cache entries', () => {
      const cacheEntries = new Map<string, CacheEntry<string>>([
        ['key1', { data: 'value1', timestamp: Date.now(), ttl: 1000 }],
        ['key2', { data: 'value2', timestamp: Date.now(), ttl: 2000 }],
        ['key3', { data: 'value3', timestamp: Date.now(), ttl: 3000 }],
      ]);

      const result = calculator.calculateAverageTtl(cacheEntries);

      expect(result).toBe(2000);
    });

    it('should return 0 when cache is empty', () => {
      const cacheEntries = new Map<string, CacheEntry<string>>();

      const result = calculator.calculateAverageTtl(cacheEntries);

      expect(result).toBe(0);
    });

    it('should handle single entry', () => {
      const cacheEntries = new Map<string, CacheEntry<string>>([
        ['key1', { data: 'value1', timestamp: Date.now(), ttl: 5000 }],
      ]);

      const result = calculator.calculateAverageTtl(cacheEntries);

      expect(result).toBe(5000);
    });

    it('should handle large TTL values', () => {
      const cacheEntries = new Map<string, CacheEntry<string>>([
        ['key1', { data: 'value1', timestamp: Date.now(), ttl: 3600000 }],
        ['key2', { data: 'value2', timestamp: Date.now(), ttl: 7200000 }],
      ]);

      const result = calculator.calculateAverageTtl(cacheEntries);

      expect(result).toBe(5400000);
    });

    it('should handle very small TTL values', () => {
      const cacheEntries = new Map<string, CacheEntry<string>>([
        ['key1', { data: 'value1', timestamp: Date.now(), ttl: 1 }],
        ['key2', { data: 'value2', timestamp: Date.now(), ttl: 2 }],
        ['key3', { data: 'value3', timestamp: Date.now(), ttl: 3 }],
      ]);

      const result = calculator.calculateAverageTtl(cacheEntries);

      expect(result).toBe(2);
    });

    it('should calculate correctly with varied TTL values', () => {
      const cacheEntries = new Map<string, CacheEntry<string>>([
        ['key1', { data: 'value1', timestamp: Date.now(), ttl: 100 }],
        ['key2', { data: 'value2', timestamp: Date.now(), ttl: 5000 }],
        ['key3', { data: 'value3', timestamp: Date.now(), ttl: 10000 }],
        ['key4', { data: 'value4', timestamp: Date.now(), ttl: 600000 }],
      ]);

      const result = calculator.calculateAverageTtl(cacheEntries);

      expect(result).toBe(153775);
    });

    it('should handle entries with dependencies', () => {
      const cacheEntries = new Map<string, CacheEntry<string>>([
        ['key1', {
          data: 'value1',
          timestamp: Date.now(),
          ttl: 1000,
          dependencies: new Set(['dep1']),
          dependents: new Set(['dep2']),
        }],
      ]);

      const result = calculator.calculateAverageTtl(cacheEntries);

      expect(result).toBe(1000);
    });
  });

  describe('calculateEfficiencyLevel', () => {
    it('should return "high" efficiency when hit rate > 80%', () => {
      expect(calculator.calculateEfficiencyLevel(81)).toBe('high');
      expect(calculator.calculateEfficiencyLevel(90)).toBe('high');
      expect(calculator.calculateEfficiencyLevel(100)).toBe('high');
    });

    it('should return "medium" efficiency when hit rate between 50% and 80%', () => {
      expect(calculator.calculateEfficiencyLevel(51)).toBe('medium');
      expect(calculator.calculateEfficiencyLevel(65)).toBe('medium');
      expect(calculator.calculateEfficiencyLevel(80)).toBe('medium');
    });

    it('should return "low" efficiency when hit rate <= 50%', () => {
      expect(calculator.calculateEfficiencyLevel(0)).toBe('low');
      expect(calculator.calculateEfficiencyLevel(25)).toBe('low');
      expect(calculator.calculateEfficiencyLevel(49)).toBe('low');
    });

    it('should return "low" efficiency when hit rate is exactly 50%', () => {
      expect(calculator.calculateEfficiencyLevel(50)).toBe('low');
    });

    it('should return "medium" efficiency when hit rate is exactly 80%', () => {
      expect(calculator.calculateEfficiencyLevel(80)).toBe('medium');
    });

    it('should handle edge case of 0 hit rate', () => {
      expect(calculator.calculateEfficiencyLevel(0)).toBe('low');
    });

    it('should handle decimal hit rates', () => {
      expect(calculator.calculateEfficiencyLevel(80.1)).toBe('high');
      expect(calculator.calculateEfficiencyLevel(79.9)).toBe('medium');
      expect(calculator.calculateEfficiencyLevel(50.1)).toBe('medium');
      expect(calculator.calculateEfficiencyLevel(49.9)).toBe('low');
    });
  });

  describe('calculatePerformanceMetrics', () => {
    it('should calculate performance metrics from statistics', () => {
      const stats: CacheStatistics = {
        hits: 81,
        misses: 19,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 81,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1048576,
        avgTtl: 5000,
      };

      const result = calculator.calculatePerformanceMetrics(stats);

      expect(result.efficiencyScore).toBe('high');
      expect(result.hitRate).toBe(81);
      expect(result.size).toBe(10);
      expect(result.memoryUsageMB).toBe(1);
      expect(result.cascadeInvalidations).toBe(2);
      expect(result.dependencyRegistrations).toBe(3);
      expect(result.avgTtlSeconds).toBe(5);
    });

    it('should round memory usage to 2 decimal places', () => {
      const stats: CacheStatistics = {
        hits: 80,
        misses: 20,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 80,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1572864,
        avgTtl: 5000,
      };

      const result = calculator.calculatePerformanceMetrics(stats);

      expect(result.memoryUsageMB).toBe(1.5);
    });

    it('should convert avgTtl to seconds', () => {
      const stats: CacheStatistics = {
        hits: 80,
        misses: 20,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 80,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1000,
        avgTtl: 60000,
      };

      const result = calculator.calculatePerformanceMetrics(stats);

      expect(result.avgTtlSeconds).toBe(60);
    });

    it('should set efficiency score based on hit rate', () => {
      const highHitRate: CacheStatistics = {
        hits: 90,
        misses: 10,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 90,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1000,
        avgTtl: 5000,
      };

      const mediumHitRate: CacheStatistics = {
        hits: 65,
        misses: 35,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 65,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1000,
        avgTtl: 5000,
      };

      const lowHitRate: CacheStatistics = {
        hits: 40,
        misses: 60,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 40,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1000,
        avgTtl: 5000,
      };

      expect(calculator.calculatePerformanceMetrics(highHitRate).efficiencyScore).toBe('high');
      expect(calculator.calculatePerformanceMetrics(mediumHitRate).efficiencyScore).toBe('medium');
      expect(calculator.calculatePerformanceMetrics(lowHitRate).efficiencyScore).toBe('low');
    });

    it('should handle zero memory usage', () => {
      const stats: CacheStatistics = {
        hits: 80,
        misses: 20,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 80,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 0,
        avgTtl: 5000,
      };

      const result = calculator.calculatePerformanceMetrics(stats);

      expect(result.memoryUsageMB).toBe(0);
    });

    it('should handle zero avgTtl', () => {
      const stats: CacheStatistics = {
        hits: 80,
        misses: 20,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 80,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1000,
        avgTtl: 0,
      };

      const result = calculator.calculatePerformanceMetrics(stats);

      expect(result.avgTtlSeconds).toBe(0);
    });
  });

  describe('calculateMemoryUsage', () => {
    it('should calculate memory usage for simple cache entries', () => {
      const cacheEntries = new Map<string, CacheEntry<string>>([
        ['key1', { data: 'value1', timestamp: Date.now(), ttl: 1000 }],
        ['key2', { data: 'value2', timestamp: Date.now(), ttl: 2000 }],
      ]);

      const result = calculator.calculateMemoryUsage(cacheEntries);

      expect(result).toBeGreaterThan(0);
    });

    it('should include key length in memory calculation', () => {
      const shortKeyEntries = new Map<string, CacheEntry<string>>([
        ['key', { data: 'value', timestamp: Date.now(), ttl: 1000 }],
      ]);

      const longKeyEntries = new Map<string, CacheEntry<string>>([
        ['very-long-key-name-here', { data: 'value', timestamp: Date.now(), ttl: 1000 }],
      ]);

      const shortKeyMemory = calculator.calculateMemoryUsage(shortKeyEntries);
      const longKeyMemory = calculator.calculateMemoryUsage(longKeyEntries);

      expect(longKeyMemory).toBeGreaterThan(shortKeyMemory);
    });

    it('should include data length in memory calculation', () => {
      const smallDataEntries = new Map<string, CacheEntry<string>>([
        ['key1', { data: 'small', timestamp: Date.now(), ttl: 1000 }],
      ]);

      const largeDataEntries = new Map<string, CacheEntry<string>>([
        ['key1', { data: 'very-large-data-string-here', timestamp: Date.now(), ttl: 1000 }],
      ]);

      const smallDataMemory = calculator.calculateMemoryUsage(smallDataEntries);
      const largeDataMemory = calculator.calculateMemoryUsage(largeDataEntries);

      expect(largeDataMemory).toBeGreaterThan(smallDataMemory);
    });

    it('should add overhead for dependencies', () => {
      const entriesWithoutDeps = new Map<string, CacheEntry<string>>([
        ['key1', { data: 'value1', timestamp: Date.now(), ttl: 1000 }],
      ]);

      const entriesWithDeps = new Map<string, CacheEntry<string>>([
        ['key1', {
          data: 'value1',
          timestamp: Date.now(),
          ttl: 1000,
          dependencies: new Set(['dep1', 'dep2']),
        }],
      ]);

      const memoryWithoutDeps = calculator.calculateMemoryUsage(entriesWithoutDeps);
      const memoryWithDeps = calculator.calculateMemoryUsage(entriesWithDeps);

      expect(memoryWithDeps).toBeGreaterThan(memoryWithoutDeps);
    });

    it('should add overhead for dependents', () => {
      const entriesWithoutDeps = new Map<string, CacheEntry<string>>([
        ['key1', { data: 'value1', timestamp: Date.now(), ttl: 1000 }],
      ]);

      const entriesWithDeps = new Map<string, CacheEntry<string>>([
        ['key1', {
          data: 'value1',
          timestamp: Date.now(),
          ttl: 1000,
          dependents: new Set(['dep1', 'dep2']),
        }],
      ]);

      const memoryWithoutDeps = calculator.calculateMemoryUsage(entriesWithoutDeps);
      const memoryWithDeps = calculator.calculateMemoryUsage(entriesWithDeps);

      expect(memoryWithDeps).toBeGreaterThan(memoryWithoutDeps);
    });

    it('should add per-entry overhead', () => {
      const entries = new Map<string, CacheEntry<string>>([
        ['key1', { data: 'value1', timestamp: Date.now(), ttl: 1000 }],
      ]);

      const memory = calculator.calculateMemoryUsage(entries);

      const keyLength = 'key1'.length * 2;
      const dataLength = JSON.stringify('value1').length * 2;
      const overhead = 24;

      expect(memory).toBe(keyLength + dataLength + overhead);
    });

    it('should handle complex data structures', () => {
      const complexData = {
        id: 1,
        title: 'Test Post',
        content: 'This is a test post content',
        author: { id: 1, name: 'Test Author' },
        tags: ['tag1', 'tag2', 'tag3'],
      };

      const entries = new Map<string, CacheEntry<unknown>>([
        ['post-1', { data: complexData, timestamp: Date.now(), ttl: 5000 }],
      ]);

      const memory = calculator.calculateMemoryUsage(entries);

      expect(memory).toBeGreaterThan(0);
    });

    it('should return 0 for empty cache', () => {
      const emptyEntries = new Map<string, CacheEntry<string>>();

      const memory = calculator.calculateMemoryUsage(emptyEntries);

      expect(memory).toBe(0);
    });

    it('should handle entries with both dependencies and dependents', () => {
      const entries = new Map<string, CacheEntry<string>>([
        ['key1', {
          data: 'value1',
          timestamp: Date.now(),
          ttl: 1000,
          dependencies: new Set(['dep1', 'dep2']),
          dependents: new Set(['dep3', 'dep4', 'dep5']),
        }],
      ]);

      const memory = calculator.calculateMemoryUsage(entries);

      expect(memory).toBeGreaterThan(0);
    });
  });

  describe('formatMetricsForDisplay', () => {
    it('should format metrics for display with high efficiency', () => {
      const stats: CacheStatistics = {
        hits: 85,
        misses: 15,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 85,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1048576,
        avgTtl: 5000,
      };

      const result = calculator.formatMetricsForDisplay(stats);

      expect(result.efficiency).toBe('high');
      expect(result.hitRate).toBe('85.00%');
      expect(result.memoryUsage).toBe('1.00 MB');
      expect(result.avgTtl).toBe('5s');
      expect(result.cascadeInvalidations).toBe(2);
      expect(result.dependencyRegistrations).toBe(3);
    });

    it('should format hit rate with 2 decimal places', () => {
      const stats: CacheStatistics = {
        hits: 75,
        misses: 25,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 75,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1000,
        avgTtl: 5000,
      };

      const result = calculator.formatMetricsForDisplay(stats);

      expect(result.hitRate).toBe('75.00%');
    });

    it('should format memory usage in MB with 2 decimal places', () => {
      const stats: CacheStatistics = {
        hits: 80,
        misses: 20,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 80,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1572864,
        avgTtl: 5000,
      };

      const result = calculator.formatMetricsForDisplay(stats);

      expect(result.memoryUsage).toBe('1.50 MB');
    });

    it('should format avgTtl in seconds', () => {
      const stats: CacheStatistics = {
        hits: 80,
        misses: 20,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 80,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1000,
        avgTtl: 60000,
      };

      const result = calculator.formatMetricsForDisplay(stats);

      expect(result.avgTtl).toBe('60s');
    });

    it('should handle medium efficiency level', () => {
      const stats: CacheStatistics = {
        hits: 65,
        misses: 35,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 65,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1000,
        avgTtl: 5000,
      };

      const result = calculator.formatMetricsForDisplay(stats);

      expect(result.efficiency).toBe('medium');
    });

    it('should handle low efficiency level', () => {
      const stats: CacheStatistics = {
        hits: 40,
        misses: 60,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 40,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1000,
        avgTtl: 5000,
      };

      const result = calculator.formatMetricsForDisplay(stats);

      expect(result.efficiency).toBe('low');
    });

    it('should format memory less than 1 MB correctly', () => {
      const stats: CacheStatistics = {
        hits: 80,
        misses: 20,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 80,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 500000,
        avgTtl: 5000,
      };

      const result = calculator.formatMetricsForDisplay(stats);

      expect(result.memoryUsage).toBe('0.48 MB');
    });

    it('should format avgTtl less than 1 second', () => {
      const stats: CacheStatistics = {
        hits: 80,
        misses: 20,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 80,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 1000,
        avgTtl: 499,
      };

      const result = calculator.formatMetricsForDisplay(stats);

      expect(result.avgTtl).toBe('0s');
    });

    it('should handle large memory usage', () => {
      const stats: CacheStatistics = {
        hits: 80,
        misses: 20,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 2,
        dependencyRegistrations: 3,
        total: 100,
        hitRate: 80,
        invalidationRate: 40,
        size: 10,
        memoryUsageBytes: 104857600,
        avgTtl: 5000,
      };

      const result = calculator.formatMetricsForDisplay(stats);

      expect(result.memoryUsage).toBe('100.00 MB');
    });

    it('should preserve cascadeInvalidations and dependencyRegistrations counts', () => {
      const stats: CacheStatistics = {
        hits: 80,
        misses: 20,
        sets: 10,
        deletes: 5,
        cascadeInvalidations: 15,
        dependencyRegistrations: 25,
        total: 100,
        hitRate: 80,
        invalidationRate: 300,
        size: 10,
        memoryUsageBytes: 1000,
        avgTtl: 5000,
      };

      const result = calculator.formatMetricsForDisplay(stats);

      expect(result.cascadeInvalidations).toBe(15);
      expect(result.dependencyRegistrations).toBe(25);
    });

    it('should handle zero values', () => {
      const stats: CacheStatistics = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        cascadeInvalidations: 0,
        dependencyRegistrations: 0,
        total: 0,
        hitRate: 0,
        invalidationRate: 0,
        size: 0,
        memoryUsageBytes: 0,
        avgTtl: 0,
      };

      const result = calculator.formatMetricsForDisplay(stats);

      expect(result.efficiency).toBe('low');
      expect(result.hitRate).toBe('0.00%');
      expect(result.memoryUsage).toBe('0.00 MB');
      expect(result.avgTtl).toBe('0s');
      expect(result.cascadeInvalidations).toBe(0);
      expect(result.dependencyRegistrations).toBe(0);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full metrics calculation flow', () => {
      const stats: CacheTelemetry = {
        hits: 850,
        misses: 150,
        sets: 50,
        deletes: 10,
        cascadeInvalidations: 5,
        dependencyRegistrations: 15,
      };

      const cacheEntries = new Map<string, CacheEntry<string>>([
        ['key1', { data: 'value1', timestamp: Date.now(), ttl: 60000 }],
        ['key2', { data: 'value2', timestamp: Date.now(), ttl: 120000 }],
      ]);

      const memoryUsage = calculator.calculateMemoryUsage(cacheEntries);
      const avgTtl = calculator.calculateAverageTtl(cacheEntries);
      const statistics = calculator.calculateStatistics(
        stats,
        cacheEntries.size,
        memoryUsage,
        avgTtl
      );
      const performance = calculator.calculatePerformanceMetrics(statistics);
      const formatted = calculator.formatMetricsForDisplay(statistics);

      expect(statistics.hitRate).toBe(85);
      expect(performance.efficiencyScore).toBe('high');
      expect(formatted.efficiency).toBe('high');
      expect(formatted.hitRate).toBe('85.00%');
    });

    it('should calculate efficiency levels correctly across ranges', () => {
      const hitRates = [0, 25, 50, 75, 80, 85, 100];
      const expectedLevels = ['low', 'low', 'low', 'medium', 'medium', 'high', 'high'];

      hitRates.forEach((hitRate, index) => {
        const level = calculator.calculateEfficiencyLevel(hitRate);
        expect(level).toBe(expectedLevels[index]);
      });
    });
  });
});
