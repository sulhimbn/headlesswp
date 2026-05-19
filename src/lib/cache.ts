import { CacheMetricsCalculator } from './cache/cacheMetricsCalculator';
import { CacheCleanup } from './cache/cacheCleanup';
import { CacheDependencyManager } from './cache/cacheDependencyManager';
import { CacheKeyFactory, cacheKeys } from './cache/cacheKeyFactory';
import { cacheDependencies } from './cache/cacheDependencyHelpers';
import type { ICacheManager } from '@/lib/api/ICacheManager';
import type { CacheEntry, CacheTelemetry } from './cache/types';
export type { CacheEntry, CacheTelemetry } from './cache/types';

/**
 * Advanced cache manager with dependency-aware cascade invalidation.
 *
 * @remarks
 * This cache manager provides:
 *
 * 1. **Dependency-Aware Caching**:
 *    - Track relationships between cache entries (e.g., posts depend on categories)
 *    - Automatic cascade invalidation when dependencies change
 *    - Prevents serving stale data after dependency updates
 *
 * 2. **Cascade Invalidation**:
 *    - When a dependency is invalidated, all dependents are recursively invalidated
 *    - Example: Invalidating 'category-5' also invalidates all posts in that category
 *    - Ensures data consistency across the cache
 *
 * 3. **Telemetry & Monitoring**:
 *    - Track hit rate, miss rate, and cascade invalidations
 *    - Estimate memory usage
 *    - Calculate efficiency score (high/medium/low)
 *
 * 4. **Smart Cleanup**:
 *    - Remove expired entries automatically
 *    - Clean up orphaned dependency references
 *    - Pattern-based cache clearing (e.g., clear all 'post:*' entries)
 *
 * @example
 * ```typescript
 * // Cache a post with dependencies on category and media
 * cacheManager.set('post:123', postData, 600000, ['category:5', 'media:456']);
 *
 * // Later, when category is updated...
 * cacheManager.invalidate('category:5');
 * // post:123 is automatically invalidated too!
 * ```
 */
