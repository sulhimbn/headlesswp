import { cacheManager } from '../cache';
import { logger } from '@/lib/utils/logger';

export interface PopularityData {
  postId: number;
  slug: string;
  viewCount: number;
  lastViewed: number;
  categories: number[];
  tags: number[];
}

export interface CategoryAffinity {
  categoryId: number;
  totalViews: number;
  postsViewed: number;
}

export interface TagAffinity {
  tagId: number;
  totalViews: number;
  postsViewed: number;
}

interface PopularityStore {
  posts: Map<number, PopularityData>;
  categoryAffinities: Map<number, CategoryAffinity>;
  tagAffinities: Map<number, TagAffinity>;
}

const POPULARITY_KEY = 'popularity:data';
const POPULARITY_TTL = 24 * 60 * 60 * 1000;
const MAX_TRACKED_POSTS = 1000;
const MIN_VIEWS_FOR_POPULAR = 10;

class PopularityTracker {
  private store: PopularityStore = {
    posts: new Map(),
    categoryAffinities: new Map(),
    tagAffinities: new Map(),
  };

  constructor() {
    this.loadFromCache();
  }

  private loadFromCache(): void {
    try {
      const cached = cacheManager.get<PopularityStore>(POPULARITY_KEY);
      if (cached) {
        this.store = {
          posts: new Map(cached.posts),
          categoryAffinities: new Map(cached.categoryAffinities),
          tagAffinities: new Map(cached.tagAffinities),
        };
        logger.info('Popularity data loaded from cache', { 
          module: 'PopularityTracker',
          postCount: this.store.posts.size 
        });
      }
    } catch (error) {
      logger.warn('Failed to load popularity data from cache', error, { 
        module: 'PopularityTracker' 
      });
    }
  }

  private saveToCache(): void {
    try {
      const storeObj = {
        posts: Array.from(this.store.posts.entries()),
        categoryAffinities: Array.from(this.store.categoryAffinities.entries()),
        tagAffinities: Array.from(this.store.tagAffinities.entries()),
      };
      cacheManager.set(POPULARITY_KEY, storeObj, POPULARITY_TTL);
    } catch (error) {
      logger.warn('Failed to save popularity data to cache', error, { 
        module: 'PopularityTracker' 
      });
    }
  }

  private evictOldPosts(): void {
    if (this.store.posts.size >= MAX_TRACKED_POSTS) {
      const sortedPosts = Array.from(this.store.posts.values())
        .sort((a, b) => a.lastViewed - b.lastViewed);
      
      const toRemove = Math.floor(MAX_TRACKED_POSTS * 0.1);
      for (let i = 0; i < toRemove; i++) {
        this.store.posts.delete(sortedPosts[i].postId);
      }
    }
  }

  trackView(postId: number, slug: string, categories: number[], tags: number[]): void {
    const existing = this.store.posts.get(postId);
    const now = Date.now();

    if (existing) {
      existing.viewCount++;
      existing.lastViewed = now;
      existing.categories = categories;
      existing.tags = tags;
    } else {
      this.evictOldPosts();
      this.store.posts.set(postId, {
        postId,
        slug,
        viewCount: 1,
        lastViewed: now,
        categories,
        tags,
      });
    }

    categories.forEach(categoryId => {
      const affinity = this.store.categoryAffinities.get(categoryId);
      if (affinity) {
        affinity.totalViews++;
        if (!existing) affinity.postsViewed++;
      } else {
        this.store.categoryAffinities.set(categoryId, {
          categoryId,
          totalViews: 1,
          postsViewed: 1,
        });
      }
    });

    tags.forEach(tagId => {
      const affinity = this.store.tagAffinities.get(tagId);
      if (affinity) {
        affinity.totalViews++;
        if (!existing) affinity.postsViewed++;
      } else {
        this.store.tagAffinities.set(tagId, {
          tagId,
          totalViews: 1,
          postsViewed: 1,
        });
      }
    });

    this.saveToCache();
  }

  getPostPopularity(postId: number): PopularityData | null {
    return this.store.posts.get(postId) || null;
  }

  getPopularPosts(limit: number = 10): PopularityData[] {
    return Array.from(this.store.posts.values())
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  getPopularPostsByCategory(categoryId: number, limit: number = 10): PopularityData[] {
    return Array.from(this.store.posts.values())
      .filter(post => post.categories.includes(categoryId))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  getCategoryAffinity(categoryId: number): CategoryAffinity | null {
    return this.store.categoryAffinities.get(categoryId) || null;
  }

  getTagAffinity(tagId: number): TagAffinity | null {
    return this.store.tagAffinities.get(tagId) || null;
  }

  getTopCategories(limit: number = 5): CategoryAffinity[] {
    return Array.from(this.store.categoryAffinities.values())
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, limit);
  }

  getTopTags(limit: number = 5): TagAffinity[] {
    return Array.from(this.store.tagAffinities.values())
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, limit);
  }

  isPopular(postId: number): boolean {
    const post = this.store.posts.get(postId);
    return post ? post.viewCount >= MIN_VIEWS_FOR_POPULAR : false;
  }

  getScore(postId: number): number {
    const post = this.store.posts.get(postId);
    if (!post) return 0;

    const categoryScore = post.categories.reduce((acc, catId) => {
      const affinity = this.store.categoryAffinities.get(catId);
      return acc + (affinity ? Math.log(affinity.totalViews + 1) : 0);
    }, 0);

    const tagScore = post.tags.reduce((acc, tagId) => {
      const affinity = this.store.tagAffinities.get(tagId);
      return acc + (affinity ? Math.log(affinity.totalViews + 1) : 0);
    }, 0);

    const recencyBonus = Math.max(0, 1 - (Date.now() - post.lastViewed) / (7 * 24 * 60 * 60 * 1000));

    return Math.log(post.viewCount + 1) * 2 + categoryScore + tagScore * 0.5 + recencyBonus;
  }

  getStats(): { totalPosts: number; totalViews: number; popularCount: number; topCategory: string | null; topTag: string | null } {
    const totalViews = Array.from(this.store.posts.values())
      .reduce((acc, post) => acc + post.viewCount, 0);
    
    const popularCount = Array.from(this.store.posts.values())
      .filter(post => post.viewCount >= MIN_VIEWS_FOR_POPULAR).length;

    const topCategory = this.getTopCategories(1)[0] || null;
    const topTag = this.getTopTags(1)[0] || null;

    return {
      totalPosts: this.store.posts.size,
      totalViews,
      popularCount,
      topCategory: topCategory ? `category:${topCategory.categoryId}` : null,
      topTag: topTag ? `tag:${topTag.tagId}` : null,
    };
  }

  clear(): void {
    this.store = {
      posts: new Map(),
      categoryAffinities: new Map(),
      tagAffinities: new Map(),
    };
    cacheManager.delete(POPULARITY_KEY);
    logger.info('Popularity data cleared', { module: 'PopularityTracker' });
  }
}

export const popularityTracker = new PopularityTracker();
export default popularityTracker;
