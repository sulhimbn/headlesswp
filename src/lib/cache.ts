interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  dependencies?: Set<string>;
  dependents?: Set<string>;
}

interface CacheTelemetry {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  cascadeInvalidations: number;
  dependencyRegistrations: number;
}

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

  // Get data from cache
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

  // Set data in cache
  set<T>(key: string, data: T, ttl: number, dependencies?: string[]): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Register dependencies if provided
    if (dependencies && dependencies.length > 0) {
      entry.dependencies = new Set(dependencies);
      dependencies.forEach(depKey => {
        const depEntry = this.cache.get(depKey);
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

  // Delete specific cache entry with cascade invalidation
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  // Invalidate cache key and all dependents (cascade invalidation)
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
    if (entry.dependents && entry.dependents.size > 0) {
      const dependents = Array.from(entry.dependents);
      dependents.forEach(depKey => this.invalidate(depKey));
    }
  }

  // Clear all cache
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
  }

  // Clear cache entries matching a pattern with cascade invalidation
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

  // Get cache statistics with telemetry
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

  // Get average TTL for all cached entries
  private getAverageTtl(): number {
    if (this.cache.size === 0) return 0;
    
    let totalTtl = 0;
    this.cache.forEach(entry => {
      totalTtl += entry.ttl;
    });
    
    return Math.round(totalTtl / this.cache.size);
  }

  // Get cache performance metrics for monitoring
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

  // Clean up expired entries with dependency cleanup
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

  // Orphan dependency cleanup - remove broken dependencies
  cleanupOrphanDependencies(): number {
    let cleaned = 0;

    this.cache.forEach((entry, _key) => {
      if (entry.dependencies) {
        const validDeps: string[] = [];
        entry.dependencies.forEach(depKey => {
          if (!this.cache.has(depKey)) {
            cleaned++;
          } else {
            validDeps.push(depKey);
          }
        });
        
        if (validDeps.length !== entry.dependencies.size) {
          entry.dependencies = new Set(validDeps);
        }
      }
    });

    return cleaned;
  }

  // Reset stats (for testing)
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

  // Get cache size in bytes (rough estimate)
  getMemoryUsage(): number {
    let totalSize = 0;
    this.cache.forEach((entry, key) => {
      totalSize += key.length * 2;
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += entry.dependencies ? entry.dependencies.size * 50 : 0;
      totalSize += entry.dependents ? entry.dependents.size * 50 : 0;
      totalSize += 24;
    });
    return totalSize;
  }

  // Invalidate by entity type with smart cascade
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

  // Get all keys matching a pattern (for debugging)
  getKeysByPattern(pattern: string): string[] {
    const regex = new RegExp(pattern);
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  // Get dependency information for a key
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

// Global cache instance
export const cacheManager = new CacheManager();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  POSTS: 5 * 60 * 1000,        // 5 minutes
  POST: 10 * 60 * 1000,        // 10 minutes
  CATEGORIES: 30 * 60 * 1000,   // 30 minutes
  TAGS: 30 * 60 * 1000,         // 30 minutes
  MEDIA: 60 * 60 * 1000,        // 1 hour
  SEARCH: 2 * 60 * 1000,        // 2 minutes
  AUTHOR: 30 * 60 * 1000,       // 30 minutes
} as const;

// Cache key generators
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

// Dependency helpers for cache relationships
export const CACHE_DEPENDENCIES = {
  // Post depends on its categories, tags, and media
  post: (postId: number | string, categories: number[], tags: number[], mediaId: number): string[] => {
    const deps: string[] = [];
    categories.forEach(catId => deps.push(CACHE_KEYS.category(catId.toString())));
    tags.forEach(tagId => deps.push(CACHE_KEYS.tag(tagId.toString())));
    if (mediaId > 0) deps.push(CACHE_KEYS.media(mediaId));
    return deps;
  },

  // Posts list depends on categories and tags
  postsList: (categories: number[] = [], tags: number[] = []): string[] => {
    const deps: string[] = [];
    categories.forEach(catId => deps.push(CACHE_KEYS.category(catId.toString())));
    tags.forEach(tagId => deps.push(CACHE_KEYS.tag(tagId.toString())));
    return deps;
  },

  // Media depends on nothing (leaf node)
  media: () => [],

  // Author depends on nothing (leaf node)
  author: () => [],

  // Categories and tags depend on nothing (leaf nodes)
  categories: () => [],
  tags: () => [],
} as const;