class CacheManager implements ICacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private stats: CacheTelemetry = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    cascadeInvalidations: 0,
    dependencyRegistrations: 0,
  };
  private metricsCalculator = new CacheMetricsCalculator();
  private cacheCleanup = new CacheCleanup(this.cache);
  private dependencyManager = new CacheDependencyManager(this.cache);

  /**
   * Get data from cache by key.
   *
   * @template T - Type of data to cache
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   *
   * @example
   * ```typescript
   * const posts = cacheManager.get<WordPressPost[]>('posts:default');
   * if (posts) {
   *   return posts;
   * }
   * ```
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.invalidate(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set data in cache with optional dependency tracking.
   *
   * @template T - Type of data to cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time-to-live in milliseconds
   * @param dependencies - Array of cache keys this data depends on
   *
   * @remarks
   * Dependency tracking enables cascade invalidation:
   * - When dependencies are provided, the cache manager registers relationships
   * - Each dependency gets a reference to this key in its `dependents` set
   * - When any dependency is invalidated, this entry is automatically invalidated too
   *
   * Example: Posts depend on categories, so when a category updates,
   * all posts in that category should be invalidated.
   *
   * @example
   * ```typescript
   * // Cache a post that depends on category 5 and media 456
   * cacheManager.set('post:123', postData, 600000, ['category:5', 'media:456']);
   *
   * // Later, when category changes...
   * cacheManager.invalidate('category:5');
   * // post:123 is automatically invalidated!
   * ```
   */
  set<T>(key: string, data: T, ttl: number, dependencies?: string[]): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, entry);

    if (dependencies && dependencies.length > 0) {
      this.dependencyManager.registerDependencies(key, dependencies, this.stats);
    }

    this.stats.sets++;
  }

  /**
   * Delete specific cache entry without cascade invalidation.
   *
   * @param key - Cache key to delete
   * @returns True if entry was deleted, false if not found
   *
   * @remarks
   * This method deletes the entry but does NOT cascade to dependents.
   * Use `invalidate()` for cascade invalidation with dependency cleanup.
   *
   * Use this when you want to delete an entry without affecting dependents,
   * or when you're certain there are no dependents.
   *
   * @example
   * ```typescript
   * // Delete single entry (no cascade)
   * cacheManager.delete('posts:default');
   * ```
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Invalidate cache key and recursively invalidate all dependents.
   *
   * @param key - Cache key to invalidate
   *
   * @remarks
   * Cascade invalidation ensures data consistency:
   *
   * 1. When a key is invalidated, all entries that depend on it are also invalidated
   * 2. This continues recursively to all levels of dependents
   * 3. Example: Invalidating 'category:5' → invalidates 'post:123' (depends on category) → invalidates 'post-list:cat5' (depends on posts)
   *
   * This prevents serving stale data after dependency updates.
   *
   * Use `invalidate()` instead of `delete()` when you want cascade behavior.
   *
   * @example
   * ```typescript
   * // Invalidate category and all posts that depend on it
   * cacheManager.invalidate('category:5');
   * // post:123, post:456, etc. are automatically invalidated
   * ```
   */
  invalidate(key: string): void {
    this.dependencyManager.invalidate(key, (key) => this.cache.delete(key), this.stats);
  }

  /**
   * Clear all cache entries without cascade invalidation.
   *
   * @remarks
   * This is a complete cache reset. All entries are deleted.
   * Dependency tracking is reset since all entries are removed.
   *
   * Use this for:
   * - Full cache reset during deployment
   * - Testing scenarios
   * - Emergency cache clearing
   *
   * @example
   * ```typescript
   * cacheManager.clearAll();
   * ```
   */
  clearAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
  }

  /**
   * Clear cache entries matching a regex pattern with cascade invalidation.
   *
   * @param pattern - Regular expression pattern to match keys
   *
   * @remarks
   * This method:
   * - Finds all cache keys matching the pattern
   * - Invalidates each match (with cascade invalidation)
   * - Useful for clearing all entries of a certain type
   *
   * Examples:
   * - 'post:' clears all individual posts
   * - 'category:' clears all categories
   * - '^post' clears all entries starting with 'post'
   *
   * @example
   * ```typescript
   * // Clear all post entries
   * cacheManager.clearPattern('^post:');
   *
   * // Clear all category and tag entries
   * cacheManager.clearPattern('^(category|tag):');
   * ```
   */
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.invalidate(key));
  }

  /**
   * Get comprehensive cache statistics with telemetry.
   *
   * @returns Object containing cache metrics
   *
   * @remarks
   * Statistics include:
   * - hits/misses: Raw counts
   * - hitRate: Percentage of cache hits (0-100)
   * - invalidationRate: Percentage of deletes that triggered cascade invalidation
   * - size: Current number of cache entries
   * - memoryUsageBytes: Estimated memory usage
   * - avgTtl: Average time-to-live across all entries
   *
   * Use these metrics to:
   * - Monitor cache efficiency
   * - Identify cache tuning opportunities
   * - Debug cache-related issues
   *
   * @example
   * ```typescript
   * const stats = cacheManager.getStats();
   * return stats.hitRate;
   * ```
   */
  getStats() {
    const memoryUsageBytes = this.metricsCalculator.calculateMemoryUsage(this.cache);
    const avgTtl = this.metricsCalculator.calculateAverageTtl(this.cache);

    return this.metricsCalculator.calculateStatistics(
      this.stats,
      this.cache.size,
      memoryUsageBytes,
      avgTtl
    );
  }

  /**
   * Get cache performance metrics for monitoring dashboards.
   *
   * @returns Object with human-readable metrics
   *
   * @remarks
   * Returns metrics optimized for monitoring:
   * - efficiencyScore: 'high' (>80%), 'medium' (50-80%), 'low' (<50%)
   * - memoryUsageMB: Memory in megabytes (human-readable)
   * - avgTtlSeconds: Average TTL in seconds
   *
   * Use this for logging, dashboards, or alerting.
   *
   * @example
   * ```typescript
   * const metrics = cacheManager.getPerformanceMetrics();
   * return metrics.efficiencyScore;
   * ```
   */
  getPerformanceMetrics() {
    const stats = this.getStats();
    return this.metricsCalculator.calculatePerformanceMetrics(stats);
  }

  /**
   * Clean up expired entries with cascade invalidation.
   *
   * @returns Number of entries cleaned up
   *
   * @remarks
   * This method:
   * - Finds all expired cache entries (timestamp + ttl < now)
   * - Invalidates each expired entry (with cascade to dependents)
   * - Returns count of cleaned entries
   *
   * Call this periodically (e.g., every hour) to:
   * - Prevent memory bloat
   * - Ensure data consistency (expired dependents also removed)
   *
   * Note: Entries are automatically invalidated on access if expired,
   * so this cleanup is optional for correctness but helpful for memory.
   *
   * @example
   * ```typescript
   * // Run cleanup every hour
   * setInterval(() => {
   *   const cleaned = cacheManager.cleanup();
   * }, 3600000);
   * ```
   */
  cleanup(): number {
    const cleaned = this.cacheCleanup.cleanup();
    this.stats.deletes += cleaned;
    return cleaned;
  }

  /**
   * Clean up orphaned dependency references.
   * 
   @returns Number of orphaned dependencies removed
   * 
   * @remarks
   * Orphan dependencies occur when:
   * 1. Entry A depends on Entry B
   * 2. Entry B is deleted or expired
   * 3. Entry A still references Entry B in its dependencies set
   * 
   * This can happen when:
   * - Entry B was deleted with `delete()` (no cascade)
   * - Entry B expired and was garbage collected
   * - Dependencies were set before cache entries existed
   * 
   * This method cleans up these broken references to:
   * - Prevent invalid cascade invalidations
   * - Reduce memory usage
   * - Maintain data integrity
   * 
    * @example
    * ```typescript
    * // Clean up orphaned dependencies periodically
    * const cleaned = cacheManager.cleanupOrphanDependencies();
     * ```
    */
  cleanupOrphanDependencies(): number {
    return this.cacheCleanup.cleanupOrphanDependencies();
  }

  /**
   * Reset cache statistics (for testing).
   *
   * @remarks
   * This resets all telemetry counters without clearing cache data.
   * Useful for:
   * - Testing cache performance
   * - Starting fresh metrics after deployment
   * - Debugging cache behavior
   *
   * @example
   * ```typescript
   * cacheManager.resetStats();
   * // Now you can track fresh statistics
   * ```
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      cascadeInvalidations: 0,
      dependencyRegistrations: 0,
    };
  }

  /**
   * Estimate cache memory usage in bytes.
   *
   * @returns Estimated memory usage in bytes
   *
   * @remarks
   * This is a rough estimate based on:
   * - Key length (2 bytes per character, UTF-16)
   * - Data size (JSON string length * 2)
   * - Dependency/dependent references (~50 bytes each)
   * - Overhead per entry (24 bytes)
   *
   * Note: This is an approximation, not exact memory usage.
   * For accurate metrics, use Node.js memory profiling tools.
   *
   * @example
   * ```typescript
   * const usage = cacheManager.getMemoryUsage();
   * const usageMB = usage / 1024 / 1024;
   * ```
   */
  getMemoryUsage(): number {
    let totalSize = 0;
    this.cache.forEach((entry, key) => {
      // Key: 2 bytes per character (UTF-16)
      totalSize += key.length * 2;

      // Data: JSON string length * 2 (UTF-16)
      totalSize += JSON.stringify(entry.data).length * 2;

      // Dependencies/dependents: ~50 bytes per reference (Set overhead)
      totalSize += entry.dependencies ? entry.dependencies.size * 50 : 0;
      totalSize += entry.dependents ? entry.dependents.size * 50 : 0;

      // Overhead: ~24 bytes per Map entry (V8 estimate)
      totalSize += 24;
    });
    return totalSize;
  }

  /**
   * Invalidate all cache entries for a specific entity type.
   *
   * @param entityType - Type of entity to invalidate
   * @returns Number of entries invalidated
   *
   * @remarks
   * This is a convenience method for clearing cache by entity type.
   * Uses pattern matching with cascade invalidation.
   *
   * Supported entity types:
   * - 'post' | 'posts': Post entries
   * - 'category' | 'categories': Category entries
   * - 'tag' | 'tags': Tag entries
   * - 'media': Media entries
   * - 'author': Author entries
   *
   * Use this when:
   * - WordPress content is updated (e.g., new post published)
   * - Category/tag structure changes
   * - Media is uploaded or updated
   *
   * @example
   * ```typescript
   * // Invalidate all posts when new content is published
   * const count = cacheManager.invalidateByEntityType('posts');
   * ```
   */
  invalidateByEntityType(
    entityType: 'post' | 'posts' | 'category' | 'categories' | 'tag' | 'tags' | 'media' | 'author'
  ): number {
    const pattern = new RegExp(`^${entityType}`);
    let invalidated = 0;

    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        this.invalidate(key);
        invalidated++;
      }
    });

    return invalidated;
  }

  /**
   * Get all cache keys matching a pattern (for debugging).
   *
   * @param pattern - Regular expression pattern
   * @returns Array of matching cache keys
   *
   * @remarks
   * Useful for debugging and monitoring:
   * - Find all cached posts
   * - Find all cached categories
   * - Check cache state
   *
   * This does NOT invalidate entries, just returns keys.
   *
   * @example
   * ```typescript
   * // Find all cached posts
   * const postKeys = cacheManager.getKeysByPattern('^post:');
   * ```
   */
  getKeysByPattern(pattern: string): string[] {
    const regex = new RegExp(pattern);
    return Array.from(this.cache.keys()).filter((key) => regex.test(key));
  }

  /**
   * Get dependency information for a specific cache key.
   *
   * @param key - Cache key to query
   * @returns Object with dependencies and dependents arrays
   *
   * @remarks
   * Returns the dependency graph for a key:
   * - dependencies: Cache keys that this entry depends on
   * - dependents: Cache keys that depend on this entry
   *
   * Useful for:
   * - Debugging cascade invalidation
   * - Understanding cache relationships
   * - Identifying potential performance issues
   *
   * @example
   * ```typescript
   * const info = cacheManager.getDependencies('post:123');
   * return info.dependencies;
   * ```
   */
  getDependencies(key: string): { dependencies: string[]; dependents: string[] } {
    return this.dependencyManager.getDependencies(key);
  }

  /**
   * Clear cache entries with optional pattern matching.
   *
   * @param pattern - Optional regex pattern to match keys
   *
   * @remarks
   * Convenience method that delegates to:
   * - `clearPattern()` if pattern provided (cascade invalidation)
   * - `clearAll()` if no pattern (no cascade)
   *
   * @example
   * ```typescript
   * // Clear all entries
   * cacheManager.clear();
   *
   * // Clear only post entries
   * cacheManager.clear('^post:');
   * ```
   */
  clear(pattern?: string): void {
    if (pattern) {
      this.clearPattern(pattern);
    } else {
      this.clearAll();
    }
  }
}

// Global cache instance - single source of truth for all caching operations
export const cacheManager = new CacheManager();

// Convenience exports for backward compatibility
export const { getStats: getCacheStats, clear: clearCache } = cacheManager;

export { CACHE_CONFIG as CACHE_TTL } from './cache/cacheConfig';
export { CACHE_CONFIG } from './cache/cacheConfig';

export { CacheKeyFactory, cacheKeys } from './cache/cacheKeyFactory';
export { cacheDependencies } from './cache/cacheDependencyHelpers';

export { CacheCleanup };
