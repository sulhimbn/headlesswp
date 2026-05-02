/**
 * Smart Prefetch Service
 * 
 * Intelligent cache prefetching service that uses navigation patterns
 * and prediction engine to preload likely next pages into cache.
 * 
 * @module prefetch/smartPrefetch
 */

import type { 
  PredictionResult, 
  PrefetchTask, 
  PrefetchConfig, 
  PrefetchStats,
  PageCategory 
} from './types';
import { navigationTracker } from './navigationTracker';
import { predictionEngine } from './predictionEngine';
import { cacheManager, CACHE_TTL } from '@/lib/cache';
import { enhancedPostService } from '@/lib/services/enhancedPostService';
import { logger } from '@/lib/utils/logger';

/**
 * Default configuration for smart prefetch
 */
export const DEFAULT_PREFETCH_CONFIG: PrefetchConfig = {
  maxConcurrentPrefetches: 3,
  patternWindowMs: 5 * 60 * 1000, // 5 minutes
  minConfidenceThreshold: 0.3,
  maxPredictions: 5,
  prefetchTtlMs: 5 * 60 * 1000, // 5 minutes
  sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
  maxEventsPerSession: 50,
};

/**
 * Smart Prefetch Service class
 * 
 * Coordinates navigation tracking, prediction, and prefetch execution
 * to intelligently preload likely next pages.
 */
class SmartPrefetchService {
  private config: PrefetchConfig;
  private taskQueue: PrefetchTask[] = [];
  private activePrefetches = 0;
  private stats: PrefetchStats = {
    prefetchRequests: 0,
    prefetchHits: 0,
    prefetchMisses: 0,
    predictionsGenerated: 0,
    avgConfidence: 0,
    activeSessions: 0,
  };
  private totalConfidence = 0;
  private confidenceCount = 0;
  private prefetchInProgress = false;

  constructor(config: Partial<PrefetchConfig> = {}) {
    this.config = { ...DEFAULT_PREFETCH_CONFIG, ...config };
  }

  /**
   * Initialize the smart prefetch system
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Smart Prefetch Service', { module: 'SmartPrefetch' });
    
    // Warm up category popular pages
    await this.warmupCategoryPages();
    
    logger.info('Smart Prefetch Service initialized', { 
      module: 'SmartPrefetch',
      config: this.config 
    });
  }

  /**
   * Warm up initial category pages
   */
  private async warmupCategoryPages(): Promise<void> {
    try {
      const [categories, latestPosts] = await Promise.all([
        enhancedPostService.getCategories(),
        enhancedPostService.getLatestPosts(),
      ]);

      // Cache popular pages per category
      if (categories.length > 0) {
        const categoryIds = categories.slice(0, 5).map(c => c.id);
        await Promise.all(
          categoryIds.map(async (catId) => {
            const result = await enhancedPostService.getPostsByCategory(catId, 1, 5);
            return result.posts;
          })
        );
      }

      logger.debug('Category pages warmed up', { 
        module: 'SmartPrefetch',
        categoriesCount: categories.length 
      });
    } catch (error) {
      logger.warn('Failed to warm up category pages', error, { 
        module: 'SmartPrefetch' 
      });
    }
  }

  /**
   * Track user navigation and trigger prefetch
   */
  async trackAndPrefetch(
    sessionId: string,
    pagePath: string,
    referrer?: string,
    deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop'
  ): Promise<PredictionResult[]> {
    // Track the navigation
    navigationTracker.trackNavigation(sessionId, pagePath, referrer, deviceType);

    // Update stats
    this.stats.activeSessions = navigationTracker.getActiveSessionCount();
    this.stats.prefetchRequests++;

    // Generate predictions
    const pageCategory = this.getPageCategory(pagePath);
    const predictions = await predictionEngine.generatePredictions(
      sessionId,
      pagePath,
      pageCategory
    );

    // Update stats
    this.stats.predictionsGenerated += predictions.length;
    if (predictions.length > 0) {
      const avgConf = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
      this.totalConfidence += avgConf;
      this.confidenceCount++;
      this.stats.avgConfidence = this.totalConfidence / this.confidenceCount;
    }

    // Queue prefetch tasks for high-confidence predictions
    const queueablePredictions = predictions.filter(
      p => p.confidence >= this.config.minConfidenceThreshold
    );

    this.queuePrefetchTasks(queueablePredictions);

    // Process queue if not already running
    this.processQueue();

    return predictions;
  }

  /**
   * Get page category from path
   */
  private getPageCategory(pagePath: string): PageCategory {
    const path = pagePath.toLowerCase();
    
    if (path === '/' || path === '') return 'home';
    if (path.startsWith('/berita/') && path.split('/').length > 2) return 'post_detail';
    if (path.startsWith('/berita')) return 'post_list';
    if (path.startsWith('/kategori/')) return 'category';
    if (path.startsWith('/tag/')) return 'tag';
    if (path.startsWith('/author/')) return 'author';
    if (path.startsWith('/cari')) return 'search';
    if (path.startsWith('/media/')) return 'media';
    
    return 'static';
  }

