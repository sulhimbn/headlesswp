import { cacheKeys } from './cacheKeyFactory';

/**
 * Dependency helpers for defining cache relationships.
 * 
 * @remarks
 * These helpers generate dependency arrays for cache entries.
 * Use them when caching data that depends on other cached entities.
 * 
 * Dependency Graph Structure:
 * 
 * ```
 * category:5 (leaf node)
 *     ↑
 *     | (dependency)
 *     |
 * post:123
 *     ↑
 *     | (dependent)
 *     |
 * posts-list:cat5
 * ```
 * 
 * When `category:5` is invalidated, `post:123` is automatically invalidated.
 * When `post:123` is invalidated, `posts-list:cat5` is automatically invalidated.
 * 
 * Leaf nodes (no dependencies):
 * - Media: Images/videos don't depend on other entities
 * - Author: Author profiles don't depend on other entities
 * - Categories/Tags: Taxonomy terms don't depend on posts
 * 
 * @example
 * ```typescript
 * // Cache a post with dependencies
 * const dependencies = cacheDependencies.post(
 *   123,                // Post ID
 *   [5, 8],            // Category IDs
 *   [12, 15],           // Tag IDs
 *   456                 // Media ID
 * );
 * cacheManager.set(cacheKeys.post(123), postData, CACHE_TTL.POST, dependencies);
 * 
 * // Later, when category 5 is updated...
 * cacheManager.invalidate(cacheKeys.category('5'));
 * // post:123 is automatically invalidated!
 * ```
 */
export const cacheDependencies = {
  /**
   * Post dependencies: categories, tags, and media.
   * 
   * @param postId - Post ID (for key generation)
   * @param categories - Array of category IDs
   * @param tags - Array of tag IDs
   * @param mediaId - Featured media ID (0 if none)
   * @returns Array of dependency cache keys
   * 
   * @remarks
   * Posts depend on:
   * - Categories: Post belongs to categories
   * - Tags: Post has tags
   * - Media: Post has featured image
   * 
   * When any of these change, post should be invalidated.
   */
  post: (_postId: number | string, categories: number[], tags: number[], mediaId: number): string[] => {
    const deps: string[] = []
    categories.forEach(catId => deps.push(cacheKeys.category(catId.toString())))
    tags.forEach(tagId => deps.push(cacheKeys.tag(tagId.toString())))
    if (mediaId > 0) deps.push(cacheKeys.media(mediaId))
    return deps
  },

  /**
   * Posts list dependencies: categories and tags.
   * 
   * @param categories - Array of category IDs (for filtered lists)
   * @param tags - Array of tag IDs (for filtered lists)
   * @returns Array of dependency cache keys
   * 
   * @remarks
   * Posts lists (e.g., posts in a category) depend on:
   * - Categories: Filtered by category
   * - Tags: Filtered by tag
   * 
   * When category/tag metadata changes, list should be invalidated.
   */
  postsList: (categories: number[] = [], tags: number[] = []): string[] => {
    const deps: string[] = []
    categories.forEach(catId => deps.push(cacheKeys.category(catId.toString())))
    tags.forEach(tagId => deps.push(cacheKeys.tag(tagId.toString())))
    return deps
  },

  /**
   * Media dependencies: none (leaf node).
   * 
   * @returns Empty array
   * 
   * @remarks
   * Media (images, videos) don't depend on other entities.
   * They are leaf nodes in dependency graph.
   * 
   * Other entities depend on media, but media doesn't depend on anything.
   */
  media: () => [],

  /**
   * Author dependencies: none (leaf node).
   * 
   * @returns Empty array
   * 
   * @remarks
   * Author profiles don't depend on other entities.
   * They are leaf nodes in dependency graph.
   */
  author: () => [],

  /**
   * Categories dependencies: none (leaf node).
   * 
   * @returns Empty array
   * 
   * @remarks
   * Categories are taxonomy terms.
   * Posts depend on categories, but categories don't depend on posts.
   */
  categories: () => [],

  /**
   * Tags dependencies: none (leaf node).
   * 
   * @returns Empty array
   * 
   * @remarks
   * Tags are taxonomy terms.
   * Posts depend on tags, but tags don't depend on posts.
   */
  tags: () => [],
}