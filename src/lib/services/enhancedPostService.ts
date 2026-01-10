import { wordpressAPI } from '@/lib/wordpress';
import type { WordPressPost, WordPressCategory, WordPressTag } from '@/types/wordpress';
import { PAGINATION_LIMITS } from '@/lib/api/config';
import { cacheManager, CACHE_TTL, CACHE_KEYS, CACHE_DEPENDENCIES } from '@/lib/cache';
import { dataValidator, isValidationResultValid, type ValidationResult } from '@/lib/validation/dataValidator';
import { createFallbackPost } from '@/lib/utils/fallbackPost';
import { logger } from '@/lib/utils/logger';
import { getFallbackPosts } from '@/lib/constants/fallbackPosts';
import type { IPostService, PostWithMediaUrl, PostWithDetails, PaginatedPostsResult } from './IPostService';

interface EntityMapOptions<T> {
  cacheKey: string;
  fetchFn: () => Promise<T[]>;
  validateFn: (data: T[]) => ValidationResult<T[]>;
  ttl: number;
  dependencies: string[];
  entityName: string;
}

async function getEntityMap<T extends { id: number }>(
  options: EntityMapOptions<T>
): Promise<Map<number, T>> {
  const cached = cacheManager.get<Map<number, T>>(options.cacheKey);
  if (cached) return cached;

  try {
    const entities = await options.fetchFn();
    const validation = options.validateFn(entities);

    if (!isValidationResultValid(validation)) {
      logger.error(`Invalid ${options.entityName} data`, undefined, { module: 'enhancedPostService', errors: validation.errors });
      return new Map();
    }

    const map = new Map<number, T>(validation.data.map(entity => [entity.id, entity]));
    cacheManager.set(options.cacheKey, map, options.ttl, options.dependencies);
    return map;
  } catch (error) {
    logger.error(`Failed to fetch ${options.entityName}`, error, { module: 'enhancedPostService' });
    return new Map();
  }
}

async function getCategoriesMap(): Promise<Map<number, WordPressCategory>> {
  return getEntityMap<WordPressCategory>({
    cacheKey: CACHE_KEYS.categories(),
    fetchFn: () => wordpressAPI.getCategories(),
    validateFn: dataValidator.validateCategories.bind(dataValidator),
    ttl: CACHE_TTL.CATEGORIES,
    dependencies: CACHE_DEPENDENCIES.categories(),
    entityName: 'categories'
  });
}

async function getTagsMap(): Promise<Map<number, WordPressTag>> {
  return getEntityMap<WordPressTag>({
    cacheKey: CACHE_KEYS.tags(),
    fetchFn: () => wordpressAPI.getTags(),
    validateFn: dataValidator.validateTags.bind(dataValidator),
    ttl: CACHE_TTL.TAGS,
    dependencies: CACHE_DEPENDENCIES.tags(),
    entityName: 'tags'
  });
}

async function enrichPostsWithMediaUrls(posts: WordPressPost[]): Promise<PostWithMediaUrl[]> {
  const mediaIds = [...new Set(posts.map(post => post.featured_media).filter(id => id > 0))];
  let mediaUrls: Map<number, string | null>;

  try {
    mediaUrls = await wordpressAPI.getMediaUrlsBatch(mediaIds);
  } catch (error) {
    logger.warn('Failed to fetch media URLs, using fallbacks', error, { module: 'enhancedPostService' });
    mediaUrls = new Map();
  }

  return posts.map(post => ({
    ...post,
    mediaUrl: mediaUrls.get(post.featured_media) || null
  }));
}

async function enrichPostWithDetails(post: WordPressPost): Promise<PostWithDetails> {
  let mediaUrl: string | null;

  try {
    mediaUrl = await wordpressAPI.getMediaUrl(post.featured_media);
  } catch (error) {
    logger.warn(`Failed to fetch media for post ${post.id}, using fallback`, error, { module: 'enhancedPostService' });
    mediaUrl = null;
  }

  const [categoriesMap, tagsMap] = await Promise.all([
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
  validateFn: (data: T) => ValidationResult<T>,
  transformFn: (data: T) => R | Promise<R>,
  fallback: R,
  context: string,
  logLevel: 'warn' | 'error' = 'error'
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

export const enhancedPostService: IPostService = {
  getLatestPosts: async (): Promise<PostWithMediaUrl[]> => {
    return fetchAndValidate(
      () => wordpressAPI.getPosts({ per_page: PAGINATION_LIMITS.LATEST_POSTS }),
      dataValidator.validatePosts.bind(dataValidator),
      enrichPostsWithMediaUrls,
      createFallbackPostsWithMediaUrls(getFallbackPosts('LATEST')),
      'latest posts',
      'warn'
    );
  },

  getCategoryPosts: async (): Promise<PostWithMediaUrl[]> => {
    return fetchAndValidate(
      () => wordpressAPI.getPosts({ per_page: PAGINATION_LIMITS.CATEGORY_POSTS }),
      dataValidator.validatePosts.bind(dataValidator),
      enrichPostsWithMediaUrls,
      createFallbackPostsWithMediaUrls(getFallbackPosts('CATEGORY')),
      'category posts',
      'warn'
    );
  },

  getAllPosts: async (): Promise<PostWithMediaUrl[]> => {
    return fetchAndValidate(
      () => wordpressAPI.getPosts({ per_page: PAGINATION_LIMITS.ALL_POSTS }),
      dataValidator.validatePosts.bind(dataValidator),
      enrichPostsWithMediaUrls,
      [],
      'all posts',
      'warn'
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
    return fetchAndValidate(
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
