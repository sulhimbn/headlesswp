import { wordpressAPI } from '../wordpress';
import { cacheManager, CACHE_TTL } from '../cache';
import { logger } from '@/lib/utils/logger';

interface CacheWarmResult {
  name: string;
  status: 'success' | 'failed';
  error?: string;
  latency?: number;
}

class CacheWarmer {
  async warmAll(): Promise<{ total: number; success: number; failed: number; results: CacheWarmResult[] }> {
    const startTime = Date.now();
    const results: CacheWarmResult[] = [];

    try {
      logger.info('Starting cache warming...', { module: 'CacheWarmer' });

      const warmPromises = [
        this.warmLatestPosts(),
        this.warmCategories(),
        this.warmTags(),
      ];

      const settledResults = await Promise.allSettled(warmPromises);

      settledResults.forEach((result, index) => {
        const names = ['latest posts', 'categories', 'tags'];
        const name = names[index];

        if (result.status === 'fulfilled') {
          results.push({ name, status: 'success', latency: result.value });
        } else {
          results.push({ name, status: 'failed', error: String(result.reason) });
        }
      });

      const success = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'failed').length;
      const total = results.length;

      const totalLatency = Date.now() - startTime;

      logger.info(
        `Cache warming completed: ${success}/${total} succeeded in ${totalLatency}ms`,
        { module: 'CacheWarmer', results }
      );

      return { total, success, failed, results };
    } catch (error) {
      logger.error('Cache warming failed', error, { module: 'CacheWarmer' });
      return { total: 0, success: 0, failed: 0, results };
    }
  }

  private async warmLatestPosts(): Promise<number> {
    const startTime = Date.now();
    try {
      await wordpressAPI.getPosts({ per_page: 6 });
      return Date.now() - startTime;
    } catch (error) {
      throw error;
    }
  }

  private async warmCategories(): Promise<number> {
    const startTime = Date.now();
    try {
      const categories = await wordpressAPI.getCategories();
      cacheManager.set('categories', categories, CACHE_TTL.CATEGORIES);
      return Date.now() - startTime;
    } catch (error) {
      throw error;
    }
  }

  private async warmTags(): Promise<number> {
    const startTime = Date.now();
    try {
      const tags = await wordpressAPI.getTags();
      cacheManager.set('tags', tags, CACHE_TTL.TAGS);
      return Date.now() - startTime;
    } catch (error) {
      throw error;
    }
  }

  getStats(): { hits: number; misses: number; hitsRate: number } {
    const stats = cacheManager.getStats();
    const hitsRate = stats.hits + stats.misses > 0
      ? (stats.hits / (stats.hits + stats.misses)) * 100
      : 0;

    return {
      hits: stats.hits,
      misses: stats.misses,
      hitsRate: Math.round(hitsRate * 100) / 100
    };
  }
}

export const cacheWarmer = new CacheWarmer();
export default cacheWarmer;
