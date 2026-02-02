import type { CacheEntry } from './types';

/**
 * Manages cache dependency tracking and cascade invalidation.
 * 
 * @remarks
 * This class handles:
 * 1. Dependency registration between cache entries
 * 2. Cascade invalidation when dependencies are invalidated
 * 3. Dependency querying for debugging and monitoring
 * 
 * Dependency Graph:
 * - Each cache entry can have dependencies (keys it depends on)
 * - Each cache entry can have dependents (keys that depend on it)
 * - This forms a bi-directional graph for cascade invalidation
 * 
 * Example: If post-123 depends on category-5:
 * - post-123.dependencies = ['category-5']
 * - category-5.dependents = ['post-123']
 * When category-5 is invalidated, post-123 is automatically invalidated too.
 * 
 * @example
 * ```typescript
 * const dependencyManager = new CacheDependencyManager(cacheMap);
 * 
 * // Register dependencies when setting cache
 * dependencyManager.registerDependencies('post:123', ['category:5', 'media:456']);
 * 
 * // Invalidate with cascade invalidation
 * dependencyManager.invalidate('category:5');
 * // post:123 is automatically invalidated!
 * 
 * // Query dependencies
 * const deps = dependencyManager.getDependencies('post:123');
 * console.log(deps.dependencies); // ['category:5', 'media:456']
 * ```
 */
export class CacheDependencyManager {
  constructor(private cache: Map<string, CacheEntry<unknown>>) {}

  /**
   * Register dependencies for a cache entry.
   * 
   * @param key - Cache key for this entry
   * @param dependencies - Array of cache keys this entry depends on
   * @param stats - Stats object to track dependency registrations (optional)
   * 
   * @remarks
   * This creates a bi-directional dependency graph:
   * - key -> dependencies (entry.dependencies)
   * - dependencies -> key (entry.dependents)
   * 
   * This enables cascade invalidation from both directions.
   * 
   * @example
   * ```typescript
   * // Register that post-123 depends on category-5 and media-456
   * dependencyManager.registerDependencies('post:123', ['category:5', 'media:456'], stats);
   * ```
   */
  registerDependencies(
    key: string,
    dependencies: string[],
    stats?: { dependencyRegistrations: number }
  ): void {
    const entry = this.cache.get(key);
    if (!entry) {
      return;
    }

    entry.dependencies = new Set(dependencies);

    dependencies.forEach(depKey => {
      const depEntry = this.cache.get(depKey);

      if (depEntry) {
        if (!depEntry.dependents) {
          depEntry.dependents = new Set();
        }
        depEntry.dependents.add(key);
        if (stats) {
          stats.dependencyRegistrations++;
        }
      }
    });
  }

  /**
   * Invalidate cache key and recursively invalidate all dependents.
   * 
   * @param key - Cache key to invalidate
   * @param onDelete - Callback function to handle deletion (optional)
   * @param stats - Stats object to track cascade invalidations (optional)
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
   * @example
   * ```typescript
   * // Invalidate category and all posts that depend on it
   * dependencyManager.invalidate('category:5', (key) => cache.delete(key), stats);
   * // post:123, post:456, etc. are automatically invalidated
   * ```
   */
  invalidate(
    key: string,
    onDelete?: (key: string) => void,
    stats?: { deletes: number; cascadeInvalidations: number }
  ): void {
    const entry = this.cache.get(key);
    if (!entry) {
      return;
    }

    if (onDelete) {
      onDelete(key);
    }

    if (stats) {
      stats.deletes++;
      stats.cascadeInvalidations++;
    }

    if (entry.dependents && entry.dependents.size > 0) {
      const dependents = Array.from(entry.dependents);
      dependents.forEach(depKey => this.invalidate(depKey, onDelete, stats));
    }
  }

  /**
   * Get dependencies and dependents for a cache entry.
   * 
   * @param key - Cache key to query
   * @returns Object with dependencies and dependents arrays
   * 
   * @remarks
   * This is useful for:
   * - Debugging dependency relationships
   * - Understanding why entries are invalidated
   * - Monitoring cache behavior
   * 
   * @example
   * ```typescript
   * const deps = dependencyManager.getDependencies('post:123');
   * console.log('Dependencies:', deps.dependencies);
   * console.log('Dependents:', deps.dependents);
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
}
