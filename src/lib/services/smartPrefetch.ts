import { cacheManager, CACHE_TTL, cacheKeys } from '../cache';
import { getReadingHistory, getTopCategories, getTopTags } from '../utils/readingHistory';
import { wordpressAPI } from '../wordpress';
import { logger } from '@/lib/utils/logger';

interface PrefetchPrediction {
  targetUrl: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  reason: string;
}

interface PrefetchResult {
  url: string;
  status: 'success' | 'skipped' | 'failed';
  latency?: number;
  error?: string;
}

class SmartPrefetchEngine {
  private static instance: SmartPrefetchEngine | null = null;
  private prefetchQueue: PrefetchPrediction[] = [];
  private isProcessing = false;
  private lastPredictions: PrefetchPrediction[] = [];
  private readonly MAX_PREFETCHES = 5;
  private readonly CONFIDENCE_THRESHOLD = 0.3;

  private constructor() {}

  static getInstance(): SmartPrefetchEngine {
    if (!SmartPrefetchEngine.instance) {
      SmartPrefetchEngine.instance = new SmartPrefetchEngine();
    }
    return SmartPrefetchEngine.instance;
  }

  async predictNextPages(currentPostId?: number, currentSlug?: string): Promise<PrefetchPrediction[]> {
    const predictions: PrefetchPrediction[] = [];
    const history = getReadingHistory();

    if (history.items.length === 0) {
      return this.getDefaultPredictions();
    }

    const categoryPredictions = this.predictByCategories(history);
    predictions.push(...categoryPredictions);

    const tagPredictions = this.predictByTags(history);
    predictions.push(...tagPredictions);

    const sequencePrediction = this.predictBySequence(history, currentPostId, currentSlug);
    if (sequencePrediction) {
      predictions.push(sequencePrediction);
    }

    const deduplicated = this.deduplicatePredictions(predictions);
    const sorted = this.sortByPriority(deduplicated);
    const limited = sorted.slice(0, this.MAX_PREFETCHES);

    this.lastPredictions = limited;
    return limited;
  }

  private predictByCategories(history: ReturnType<typeof getReadingHistory>): PrefetchPrediction[] {
    const predictions: PrefetchPrediction[] = [];
    const topCategories = getTopCategories(3);

    if (topCategories.length === 0) return predictions;

    const topCategory = topCategories[0];
    const categoryCount = history.categoryPreferences.get(topCategory) || 1;
    const totalCategories = Array.from(history.categoryPreferences.values()).reduce((a, b) => a + b, 0);
    const confidence = Math.min(categoryCount / totalCategories, 1);

    if (confidence >= this.CONFIDENCE_THRESHOLD) {
      predictions.push({
        targetUrl: `/kategori/${topCategory}`,
        priority: confidence > 0.5 ? 'high' : 'medium',
        confidence,
        reason: `User frequently reads from category ${topCategory} (${Math.round(confidence * 100)}% of reading)`
      });
    }

    if (topCategories.length > 1) {
      const secondCategory = topCategories[1];
      const secondConfidence = (history.categoryPreferences.get(secondCategory) || 0) / totalCategories;
      if (secondConfidence >= this.CONFIDENCE_THRESHOLD) {
        predictions.push({
          targetUrl: `/kategori/${secondCategory}`,
          priority: 'medium',
          confidence: secondConfidence,
          reason: `Secondary interest in category ${secondCategory}`
        });
      }
    }

    return predictions;
  }

  private predictByTags(history: ReturnType<typeof getReadingHistory>): PrefetchPrediction[] {
    const predictions: PrefetchPrediction[] = [];
    const topTags = getTopTags(3);

    if (topTags.length === 0) return predictions;

    const primaryTag = topTags[0];
    const tagCount = history.tagPreferences.get(primaryTag) || 1;
    const totalTags = Array.from(history.tagPreferences.values()).reduce((a, b) => a + b, 0);
    const confidence = Math.min(tagCount / totalTags, 0.8);

    if (confidence >= this.CONFIDENCE_THRESHOLD) {
      predictions.push({
        targetUrl: `/tag/${primaryTag}`,
        priority: 'medium',
        confidence,
        reason: `User interested in tag ${primaryTag} (${Math.round(confidence * 100)}% affinity)`
      });
    }

    return predictions;
  }

