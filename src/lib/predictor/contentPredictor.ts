import type { WordPressPost } from '@/types/wordpress';
import { wordpressAPI } from '../wordpress';
import { cacheManager, CACHE_TTL, cacheKeys } from '../cache';
import { popularityTracker } from './popularityTracker';
import { logger } from '@/lib/utils/logger';

export interface PredictionResult {
  postId: number;
  slug: string;
  score: number;
  reason: 'popular' | 'category' | 'tag' | 'similar';
}

export interface PrefetchCandidate {
  postId: number;
  slug: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
  score: number;
}

const DEFAULT_PREDICTION_COUNT = 5;
const PREFETCH_THRESHOLD_SCORE = 0.5;
const HIGH_PRIORITY_THRESHOLD = 3;
const MEDIUM_PRIORITY_THRESHOLD = 1;

class ContentPredictor {
  private predictionCache = new Map<string, { predictions: PredictionResult[]; timestamp: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  async predictNextPosts(
    currentPostSlug: string,
    categories: number[],
    tags: number[],
    limit: number = DEFAULT_PREDICTION_COUNT
  ): Promise<PredictionResult[]> {
    const cacheKey = `predictions:${currentPostSlug}:${categories.join(',')}:${tags.join(',')}`;
    const cached = this.predictionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.predictions;
    }

    const predictions: PredictionResult[] = [];
    await wordpressAPI.getPost(currentPostSlug);
    const allPosts = await wordpressAPI.getPosts({ per_page: 100 });
    
    const scoredPosts = allPosts
      .filter(post => post.slug !== currentPostSlug)
      .map(post => {
        const postPopularity = popularityTracker.getPostPopularity(post.id);
        const viewCount = postPopularity?.viewCount || 0;
        
        const categoryOverlap = post.categories.filter(c => categories.includes(c)).length;
        const tagOverlap = post.tags.filter(t => tags.includes(t)).length;
        
        const categoryScore = categoryOverlap * 2;
        const tagScore = tagOverlap * 1.5;
        const popularityScore = Math.log(viewCount + 1);
        
        let reason: PredictionResult['reason'] = 'similar';
        if (viewCount >= 10 && categoryOverlap === 0 && tagOverlap === 0) {
          reason = 'popular';
        } else if (categoryOverlap > 0 && tagOverlap === 0) {
          reason = 'category';
        } else if (tagOverlap > 0) {
          reason = 'tag';
        }
        
        const totalScore = categoryScore + tagScore + popularityScore;
        
        return {
          postId: post.id,
          slug: post.slug,
          score: totalScore,
          reason,
        };
      });

    scoredPosts.sort((a, b) => b.score - a.score);
    const topPredictions = scoredPosts.slice(0, limit);
    
    predictions.push(...topPredictions);
    
    this.predictionCache.set(cacheKey, { 
      predictions, 
      timestamp: Date.now() 
    });

    return predictions;
  }

  getPrefetchCandidates(
    categories: number[],
    tags: number[],
    currentSlug: string
  ): PrefetchCandidate[] {
    const predictions = popularityTracker.getPopularPosts(20);
    const categoryPredictions = categories.flatMap(catId => 
      popularityTracker.getPopularPostsByCategory(catId, 5)
    );
    
    const allCandidates = new Map<number, { slug: string; score: number; reason: string }>();

    predictions.forEach(post => {
      if (post.slug !== currentSlug) {
        allCandidates.set(post.postId, {
          slug: post.slug,
          score: popularityTracker.getScore(post.postId),
          reason: 'popular',
        });
      }
    });

    categoryPredictions.forEach(post => {
      if (post.slug !== currentSlug) {
        const existing = allCandidates.get(post.postId);
        const newScore = popularityTracker.getScore(post.postId);
        if (!existing || newScore > existing.score) {
          allCandidates.set(post.postId, {
            slug: post.slug,
            score: newScore,
            reason: 'category',
          });
        }
      }
    });

    tags.forEach(tagId => {
      const affinity = popularityTracker.getTagAffinity(tagId);
      if (affinity) {
        const relatedPosts = Array.from(
          (popularityTracker as unknown as { store: { posts: Map<number, unknown> } }).store.posts.values() as Iterable<{ postId: number; slug: string; tags: number[]; viewCount: number }>
        ).filter(post => post.tags.includes(tagId) && post.slug !== currentSlug);
        
        relatedPosts.forEach(post => {
          const existing = allCandidates.get(post.postId);
          const score = popularityTracker.getScore(post.postId);
          if (!existing || score > existing.score) {
            allCandidates.set(post.postId, {
              slug: post.slug,
              score,
              reason: 'tag',
            });
          }
        });
      }
    });

    const candidates: PrefetchCandidate[] = Array.from(allCandidates.entries())
      .filter(([_, data]) => data.score >= PREFETCH_THRESHOLD_SCORE)
      .map(([postId, data]): PrefetchCandidate => {
        const priority: 'high' | 'medium' | 'low' = data.score >= HIGH_PRIORITY_THRESHOLD ? 'high' : 
          data.score >= MEDIUM_PRIORITY_THRESHOLD ? 'medium' : 'low';
        return {
          postId,
          slug: data.slug,
          url: `/berita/${data.slug}`,
          priority,
          score: data.score,
        };
      })
      .sort((a, b) => b.score - a.score);

    return candidates.slice(0, DEFAULT_PREDICTION_COUNT);
  }

  async prefetchPredictedPosts(candidates: PrefetchCandidate[]): Promise<void> {
    const highPriority = candidates.filter(c => c.priority === 'high');
    const mediumPriority = candidates.filter(c => c.priority === 'medium');

    for (const candidate of highPriority) {
      try {
        const cacheKey = cacheKeys.post(candidate.slug);
        const existing = cacheManager.get<WordPressPost>(cacheKey);
        
        if (!existing) {
          const post = await wordpressAPI.getPost(candidate.slug);
          cacheManager.set(cacheKey, post, CACHE_TTL.POST);
          logger.debug('Prefetched post', { module: 'ContentPredictor', slug: candidate.slug });
        }
      } catch (error) {
        logger.warn('Failed to prefetch post', error, { 
          module: 'ContentPredictor', 
          slug: candidate.slug 
        });
      }
    }

    setTimeout(async () => {
      for (const candidate of mediumPriority) {
        try {
          const cacheKey = cacheKeys.post(candidate.slug);
          const existing = cacheManager.get<WordPressPost>(cacheKey);
          
          if (!existing) {
            const post = await wordpressAPI.getPost(candidate.slug);
            cacheManager.set(cacheKey, post, CACHE_TTL.POST);
            logger.debug('Prefetched post (medium priority)', { module: 'ContentPredictor', slug: candidate.slug });
          }
        } catch (error) {
          logger.warn('Failed to prefetch post', error, { 
            module: 'ContentPredictor', 
            slug: candidate.slug 
          });
        }
      }
    }, 2000);
  }

  getPopularPostsFromCache(limit: number = 10): PredictionResult[] {
    const popularPosts = popularityTracker.getPopularPosts(limit);
    return popularPosts.map(post => ({
      postId: post.postId,
      slug: post.slug,
      score: popularityTracker.getScore(post.postId),
      reason: 'popular' as const,
    }));
  }

  clearCache(): void {
    this.predictionCache.clear();
  }
}

export const contentPredictor = new ContentPredictor();
export default contentPredictor;
