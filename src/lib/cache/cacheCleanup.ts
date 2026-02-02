import type { CacheEntry } from './types';

export interface CleanupResult {
  expired: number;
  orphans: number;
  total: number;
}

export class CacheCleanup {
  constructor(private cache: Map<string, CacheEntry<unknown>>) {}

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
      this.cache.delete(key);
      cleaned++;
    });

    return cleaned;
  }

  cleanupOrphanDependencies(): number {
    let cleaned = 0;

    this.cache.forEach((entry) => {
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

  cleanupAll(): CleanupResult {
    let expired = 0;
    let orphans = 0;
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
        expired++;
      } else if (entry.dependencies) {
        const validDeps: string[] = [];
        entry.dependencies.forEach(depKey => {
          if (!this.cache.has(depKey)) {
            orphans++;
          } else {
            validDeps.push(depKey);
          }
        });
        
        if (validDeps.length !== entry.dependencies.size) {
          entry.dependencies = new Set(validDeps);
        }
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });

    return {
      expired,
      orphans,
      total: expired + orphans
    };
  }
}
