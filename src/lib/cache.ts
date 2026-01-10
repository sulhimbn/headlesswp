import { CACHE_TIMES } from '@/lib/api/config';

/**
 * Represents a cached data entry with metadata.
 * 
 * @template T - Type of cached data
 * 
 * @remarks
 * Cache entries store not just the data, but also:
 * - timestamp: When the data was cached
 * - ttl: Time-to-live in milliseconds
 * - dependencies: Set of cache keys this entry depends on (e.g., a post depends on its category)
 * - dependents: Set of cache keys that depend on this entry (for cascade invalidation)
 * 
 * Example: If post-123 depends on category-5:
 * - post-123.dependencies = ['category-5']
 * - category-5.dependents = ['post-123']
 * When category-5 is invalidated, post-123 is automatically invalidated too.
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  dependencies?: Set<string>;
  dependents?: Set<string>;
}

/**
 * Cache telemetry metrics for monitoring and debugging.
 * 
 * @remarks
 * Track cache performance to identify bottlenecks and optimization opportunities:
 * - hitRate: Percentage of cache hits (higher is better)
 * - invalidationRate: Percentage of deletes that triggered cascade invalidation
 * - dependencyRegistrations: Number of dependency links created
 */
interface CacheTelemetry {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  cascadeInvalidations: number;
  dependencyRegistrations: number;
}

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
class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private stats: CacheTelemetry = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    cascadeInvalidations: 0,
    dependencyRegistrations: 0,
  };

  /**
   * Get data from cache by key.
   * 
   * @template T - Expected type of cached data
   * @param key - Cache key to retrieve
   * @returns Cached data or null if not found/expired
   * 
   * @remarks
   * This method:
   * - Returns cached data if it exists and hasn't expired
   * - Automatically removes expired entries
   * - Updates telemetry (hit/miss counts)
   * 
   * @example
   * ```typescript
   * const posts = cacheManager.get<WordPressPost[]>('posts:default');
   * if (posts) {
   *   console.log('Cache hit!');
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

    // Register dependencies if provided
    // This creates a bi-directional graph: key -> dependencies AND dependencies -> key
    if (dependencies && dependencies.length > 0) {
      entry.dependencies = new Set(dependencies);
      dependencies.forEach(depKey => {
        const depEntry = this.cache.get(depKey);
        
        // If dependency exists in cache, register this key as its dependent
        // This enables cascade invalidation from dependency to dependents
        if (depEntry) {
          if (!depEntry.dependents) {
            depEntry.dependents = new Set();
          }
          depEntry.dependents.add(key);
          this.stats.dependencyRegistrations++;
        }
      });
    }
    
    this.cache.set(key, entry);
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
    const entry = this.cache.get(key);
    if (!entry) {
      return;
    }

    // Invalidate this entry
    this.cache.delete(key);
    this.stats.deletes++;
    this.stats.cascadeInvalidations++;

    // Recursively invalidate all dependents
    // This ensures that any data that depends on this entry is also invalidated
    if (entry.dependents && entry.dependents.size > 0) {
      const dependents = Array.from(entry.dependents);
      dependents.forEach(depKey => this.invalidate(depKey));
    }
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
   * console.log('Cache cleared');
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
    
    keysToDelete.forEach(key => this.invalidate(key));
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
   * console.log(`Hit rate: ${stats.hitRate}%`);
   * console.log(`Memory: ${stats.memoryUsageBytes} bytes`);
   * ```
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    const invalidationRate = total > 0 ? (this.stats.cascadeInvalidations / this.stats.deletes) * 100 : 0;
    
    return {
      ...this.stats,
      total,
      hitRate: Math.round(hitRate * 100) / 100,
      invalidationRate: Math.round(invalidationRate * 100) / 100,
      size: this.cache.size,
      memoryUsageBytes: this.getMemoryUsage(),
      avgTtl: this.getAverageTtl(),
    };
  }

  /**
   * Calculate average TTL across all cached entries.
   * 
   * @private
   * @returns Average TTL in milliseconds
   * 
   * @remarks
   * This helps identify if TTL values are appropriate:
   * - Very low avgTtl: Cache entries expiring too quickly
   * - Very high avgTtl: Risk of stale data
   * 
   * Used internally by `getStats()` for telemetry.
   */
  private getAverageTtl(): number {
    if (this.cache.size === 0) return 0;
    
    let totalTtl = 0;
    this.cache.forEach(entry => {
      totalTtl += entry.ttl;
    });
    
    return Math.round(totalTtl / this.cache.size);
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
   * console.log(`Cache efficiency: ${metrics.efficiencyScore}`);
   * console.log(`Memory: ${metrics.memoryUsageMB} MB`);
   * ```
   */
  getPerformanceMetrics() {
    const stats = this.getStats();
    const efficiencyScore = stats.hitRate > 80 ? 'high' : stats.hitRate > 50 ? 'medium' : 'low';
    
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
   *   console.log(`Cleaned ${cleaned} expired entries`);
   * }, 3600000);
   * ```
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    const expiredKeys: string[] = [];
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.invalidate(key);
      cleaned++;
    });

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
   * console.log(`Removed ${cleaned} orphaned dependencies`);
   * ```
   */
  cleanupOrphanDependencies(): number {
    let cleaned = 0;

    this.cache.forEach((entry, _key) => {
      if (entry.dependencies) {
        const validDeps: string[] = [];
        entry.dependencies.forEach(depKey => {
          // Check if dependency still exists in cache
          if (!this.cache.has(depKey)) {
            cleaned++;
          } else {
            validDeps.push(depKey);
          }
        });
        
        // Update dependencies to only valid ones
        if (validDeps.length !== entry.dependencies.size) {
          entry.dependencies = new Set(validDeps);
        }
      }
    });

    return cleaned;
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
   * console.log(`Cache using ~${usage / 1024 / 1024} MB`);
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
   * console.log(`Invalidated ${count} post entries`);
   * ```
   */
  invalidateByEntityType(entityType: 'post' | 'posts' | 'category' | 'categories' | 'tag' | 'tags' | 'media' | 'author'): number {
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
   * console.log(`Found ${postKeys.length} cached posts`);
   * ```
   */
  getKeysByPattern(pattern: string): string[] {
    const regex = new RegExp(pattern);
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
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
   * console.log('Dependencies:', info.dependencies);
   * console.log('Dependents:', info.dependents);
   * ```
   */
  getDependencies(key: string): { dependencies: string[]; dependents: string[] } {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return { dependencies: [], dependents: [] };
    }

    return {
      dependencies: Array.from(entry.dependencies || []),
      dependents: Array.from(entry.dependents || []),
    };
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

/**
 * Cache TTL (Time-To-Live) constants in milliseconds.
 * 
 * @remarks
 * These values determine how long cached data remains valid.
 * Choose TTL based on:
 * - Data volatility: How often content changes
 * - Business requirements: Freshness needs
 * - Performance: Longer TTL = fewer API calls
 * 
 * Common TTL patterns:
 * - Short (1-5 min): Highly dynamic data (search results, live content)
 * - Medium (10-30 min): Moderately dynamic data (posts, categories)
 * - Long (1+ hours): Static data (media, authors)
 */
export const CACHE_TTL = {
  POSTS: CACHE_TIMES.MEDIUM_SHORT,  // 5 minutes - Post lists refresh often
  POST: CACHE_TIMES.MEDIUM,           // 10 minutes - Individual posts
  CATEGORIES: CACHE_TIMES.MEDIUM_LONG, // 30 minutes - Categories rarely change
  TAGS: CACHE_TIMES.MEDIUM_LONG,      // 30 minutes - Tags rarely change
  MEDIA: CACHE_TIMES.LONG,            // 1 hour - Media is static
  SEARCH: CACHE_TIMES.SHORT,          // 2 minutes - Search results expire quickly
  AUTHOR: CACHE_TIMES.MEDIUM_LONG,    // 30 minutes - Authors rarely change
} as const;

/**
 * Cache key generators for consistent key naming.
 * 
 * @remarks
 * Use these functions to generate cache keys consistently:
 * - Prevents key typos
 * - Ensures predictable cache structure
 * - Makes debugging easier
 * 
 * Key format: `{entity}:{identifier}`
 * Examples: 'post:123', 'category:news', 'posts:default'
 * 
 * @example
 * ```typescript
 * // Good - Use key generators
 * cacheManager.set(CACHE_KEYS.post(123), postData, CACHE_TTL.POST);
 * 
 * // Bad - String literals (prone to typos)
 * cacheManager.set('post-123', postData, 60000);
 * ```
 */
export const CACHE_KEYS = {
  posts: (params?: string) => `posts:${params || 'default'}`,
  post: (slug: string) => `post:${slug}`,
  postById: (id: number) => `post:${id}`,
  categories: () => 'categories',
  category: (slug: string) => `category:${slug}`,
  tags: () => 'tags',
  tag: (slug: string) => `tag:${slug}`,
  media: (id: number) => `media:${id}`,
  author: (id: number) => `author:${id}`,
  search: (query: string) => `search:${query}`,
} as const;

/**
 * Dependency helpers for defining cache relationships.
 * 
 * @remarks
 * These helpers generate dependency arrays for cache entries.
 * Use them when caching data that depends on other cached entities.
 * 
 * Dependency Graph Structure:
 * 
 * ```
 * category-5 (leaf node)
 *     ↑
 *     | (dependency)
 *     |
 * post-123
 *     ↑
 *     | (dependent)
 *     |
 * posts-list:cat5
 * ```
 * 
 * When `category-5` is invalidated, `post-123` is automatically invalidated.
 * When `post-123` is invalidated, `posts-list:cat5` is automatically invalidated.
 * 
 * Leaf nodes (no dependencies):
 * - Media: Images/videos don't depend on other entities
 * - Author: Author profiles don't depend on other entities
 * - Categories/Tags: Taxonomy terms don't depend on posts
 * 
 * @example
 * ```typescript
 * // Cache a post with dependencies
 * const dependencies = CACHE_DEPENDENCIES.post(
 *   123,                // Post ID
 *   [5, 8],            // Category IDs
 *   [12, 15],           // Tag IDs
 *   456                 // Media ID
 * );
 * cacheManager.set(CACHE_KEYS.post(123), postData, CACHE_TTL.POST, dependencies);
 * 
 * // Later, when category 5 is updated...
 * cacheManager.invalidate(CACHE_KEYS.category(5));
 * // post:123 is automatically invalidated!
 * ```
 */
export const CACHE_DEPENDENCIES = {
  /**
   * Post dependencies: categories, tags, and media.
   * 
   * @param postId - Post ID (for key generation)
   * @param categories - Array of category IDs
   * @param tags - Array of tag IDs
   * @param mediaId - Featured media ID (0 if none)
   * @returns Array of dependency cache keys
   * 
   * @remarks
   * Posts depend on:
   * - Categories: Post belongs to categories
   * - Tags: Post has tags
   * - Media: Post has featured image
   * 
   * When any of these change, the post should be invalidated.
   */
   post: (_postId: number | string, categories: number[], tags: number[], mediaId: number): string[] => {
     const deps: string[] = [];
     categories.forEach(catId => deps.push(CACHE_KEYS.category(catId.toString())));
     tags.forEach(tagId => deps.push(CACHE_KEYS.tag(tagId.toString())));
     if (mediaId > 0) deps.push(CACHE_KEYS.media(mediaId));
     return deps;
   },

  /**
   * Posts list dependencies: categories and tags.
   * 
   * @param categories - Array of category IDs (for filtered lists)
   * @param tags - Array of tag IDs (for filtered lists)
   * @returns Array of dependency cache keys
   * 
   * @remarks
   * Posts lists (e.g., posts in a category) depend on:
   * - Categories: Filtered by category
   * - Tags: Filtered by tag
   * 
   * When category/tag metadata changes, the list should be invalidated.
   */
  postsList: (categories: number[] = [], tags: number[] = []): string[] => {
    const deps: string[] = [];
    categories.forEach(catId => deps.push(CACHE_KEYS.category(catId.toString())));
    tags.forEach(tagId => deps.push(CACHE_KEYS.tag(tagId.toString())));
    return deps;
  },

  /**
   * Media dependencies: none (leaf node).
   * 
   * @returns Empty array
   * 
   * @remarks
   * Media (images, videos) don't depend on other entities.
   * They are leaf nodes in the dependency graph.
   * 
   * Other entities depend on media, but media doesn't depend on anything.
   */
  media: () => [],

  /**
   * Author dependencies: none (leaf node).
   * 
   * @returns Empty array
   * 
   * @remarks
   * Author profiles don't depend on other entities.
   * They are leaf nodes in the dependency graph.
   */
  author: () => [],

  /**
   * Categories dependencies: none (leaf node).
   * 
   * @returns Empty array
   * 
   * @remarks
   * Categories are taxonomy terms.
   * Posts depend on categories, but categories don't depend on posts.
   */
  categories: () => [],

  /**
   * Tags dependencies: none (leaf node).
   * 
   * @returns Empty array
   * 
   * @remarks
   * Tags are taxonomy terms.
   * Posts depend on tags, but tags don't depend on posts.
   */
  tags: () => [],
} as const;
