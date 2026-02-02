import { wordpressAPI } from '@/lib/wordpress';
import type { WordPressPost, WordPressCategory, WordPressTag } from '@/types/wordpress';
import { PAGINATION_LIMITS } from '@/lib/api/config';
import { cacheManager, CACHE_TTL, cacheKeys, cacheDependencies } from '@/lib/cache';
import { dataValidator, isValidationResultValid, type ValidationResult } from '@/lib/validation/dataValidator';
import { relationshipValidator, type RelationshipValidatorOptions } from '@/lib/validation/relationshipValidator';
import { createFallbackPost } from '@/lib/utils/fallbackPost';
import { logger } from '@/lib/utils/logger';
import { getFallbackPosts, type FallbackPostType } from '@/lib/constants/fallbackPosts';
import type { IPostService, PostWithMediaUrl, PostWithDetails, PaginatedPostsResult } from './IPostService';
import { standardizedAPI } from '@/lib/api/standardized';
import type { ICacheManager } from '@/lib/api/ICacheManager';

interface EntityMapOptions<T> {
  cacheKey: string;
  fetchFn: () => Promise<T[]>;
  validateFn: (data: T[]) => ValidationResult<T[]>;
  ttl: number;
  dependencies: string[];
  entityName: string;
  cacheManager?: ICacheManager;
}

async function getEntityMap<T extends { id: number }>(
  options: EntityMapOptions<T>
): Promise<Map<number, T>> {
  const cache = options.cacheManager ?? cacheManager;
  const cached = cache.get<Map<number, T>>(options.cacheKey);
  if (cached) return cached;

  try {
    const entities = await options.fetchFn();
    const validation = options.validateFn(entities);

    if (!isValidationResultValid(validation)) {
      logger.error(`Invalid ${options.entityName} data`, undefined, { module: 'enhancedPostService', errors: validation.errors });
      return new Map();
    }

    const map = new Map<number, T>(validation.data.map(entity => [entity.id, entity]));
    cache.set(options.cacheKey, map, options.ttl, options.dependencies);
    return map;
  } catch (error) {
    logger.error(`Failed to fetch ${options.entityName}`, error, { module: 'enhancedPostService' });
    return new Map();
  }
}

async function getCategoriesMap(): Promise<Map<number, WordPressCategory>> {
  return getEntityMap<WordPressCategory>({
    cacheKey: cacheKeys.categories(),
    fetchFn: () => wordpressAPI.getCategories(),
    validateFn: dataValidator.validateCategories.bind(dataValidator),
    ttl: CACHE_TTL.CATEGORIES,
    dependencies: cacheDependencies.categories(),
    entityName: 'categories'
  });
}

