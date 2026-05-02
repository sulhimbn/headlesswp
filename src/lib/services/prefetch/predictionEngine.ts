/**
 * Prediction Engine
 * 
 * AI-native prediction engine that analyzes navigation patterns to predict
 * likely next pages for intelligent cache prefetching.
 * 
 * Uses multiple prediction strategies:
 * - Sequential: Next page in user's navigation sequence
 * - Category popular: Popular pages in current category
 * - Related content: Related posts/tags/categories
 * - Frequent path: Common navigation paths
 * - New content: Recently published in visited areas
 * 
 * @module prefetch/predictionEngine
 */

import type { PredictionResult, PredictionReason, NavigationPattern, PageCategory } from './types';
import { navigationTracker } from './navigationTracker';
import { cacheManager, cacheKeys, CACHE_TTL } from '@/lib/cache';
import { enhancedPostService } from '@/lib/services/enhancedPostService';
import { logger } from '@/lib/utils/logger';

interface PredictionWeights {
  sequential: number;
  categoryPopular: number;
  relatedContent: number;
  frequentPath: number;
  newContent: number;
}

const DEFAULT_WEIGHTS: PredictionWeights = {
  sequential: 0.35,
  categoryPopular: 0.25,
  relatedContent: 0.20,
  frequentPath: 0.15,
  newContent: 0.05,
};

/**
 * Prediction Engine class
 * 
 * Analyzes navigation patterns and generates predictions for likely next pages.
 */
class PredictionEngine {
  private weights: PredictionWeights;
  private minConfidence: number;
  private maxPredictions: number;
  private categoryPopularPages = new Map<string, string[]>();
  private relatedContentCache = new Map<string, string[]>();

  constructor(
    weights: PredictionWeights = DEFAULT_WEIGHTS,
    minConfidence = 0.3,
    maxPredictions = 5
  ) {
    this.weights = weights;
    this.minConfidence = minConfidence;
    this.maxPredictions = maxPredictions;
  }

  /**
   * Generate predictions for next likely pages
   */
  async generatePredictions(
    sessionId: string,
    currentPage: string,
    pageCategory: PageCategory
  ): Promise<PredictionResult[]> {
    const predictions: PredictionResult[] = [];

    try {
      // 1. Sequential prediction (most important)
      const sequentialPredictions = this.predictSequential(sessionId, currentPage);
      predictions.push(...sequentialPredictions);

      // 2. Category popular pages
      const categoryPredictions = await this.predictCategoryPopular(currentPage, pageCategory);
      predictions.push(...categoryPredictions);

      // 3. Related content (tags, categories)
      const relatedPredictions = await this.predictRelatedContent(currentPage, pageCategory);
      predictions.push(...relatedPredictions);

      // 4. Frequent paths
      const pathPredictions = this.predictFrequentPath(sessionId, currentPage);
      predictions.push(...pathPredictions);

      // 5. New content
      const newContentPredictions = await this.predictNewContent(currentPage, pageCategory);
      predictions.push(...newContentPredictions);

      // Merge and rank predictions
      const mergedPredictions = this.mergeAndRankPredictions(predictions);
      
      // Filter by confidence and limit
      const filteredPredictions = mergedPredictions
        .filter(p => p.confidence >= this.minConfidence)
        .slice(0, this.maxPredictions);

      logger.debug('Generated predictions', {
        module: 'PredictionEngine',
        currentPage,
        count: filteredPredictions.length,
        topConfidence: filteredPredictions[0]?.confidence || 0
      });

      return filteredPredictions;
    } catch (error) {
      logger.error('Prediction generation failed', error, { module: 'PredictionEngine' });
      return [];
    }
  }

