interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
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
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  // Set data in cache
  set<T>(key: string, data: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    this.cache.set(key, entry);
    this.stats.sets++;
  }

  // Delete specific cache entry
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  // Clear all cache
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
  }

  // Clear cache entries matching a pattern
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
  }

  // Get cache statistics
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      total,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.cache.size,
    };
  }

  // Clean up expired entries
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    });
    
    this.stats.deletes += cleaned;
    return cleaned;
  }

  // Get cache size in bytes (rough estimate)
  getMemoryUsage(): number {
    let totalSize = 0;
    this.cache.forEach((entry, key) => {
      totalSize += key.length * 2; // String size (rough estimate)
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 24; // Estimated overhead
    });
    return totalSize;
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

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cacheManager.cleanup();
    if (cleaned > 0) {
      console.warn(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }, 5 * 60 * 1000);
}