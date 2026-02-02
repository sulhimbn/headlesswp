import { CACHE_TIMES } from '@/lib/api/config';

/**
 * Cache configuration constants for time-to-live (TTL) values.
 * 
 * @remarks
 * These values determine how long cached data remains valid.
 * Choose TTL based on:
 * - Data volatility: How often content changes
 * - Business requirements: Freshness needs
 * - Performance: Longer TTL = fewer API calls
 * 
 * Common TTL patterns:
 * - Short (1-5 min): Highly dynamic data (search results, live content)
 * - Medium (10-30 min): Moderately dynamic data (posts, categories)
 * - Long (1+ hours): Static data (media, authors)
 * 
 * @example
 * ```typescript
 * import { CACHE_CONFIG } from '@/lib/cache/cacheConfig';
 * 
 * cacheManager.set('posts:default', postsData, CACHE_CONFIG.POSTS);
 * ```
 */
export const CACHE_CONFIG = {
  /**
   * Post lists TTL - 5 minutes.
   * 
   * Post lists refresh often to show latest content.
   * Used for:
   * - Latest posts on homepage
   * - Category post lists
   * - Search results
   */
  POSTS: CACHE_TIMES.MEDIUM_SHORT,

  /**
   * Individual post TTL - 10 minutes.
   * 
   * Individual posts change less frequently than lists.
   * Used for:
   * - Post detail pages
   * - Post content
   * - Post metadata
   */
  POST: CACHE_TIMES.MEDIUM,

  /**
   * Categories TTL - 30 minutes.
   * 
   * Categories rarely change.
   * Used for:
   * - Category list
   * - Category metadata
   * - Category navigation
   */
  CATEGORIES: CACHE_TIMES.MEDIUM_LONG,

  /**
   * Tags TTL - 30 minutes.
   * 
   * Tags rarely change.
   * Used for:
   * - Tag list
   * - Tag metadata
   * - Tag navigation
   */
  TAGS: CACHE_TIMES.MEDIUM_LONG,

  /**
   * Media TTL - 1 hour.
   * 
   * Media (images, videos) is static.
   * Used for:
   * - Image metadata
   * - Video metadata
   * - Media URLs
   */
  MEDIA: CACHE_TIMES.LONG,

  /**
   * Search results TTL - 2 minutes.
   * 
   * Search results expire quickly to ensure fresh results.
   * Used for:
   * - Search query results
   * - Search suggestions
   */
  SEARCH: CACHE_TIMES.SHORT,

  /**
   * Author TTL - 30 minutes.
   * 
   * Authors rarely change.
   * Used for:
   * - Author profiles
   * - Author metadata
   * - Author posts lists
   */
  AUTHOR: CACHE_TIMES.MEDIUM_LONG,
} as const;

/**
 * Legacy export for backward compatibility.
 * 
 * @deprecated Use CACHE_CONFIG instead
 */
export const CACHE_TTL = CACHE_CONFIG;
