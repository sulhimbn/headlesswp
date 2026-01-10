import { wordpressAPI } from '@/lib/wordpress';
import type { WordPressPost, WordPressCategory, WordPressTag } from '@/types/wordpress';
import { PAGINATION_LIMITS } from '@/lib/api/config';
import { cacheManager, CACHE_TTL, CACHE_KEYS, CACHE_DEPENDENCIES } from '@/lib/cache';
import { dataValidator, isValidationResultValid } from '@/lib/validation/dataValidator';
import { createFallbackPost } from '@/lib/utils/fallbackPost';
import { logger } from '@/lib/utils/logger';
import { getFallbackPosts } from '@/lib/constants/fallbackPosts';
import type { IPostService, PostWithMediaUrl, PostWithDetails, PaginatedPostsResult } from './IPostService';

async function getCategoriesMap(): Promise<Map<number, WordPressCategory>> {
  const cacheKey = CACHE_KEYS.categories();
  const cached = cacheManager.get<Map<number, WordPressCategory>>(cacheKey);
  if (cached) return cached;

  try {
    const categories = await wordpressAPI.getCategories();
    const validation = dataValidator.validateCategories(categories);

    if (!isValidationResultValid(validation)) {
      logger.error('Invalid categories data', undefined, { module: 'enhancedPostService', errors: validation.errors });
      return new Map();
    }

    const map = new Map<number, WordPressCategory>(validation.data.map((cat: WordPressCategory) => [cat.id, cat]));
    cacheManager.set(cacheKey, map, CACHE_TTL.CATEGORIES, CACHE_DEPENDENCIES.categories());
    return map;
  } catch (error) {
    logger.error('Failed to fetch categories', error, { module: 'enhancedPostService' });
    return new Map();
  }
}

async function getTagsMap(): Promise<Map<number, WordPressTag>> {
  const cacheKey = CACHE_KEYS.tags();
  const cached = cacheManager.get<Map<number, WordPressTag>>(cacheKey);
  if (cached) return cached;

  try {
    const tags = await wordpressAPI.getTags();
    const validation = dataValidator.validateTags(tags);

    if (!isValidationResultValid(validation)) {
      logger.error('Invalid tags data', undefined, { module: 'enhancedPostService', errors: validation.errors });
      return new Map();
    }

    const map = new Map<number, WordPressTag>(validation.data.map((tag: WordPressTag) => [tag.id, tag]));
    cacheManager.set(cacheKey, map, CACHE_TTL.TAGS, CACHE_DEPENDENCIES.tags());
    return map;
  } catch (error) {
    logger.error('Failed to fetch tags', error, { module: 'enhancedPostService' });
    return new Map();
  }
}

async function enrichPostsWithMediaUrls(posts: WordPressPost[]): Promise<PostWithMediaUrl[]> {
  const mediaIds = [...new Set(posts.map(post => post.featured_media).filter(id => id > 0))];
  const mediaUrls = await wordpressAPI.getMediaUrlsBatch(mediaIds);

  return posts.map(post => ({
    ...post,
    mediaUrl: mediaUrls.get(post.featured_media) || null
  }));
}

async function enrichPostWithDetails(post: WordPressPost): Promise<PostWithDetails> {
  const [mediaUrl, categoriesMap, tagsMap] = await Promise.all([
    wordpressAPI.getMediaUrl(post.featured_media),
    getCategoriesMap(),
    getTagsMap()
  ]);

  const categoriesDetails = post.categories
    .map(id => categoriesMap.get(id))
    .filter((cat): cat is WordPressCategory => cat !== undefined);

  const tagsDetails = post.tags
    .map(id => tagsMap.get(id))
    .filter((tag): tag is WordPressTag => tag !== undefined);

  return {
    ...post,
    mediaUrl,
    categoriesDetails,
    tagsDetails
  };
}

function createFallbackPostsWithMediaUrls(fallbacks: Array<{ id: string; title: string }>): PostWithMediaUrl[] {
  return fallbacks.map(({ id, title }) => ({ ...createFallbackPost(id, title), mediaUrl: null }));
}

async function fetchAndValidate<T, R>(
  fetchFn: () => Promise<T>,
  validateFn: (data: T) => ReturnType<typeof dataValidator.validatePosts>,
  transformFn: (data: T) => R | Promise<R>,
  fallback: R,
  context: string,
  logLevel: 'warn' | 'error' = 'warn'
): Promise<R> {
  try {
    const data = await fetchFn();
    const validation = validateFn(data);

    if (!isValidationResultValid(validation)) {
      logger.error(`Invalid data for ${context}`, undefined, { module: 'enhancedPostService', errors: validation.errors });
      return fallback;
    }

    return await transformFn(validation.data as T);
  } catch (error) {
    logger[logLevel](`Failed to fetch ${context}`, error, { module: 'enhancedPostService' });
    return fallback;
  }
}