  private predictBySequence(
    history: ReturnType<typeof getReadingHistory>,
    currentPostId?: number,
    _currentSlug?: string
  ): PrefetchPrediction | null {
    if (!currentPostId || history.items.length < 2) {
      return null;
    }

    const recentItems = history.items.slice(0, 5);
    const categoryFrequency = new Map<number, number>();

    recentItems.forEach(item => {
      item.categoryIds.forEach(catId => {
        categoryFrequency.set(catId, (categoryFrequency.get(catId) || 0) + 1);
      });
    });

    const sortedCategories = Array.from(categoryFrequency.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length > 0 && sortedCategories[0][1] >= 2) {
      return {
        targetUrl: `/kategori/${sortedCategories[0][0]}`,
        priority: 'medium',
        confidence: 0.4,
        reason: 'Sequential reading pattern detected in category'
      };
    }

    return null;
  }

  private getDefaultPredictions(): PrefetchPrediction[] {
    return [
      {
        targetUrl: '/berita',
        priority: 'low',
        confidence: 0.1,
        reason: 'Default homepage prediction for new users'
      }
    ];
  }

  private deduplicatePredictions(predictions: PrefetchPrediction[]): PrefetchPrediction[] {
    const seen = new Set<string>();
    return predictions.filter(p => {
      const key = p.targetUrl;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private sortByPriority(predictions: PrefetchPrediction[]): PrefetchPrediction[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return predictions.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  async prefetchPredictedContent(predictions?: PrefetchPrediction[]): Promise<PrefetchResult[]> {
    const preds = predictions || this.lastPredictions;
    if (preds.length === 0) {
      return [];
    }

    const results: PrefetchResult[] = [];
    const batchPromises = preds
      .filter(p => p.confidence >= this.CONFIDENCE_THRESHOLD)
      .map(async (prediction) => {
        const result = await this.prefetchUrl(prediction);
        results.push(result);
        return result;
      });

    await Promise.allSettled(batchPromises);
    return results;
  }

  private async prefetchUrl(prediction: PrefetchPrediction): Promise<PrefetchResult> {
    const startTime = Date.now();
    const url = prediction.targetUrl;

    try {
      if (url.startsWith('/kategori/')) {
        const categorySlug = url.split('/kategori/')[1];
        const cacheKey = cacheKeys.category(categorySlug);
        
        if (!cacheManager.get(cacheKey)) {
          const category = await wordpressAPI.getCategory(categorySlug);
          if (category) {
            const posts = await wordpressAPI.getPosts({ category: category.id, per_page: 6 });
            cacheManager.set(cacheKeys.posts(categorySlug), posts, CACHE_TTL.POSTS);
          }
        }
      } else if (url.startsWith('/tag/')) {
        const tagSlug = url.split('/tag/')[1];
        const cacheKey = cacheKeys.tag(tagSlug);
        
        if (!cacheManager.get(cacheKey)) {
          const tag = await wordpressAPI.getTag(tagSlug);
          if (tag) {
            const posts = await wordpressAPI.getPosts({ tag: tag.id, per_page: 6 });
            cacheManager.set(cacheKeys.posts(tagSlug), posts, CACHE_TTL.POSTS);
          }
        }
      } else if (url === '/berita') {
        const cacheKey = cacheKeys.posts();
        if (!cacheManager.get(cacheKey)) {
          const posts = await wordpressAPI.getPosts({ per_page: 6 });
          cacheManager.set(cacheKey, posts, CACHE_TTL.POSTS);
        }
      }

      return {
        url,
        status: 'success',
        latency: Date.now() - startTime
      };
    } catch (error) {
      logger.warn(`Prefetch failed for ${url}`, { error: String(error), module: 'SmartPrefetch' });
      return {
        url,
        status: 'failed',
        latency: Date.now() - startTime,
        error: String(error)
      };
    }
  }

  getLastPredictions(): PrefetchPrediction[] {
    return this.lastPredictions;
  }

  getStats() {
    return {
      lastPredictionCount: this.lastPredictions.length,
      predictions: this.lastPredictions.map(p => ({
        url: p.targetUrl,
        confidence: p.confidence,
        priority: p.priority
      }))
    };
  }
}

export const smartPrefetchEngine = SmartPrefetchEngine.getInstance();
export type { PrefetchPrediction, PrefetchResult };
export default smartPrefetchEngine;