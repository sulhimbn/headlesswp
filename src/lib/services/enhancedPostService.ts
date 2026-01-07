import { wordpressAPI } from '@/lib/wordpress';
import { WordPressPost, WordPressCategory, WordPressTag } from '@/types/wordpress';
import { PAGINATION_LIMITS } from '@/lib/api/config';
import { cacheManager, CACHE_TTL, CACHE_KEYS } from '@/lib/cache';
import { dataValidator, isValidationResultValid } from '@/lib/validation/dataValidator';
import { createFallbackPost } from '@/lib/utils/fallbackPost';
import { logger } from '@/lib/utils/logger';
import { getFallbackPosts } from '@/lib/constants/fallbackPosts';

interface PostWithMediaUrl extends WordPressPost {
  mediaUrl: string | null;
}

interface PostWithDetails extends WordPressPost {
  mediaUrl: string | null;
  categoriesDetails: WordPressCategory[];
  tagsDetails: WordPressTag[];
}

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
    cacheManager.set(cacheKey, map, CACHE_TTL.CATEGORIES);
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
    cacheManager.set(cacheKey, map, CACHE_TTL.TAGS);
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

export const enhancedPostService = {
  getLatestPosts: async (): Promise<PostWithMediaUrl[]> => {
    try {
      const posts = await wordpressAPI.getPosts({ per_page: PAGINATION_LIMITS.LATEST_POSTS });
      const validation = dataValidator.validatePosts(posts);

      if (!isValidationResultValid(validation)) {
        logger.error('Invalid posts data', undefined, { module: 'enhancedPostService', errors: validation.errors });
        return createFallbackPostsWithMediaUrls(getFallbackPosts('LATEST'));
      }

      return enrichPostsWithMediaUrls(validation.data);
    } catch (error) {
      logger.warn('Failed to fetch latest posts during build', error, { module: 'enhancedPostService' });
      return createFallbackPostsWithMediaUrls(getFallbackPosts('LATEST'));
    }
  },

  getCategoryPosts: async (): Promise<PostWithMediaUrl[]> => {
    try {
      const posts = await wordpressAPI.getPosts({ per_page: PAGINATION_LIMITS.CATEGORY_POSTS });
      const validation = dataValidator.validatePosts(posts);

      if (!isValidationResultValid(validation)) {
        logger.error('Invalid posts data', undefined, { module: 'enhancedPostService', errors: validation.errors });
        return createFallbackPostsWithMediaUrls(getFallbackPosts('CATEGORY'));
      }

      return enrichPostsWithMediaUrls(validation.data);
    } catch (error) {
      logger.warn('Failed to fetch category posts during build', error, { module: 'enhancedPostService' });
      return createFallbackPostsWithMediaUrls(getFallbackPosts('CATEGORY'));
    }
  },

  getAllPosts: async (): Promise<PostWithMediaUrl[]> => {
    try {
      const posts = await wordpressAPI.getPosts({ per_page: PAGINATION_LIMITS.ALL_POSTS });
      const validation = dataValidator.validatePosts(posts);

      if (!isValidationResultValid(validation)) {
        logger.error('Invalid posts data', undefined, { module: 'enhancedPostService', errors: validation.errors });
        return [];
      }

      return enrichPostsWithMediaUrls(validation.data);
    } catch (error) {
      logger.warn('Failed to fetch all posts during build', error, { module: 'enhancedPostService' });
      return [];
    }
  },

  getPaginatedPosts: async (page: number = 1, perPage: number = 10): Promise<{
    posts: PostWithMediaUrl[];
    totalPosts: number;
    totalPages: number;
  }> => {
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

      return enrichPostWithDetails(validation.data);
    } catch (error) {
      logger.error(`Error fetching post with slug ${slug}`, error, { module: 'enhancedPostService' });
      return null;
    }
  },

  getPostById: async (id: number): Promise<PostWithDetails | null> => {
    try {
      const post = await wordpressAPI.getPostById(id);
      const validation = dataValidator.validatePost(post);

      if (!isValidationResultValid(validation)) {
        logger.error(`Invalid post data for id ${id}`, undefined, { module: 'enhancedPostService', errors: validation.errors });
        return null;
      }

      return enrichPostWithDetails(validation.data);
    } catch (error) {
      logger.error(`Error fetching post with id ${id}`, error, { module: 'enhancedPostService' });
      return null;
    }
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