  /**
   * Queue prefetch tasks
   */
  private queuePrefetchTasks(predictions: PredictionResult[]): void {
    const now = Date.now();
    
    for (const prediction of predictions) {
      // Check if already in queue
      const existingIndex = this.taskQueue.findIndex(
        t => t.cacheKey === prediction.cacheKey
      );
      
      if (existingIndex === -1) {
        const task: PrefetchTask = {
          pagePath: prediction.pagePath,
          cacheKey: prediction.cacheKey,
          priority: prediction.priority,
          scheduledAt: now,
          retryCount: 0,
        };
        
        this.taskQueue.push(task);
      }
    }

    // Sort by priority
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    
    // Limit queue size
    if (this.taskQueue.length > 20) {
      this.taskQueue = this.taskQueue.slice(0, 20);
    }
  }

  /**
   * Process prefetch queue
   */
  private async processQueue(): Promise<void> {
    if (this.prefetchInProgress) return;
    if (this.taskQueue.length === 0) return;

    this.prefetchInProgress = true;

    while (
      this.taskQueue.length > 0 && 
      this.activePrefetches < this.config.maxConcurrentPrefetches
    ) {
      const task = this.taskQueue.shift();
      if (!task) break;

      this.activePrefetches++;
      
      this.executePrefetch(task).finally(() => {
        this.activePrefetches--;
      });
    }

    this.prefetchInProgress = false;
  }

  /**
   * Execute a single prefetch task
   */
  private async executePrefetch(task: PrefetchTask): Promise<void> {
    try {
      logger.debug('Executing prefetch', { 
        module: 'SmartPrefetch',
        pagePath: task.pagePath,
        cacheKey: task.cacheKey 
      });

      // Check if already cached
      const cached = cacheManager.get(task.cacheKey);
      if (cached) {
        this.stats.prefetchHits++;
        logger.debug('Prefetch cache hit', { 
          module: 'SmartPrefetch',
          cacheKey: task.cacheKey 
        });
        return;
      }

      // Fetch and cache the content
      await this.fetchAndCacheContent(task);
      
      this.stats.prefetchHits++;
      
      logger.debug('Prefetch completed', { 
        module: 'SmartPrefetch',
        pagePath: task.pagePath 
      });
    } catch (error) {
      this.stats.prefetchMisses++;
      
      // Retry if not too many attempts
      if (task.retryCount < 2) {
        task.retryCount++;
        task.scheduledAt = Date.now();
        this.taskQueue.push(task);
      }
      
      logger.warn('Prefetch failed', error, { 
        module: 'SmartPrefetch',
        pagePath: task.pagePath,
        retryCount: task.retryCount 
      });
    }
  }

  /**
   * Fetch and cache content for a page
   */
  private async fetchAndCacheContent(task: PrefetchTask): Promise<void> {
    const path = task.pagePath.toLowerCase();

    // Handle different page types
    if (path.startsWith('/berita/')) {
      const slug = path.replace('/berita/', '');
      const post = await enhancedPostService.getPostBySlug(slug);
      if (post) {
        cacheManager.set(task.cacheKey, post, this.config.prefetchTtlMs);
      }
    } else if (path.startsWith('/kategori/')) {
      const slug = path.replace('/kategori/', '');
      const categories = await enhancedPostService.getCategories();
      const category = categories.find(c => c.slug === slug);
      if (category) {
        const posts = await enhancedPostService.getPostsByCategory(category.id, 1, 12);
        cacheManager.set(task.cacheKey, posts, this.config.prefetchTtlMs);
      }
    } else if (path.startsWith('/tag/')) {
      // Handle tag pages similarly
      const posts = await enhancedPostService.getLatestPosts();
      cacheManager.set(task.cacheKey, { posts, totalPosts: posts.length, totalPages: 1 }, this.config.prefetchTtlMs);
    } else if (path === '/' || path === '') {
      const posts = await enhancedPostService.getLatestPosts();
      cacheManager.set(task.cacheKey, posts, this.config.prefetchTtlMs);
    } else {
      // Generic page - just prefetch latest posts
      const posts = await enhancedPostService.getLatestPosts();
      cacheManager.set(task.cacheKey, posts, this.config.prefetchTtlMs);
    }
  }

  /**
   * Get prefetch statistics
   */
  getStats(): PrefetchStats {
    return {
      ...this.stats,
      activeSessions: navigationTracker.getActiveSessionCount(),
    };
  }

  /**
   * Get pending prefetch tasks count
   */
  getPendingTasksCount(): number {
    return this.taskQueue.length;
  }

  /**
   * Clear prefetch queue
   */
  clearQueue(): void {
    this.taskQueue = [];
    logger.info('Prefetch queue cleared', { module: 'SmartPrefetch' });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PrefetchConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Prefetch config updated', { 
      module: 'SmartPrefetch',
      config: this.config 
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): PrefetchConfig {
    return { ...this.config };
  }

  /**
   * Reset all stats and clear data
   */
  reset(): void {
    this.taskQueue = [];
    this.stats = {
      prefetchRequests: 0,
      prefetchHits: 0,
      prefetchMisses: 0,
      predictionsGenerated: 0,
      avgConfidence: 0,
      activeSessions: 0,
    };
    this.totalConfidence = 0;
    this.confidenceCount = 0;
    navigationTracker.reset();
    predictionEngine.clearCache();
    
    logger.info('Smart Prefetch reset', { module: 'SmartPrefetch' });
  }
}

// Export singleton instance
export const smartPrefetch = new SmartPrefetchService();
export default smartPrefetch;