async function getTagsMap(): Promise<Map<number, WordPressTag>> {
  return getEntityMap<WordPressTag>({
    cacheKey: cacheKeys.tags(),
    fetchFn: () => wordpressAPI.getTags(),
    validateFn: dataValidator.validateTags.bind(dataValidator),
    ttl: CACHE_TTL.TAGS,
    dependencies: cacheDependencies.tags(),
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

function validatePostRelationships(
  post: WordPressPost,
  options: RelationshipValidatorOptions
): void {
  const errors = relationshipValidator.validatePostRelationships(post, options);

  if (errors.length > 0) {
    logger.warn(
      `Post ${post.id} has invalid relationships: ${errors.map(e => e.message).join(', ')}`,
      undefined,
      { module: 'enhancedPostService', postId: post.id, errors }
    );
  }
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

  validatePostRelationships(post, {
    categories: categoriesMap,
    tags: tagsMap,
    authors: new Map()
  });

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

interface FetchAndValidatePostsOptions {
  apiCall: () => Promise<unknown>;
  operationName: string;
  fallbackKey?: FallbackPostType;
  returnEmptyOnError?: boolean;
}

async function fetchAndValidatePosts(options: FetchAndValidatePostsOptions): Promise<PostWithMediaUrl[]> {
  const { apiCall, operationName, fallbackKey, returnEmptyOnError = false } = options;

  const result = await apiCall() as { data?: WordPressPost[]; error?: { message?: string } };

  if (!result || (result as { error?: unknown }).error) {
    logger.warn(`Failed to ${operationName}: ${(result as { error?: { message?: string } }).error?.message}`, undefined, { module: 'enhancedPostService' });
    
    if (returnEmptyOnError) return [];
    if (fallbackKey) return createFallbackPostsWithMediaUrls(getFallbackPosts(fallbackKey));
    return [];
  }

  const validation = dataValidator.validatePosts((result as { data: WordPressPost[] }).data);
  
  if (!isValidationResultValid(validation)) {
    logger.error(`${operationName} data validation failed`, undefined, { module: 'enhancedPostService', errors: validation.errors });
    
    if (returnEmptyOnError) return [];
    if (fallbackKey) return createFallbackPostsWithMediaUrls(getFallbackPosts(fallbackKey));
    return [];
  }

  return await enrichPostsWithMediaUrls(validation.data);
}

interface FetchAndValidateSinglePostOptions {
  apiCall: () => Promise<unknown>;
  operationName: string;
  identifier: string | number;
}

async function fetchAndValidateSinglePost(options: FetchAndValidateSinglePostOptions): Promise<PostWithDetails | null> {
  const { apiCall, operationName, identifier } = options;

  const result = await apiCall() as { data?: WordPressPost; error?: { message?: string } };

  if (!result || (result as { error?: unknown }).error) {
    logger.warn(`${operationName} for ${identifier}: ${(result as { error?: { message?: string } }).error?.message}`, undefined, { module: 'enhancedPostService' });
    return null;
  }

  const validation = dataValidator.validatePost((result as { data: WordPressPost }).data);
  
  if (!isValidationResultValid(validation)) {
    logger.error(`${operationName} for ${identifier} validation failed`, undefined, { module: 'enhancedPostService', errors: validation.errors });
    return null;
  }

  return await enrichPostWithDetails(validation.data);
}

export const enhancedPostService: IPostService = {
  getLatestPosts: async (): Promise<PostWithMediaUrl[]> => {
    return fetchAndValidatePosts({
      apiCall: () => standardizedAPI.getAllPosts({ per_page: PAGINATION_LIMITS.LATEST_POSTS }),
      operationName: 'fetch latest posts',
      fallbackKey: 'LATEST'
    });
  },

  getCategoryPosts: async (): Promise<PostWithMediaUrl[]> => {
    return fetchAndValidatePosts({
      apiCall: () => standardizedAPI.getAllPosts({ per_page: PAGINATION_LIMITS.CATEGORY_POSTS }),
      operationName: 'fetch category posts',
      fallbackKey: 'CATEGORY'
    });
  },

  getAllPosts: async (): Promise<PostWithMediaUrl[]> => {
    return fetchAndValidatePosts({
      apiCall: () => standardizedAPI.getAllPosts({ per_page: PAGINATION_LIMITS.ALL_POSTS }),
      operationName: 'fetch all posts',
      returnEmptyOnError: true
    });
  },

  getPaginatedPosts: async (page: number = 1, perPage: number = 10): Promise<PaginatedPostsResult> => {
    const result = await standardizedAPI.getAllPosts({ page, per_page: perPage }) as { data?: WordPressPost[]; pagination?: { total?: number; totalPages?: number } };

    if (!result || (result as { error?: unknown }).error) {
      logger.warn(`Failed to fetch paginated posts`, undefined, { module: 'enhancedPostService' });
      return { posts: [], totalPosts: 0, totalPages: 0 };
    }

    const validation = dataValidator.validatePosts((result as { data: WordPressPost[] }).data);
    
    if (!isValidationResultValid(validation)) {
      logger.error('Invalid paginated posts data', undefined, { module: 'enhancedPostService', errors: validation.errors });
      return { posts: [], totalPosts: 0, totalPages: 0 };
    }

    const enrichedPosts = await enrichPostsWithMediaUrls(validation.data);

    return {
      posts: enrichedPosts,
      totalPosts: result.pagination?.total ?? 0,
      totalPages: result.pagination?.totalPages ?? 0
    };
  },

  getPostBySlug: async (slug: string): Promise<PostWithDetails | null> => {
    return fetchAndValidateSinglePost({
      apiCall: () => standardizedAPI.getPostBySlug(slug),
      operationName: 'fetch post by slug',
      identifier: slug
    });
  },

  getPostById: async (id: number): Promise<PostWithDetails | null> => {
    return fetchAndValidateSinglePost({
      apiCall: () => standardizedAPI.getPostById(id),
      operationName: 'fetch post by id',
      identifier: id
    });
  },

  getCategories: async (): Promise<WordPressCategory[]> => {
    const map = await getCategoriesMap();
    return Array.from(map.values());
  },

  getTags: async (): Promise<WordPressTag[]> => {
    const map = await getTagsMap();
    return Array.from(map.values());
  },

  searchPosts: async (query: string): Promise<PostWithMediaUrl[]> => {
    return fetchAndValidatePosts({
      apiCall: async () => {
        const searchResults = await wordpressAPI.search(query);
        return { data: searchResults || [] };
      },
      operationName: `search posts with query "${query}"`,
      returnEmptyOnError: true
    });
  }
};

export default enhancedPostService;