  /**
   * Predict next page in user's navigation sequence
   */
  private predictSequential(sessionId: string, currentPage: string): PredictionResult[] {
    const session = navigationTracker.getSessionPattern(sessionId);
    if (!session || session.path.length < 2) return [];

    const currentIndex = session.path.indexOf(currentPage);
    if (currentIndex === -1 || currentIndex >= session.path.length - 1) return [];

    const nextPage = session.path[currentIndex + 1];
    
    // Calculate confidence based on path consistency
    const pathLength = session.path.length;
    const confidence = Math.min(0.9, 0.5 + (pathLength * 0.05));

    return [{
      pagePath: nextPage,
      confidence,
      reason: 'sequential',
      cacheKey: this.getCacheKeyForPath(nextPage),
      priority: this.weights.sequential * confidence,
    }];
  }

  /**
   * Predict popular pages in the same category
   */
  private async predictCategoryPopular(
    currentPage: string,
    pageCategory: PageCategory
  ): Promise<PredictionResult[]> {
    // Check cache first
    const cached = this.categoryPopularPages.get(pageCategory);
    if (cached) {
      return cached.slice(0, 3).map(pagePath => ({
        pagePath,
        confidence: 0.4,
        reason: 'category_popular' as PredictionReason,
        cacheKey: this.getCacheKeyForPath(pagePath),
        priority: this.weights.categoryPopular * 0.4,
      }));
    }

    // Try to get from cache manager or fetch fresh
    try {
      const cachedPosts = cacheManager.get<unknown[]>(cacheKeys.posts('popular'));
      if (cachedPosts && Array.isArray(cachedPosts)) {
        const popularPaths = (cachedPosts as Array<{ slug?: string }>)
          .slice(0, 5)
          .map(post => `/berita/${post.slug}`)
          .filter(Boolean);

        this.categoryPopularPages.set(pageCategory, popularPaths);

        return popularPaths.slice(0, 3).map(pagePath => ({
          pagePath,
          confidence: 0.4,
          reason: 'category_popular' as PredictionReason,
          cacheKey: this.getCacheKeyForPath(pagePath),
          priority: this.weights.categoryPopular * 0.4,
        }));
      }
    } catch {
      // Ignore cache errors
    }

    return [];
  }

  /**
   * Predict related content based on tags/categories
   */
  private async predictRelatedContent(
    currentPage: string,
    pageCategory: PageCategory
  ): Promise<PredictionResult[]> {
    // For post detail pages, predict related posts
    if (pageCategory === 'post_detail') {
      const slug = currentPage.replace('/berita/', '');
      if (!slug) return [];

      try {
        const post = await enhancedPostService.getPostBySlug(slug);
        if (post && post.categories.length > 0) {
          const related = await enhancedPostService.getRelatedPosts(post.categories, post.id);
          
          return related.slice(0, 3).map(relatedPost => ({
            pagePath: `/berita/${relatedPost.slug}`,
            confidence: 0.35,
            reason: 'related_content' as PredictionReason,
            cacheKey: cacheKeys.post(relatedPost.slug),
            priority: this.weights.relatedContent * 0.35,
          }));
        }
      } catch (error) {
        logger.warn('Failed to get related content predictions', error, { 
          module: 'PredictionEngine' 
        });
      }
    }

    // For category pages, predict other posts in category
    if (pageCategory === 'category') {
      const categorySlug = currentPage.replace('/kategori/', '');
      if (!categorySlug) return [];

      try {
        const categories = await enhancedPostService.getCategories();
        const category = categories.find(c => c.slug === categorySlug);
        
        if (category) {
          const result = await enhancedPostService.getPostsByCategory(category.id, 1, 6);
          
          return result.posts.slice(0, 3).map(post => ({
            pagePath: `/berita/${post.slug}`,
            confidence: 0.35,
            reason: 'related_content' as PredictionReason,
            cacheKey: cacheKeys.post(post.slug),
            priority: this.weights.relatedContent * 0.35,
          }));
        }
      } catch (error) {
        logger.warn('Failed to get category predictions', error, { 
          module: 'PredictionEngine' 
        });
      }
    }

    return [];
  }