async function fetchAndValidateSingle<T, R>(
  fetchFn: () => Promise<T>,
  validateFn: (data: T) => ReturnType<typeof dataValidator.validatePost>,
  transformFn: (data: T) => R | Promise<R>,
  fallback: R,
  context: string
): Promise<R> {
  try {
    const data = await fetchFn();
    const validation = validateFn(data);

    if (!isValidationResultValid(validation)) {
      logger.error(`Invalid data for ${context}`, undefined, { module: 'enhancedPostService', errors: validation.errors });
      return fallback;
    }

    return await transformFn(validation.data as T);
  } catch (error) {
    logger.error(`Failed to fetch ${context}`, error, { module: 'enhancedPostService' });
    return fallback;
  }
}

export const enhancedPostService: IPostService = {
  getLatestPosts: async (): Promise<PostWithMediaUrl[]> => {
    return fetchAndValidate(
      () => wordpressAPI.getPosts({ per_page: PAGINATION_LIMITS.LATEST_POSTS }),
      dataValidator.validatePosts.bind(dataValidator),
      enrichPostsWithMediaUrls,
      createFallbackPostsWithMediaUrls(getFallbackPosts('LATEST')),
      'latest posts'
    );
  },

  getCategoryPosts: async (): Promise<PostWithMediaUrl[]> => {
    return fetchAndValidate(
      () => wordpressAPI.getPosts({ per_page: PAGINATION_LIMITS.CATEGORY_POSTS }),
      dataValidator.validatePosts.bind(dataValidator),
      enrichPostsWithMediaUrls,
      createFallbackPostsWithMediaUrls(getFallbackPosts('CATEGORY')),
      'category posts'
    );
  },

  getAllPosts: async (): Promise<PostWithMediaUrl[]> => {
    return fetchAndValidate(
      () => wordpressAPI.getPosts({ per_page: PAGINATION_LIMITS.ALL_POSTS }),
      dataValidator.validatePosts.bind(dataValidator),
      enrichPostsWithMediaUrls,
      [],
      'all posts'
    );
  },

  getPaginatedPosts: async (page: number = 1, perPage: number = 10): Promise<PaginatedPostsResult> => {
    try {
      const { data, total, totalPages } = await wordpressAPI.getPostsWithHeaders({ page, per_page: perPage });
      const validation = dataValidator.validatePosts(data);

      if (!isValidationResultValid(validation)) {
        logger.error('Invalid posts data', undefined, { module: 'enhancedPostService', errors: validation.errors });
        return { posts: [], totalPosts: 0, totalPages: 0 };
      }

      const enrichedPosts = await enrichPostsWithMediaUrls(validation.data);

      return {
        posts: enrichedPosts,
        totalPosts: total,
        totalPages
      };
    } catch (error) {
      logger.warn('Failed to fetch paginated posts', error, { module: 'enhancedPostService' });
      return { posts: [], totalPosts: 0, totalPages: 0 };
    }
  },

  getPostBySlug: async (slug: string): Promise<PostWithDetails | null> => {
    try {
      const post = await wordpressAPI.getPost(slug);
      if (!post) return null;

      const validation = dataValidator.validatePost(post);

      if (!isValidationResultValid(validation)) {
        logger.error(`Invalid post data for slug ${slug}`, undefined, { module: 'enhancedPostService', errors: validation.errors });
        return null;
      }

      return await enrichPostWithDetails(validation.data);
    } catch (error) {
      logger.error(`Failed to fetch or enrich post with slug ${slug}`, error, { module: 'enhancedPostService' });
      return null;
    }
  },

  getPostById: async (id: number): Promise<PostWithDetails | null> => {
    return fetchAndValidateSingle(
      () => wordpressAPI.getPostById(id),
      dataValidator.validatePost.bind(dataValidator),
      enrichPostWithDetails,
      null,
      `post with id ${id}`
    );
  },

  getCategories: async (): Promise<WordPressCategory[]> => {
    const map = await getCategoriesMap();
    return Array.from(map.values());
  },

  getTags: async (): Promise<WordPressTag[]> => {
    const map = await getTagsMap();
    return Array.from(map.values());
  }
};

export default enhancedPostService;