  /**
   * Predict based on frequent navigation paths
   */
  private predictFrequentPath(sessionId: string, currentPage: string): PredictionResult[] {
    const frequentPaths = navigationTracker.getFrequentPaths(3);
    if (frequentPaths.length === 0) return [];

    // Find paths that include current page
    const matchingPaths = frequentPaths.filter(p => 
      p.path.includes(currentPage)
    );

    if (matchingPaths.length === 0) return [];

    // Find the next page in the most frequent path
    const bestPath = matchingPaths[0];
    const currentIndex = bestPath.path.indexOf(currentPage);
    
    if (currentIndex === -1 || currentIndex >= bestPath.path.length - 1) return [];

    const nextPage = bestPath.path[currentIndex + 1];
    const pathConfidence = Math.min(0.6, (bestPath.count / 10) * 0.6);

    return [{
      pagePath: nextPage,
      confidence: pathConfidence,
      reason: 'frequent_path',
      cacheKey: this.getCacheKeyForPath(nextPage),
      priority: this.weights.frequentPath * pathConfidence,
    }];
  }

  /**
   * Predict new content in visited areas
   */
  private async predictNewContent(
    currentPage: string,
    pageCategory: PageCategory
  ): Promise<PredictionResult[]> {
    // Only predict for category/tag pages
    if (pageCategory !== 'category' && pageCategory !== 'tag') {
      return [];
    }

    try {
      const latestPosts = await enhancedPostService.getLatestPosts();
      
      if (latestPosts.length > 0) {
        return latestPosts.slice(0, 2).map(post => ({
          pagePath: `/berita/${post.slug}`,
          confidence: 0.2,
          reason: 'new_content' as PredictionReason,
          cacheKey: cacheKeys.post(post.slug),
          priority: this.weights.newContent * 0.2,
        }));
      }
    } catch (error) {
      logger.warn('Failed to get new content predictions', error, { 
        module: 'PredictionEngine' 
      });
    }

    return [];
  }

  /**
   * Merge and rank duplicate predictions
   */
  private mergeAndRankPredictions(predictions: PredictionResult[]): PredictionResult[] {
    const merged = new Map<string, PredictionResult>();

    for (const prediction of predictions) {
      const existing = merged.get(prediction.pagePath);
      
      if (existing) {
        // Average confidences and combine reasons
        const combinedConfidence = (existing.confidence + prediction.confidence) / 2;
        const combinedPriority = Math.max(existing.priority, prediction.priority);
        
        merged.set(prediction.pagePath, {
          ...existing,
          confidence: combinedConfidence,
          priority: combinedPriority,
          reason: `${existing.reason}+${prediction.reason}` as PredictionReason,
        });
      } else {
        merged.set(prediction.pagePath, prediction);
      }
    }

    return Array.from(merged.values())
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get cache key for a page path
   */
  private getCacheKeyForPath(pagePath: string): string {
    const path = pagePath.toLowerCase();
    
    if (path.startsWith('/berita/')) {
      const slug = path.replace('/berita/', '');
      return cacheKeys.post(slug);
    }
    if (path.startsWith('/kategori/')) {
      const slug = path.replace('/kategori/', '');
      return cacheKeys.category(slug);
    }
    if (path.startsWith('/tag/')) {
      const slug = path.replace('/tag/', '');
      return cacheKeys.tag(slug);
    }
    if (path.startsWith('/author/')) {
      const id = path.replace('/author/', '');
      return cacheKeys.author(parseInt(id, 10));
    }
    if (path === '/' || path === '') {
      return cacheKeys.posts();
    }
    
    return `page:${pagePath}`;
  }

  /**
   * Update prediction weights
   */
  setWeights(weights: Partial<PredictionWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  /**
   * Get current weights
   */
  getWeights(): PredictionWeights {
    return { ...this.weights };
  }

  /**
   * Clear cached predictions
   */
  clearCache(): void {
    this.categoryPopularPages.clear();
    this.relatedContentCache.clear();
  }
}

// Export singleton instance
export const predictionEngine = new PredictionEngine();
export default predictionEngine;
