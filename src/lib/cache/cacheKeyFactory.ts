/**
 * Cache key factory for type-safe cache key generation.
 * 
 * @remarks
 * Factory pattern ensures consistent key format across the application.
 * Enforces naming convention: `entity:param` or `entity` for no params.
 * 
 * @example
 * ```typescript
 * CacheKeyFactory.create('posts', 'default'); // 'posts:default'
 * CacheKeyFactory.create('categories'); // 'categories'
 * CacheKeyFactory.createById('post', 123); // 'post:123'
 * CacheKeyFactory.createBySlug('category', 'news'); // 'category:news'
 * ```
 */
export class CacheKeyFactory {
  private static readonly SEPARATOR = ':'

  static create(
    entity: 'posts' | 'post' | 'categories' | 'category' | 'tags' | 'tag' | 'media' | 'author' | 'search' | 'sitemap',
    params?: string | number
  ): string {
    return params ? `${entity}${this.SEPARATOR}${params}` : entity
  }

  static createById(entity: 'post' | 'media' | 'author', id: number): string {
    return this.create(entity, id)
  }

  static createBySlug(entity: 'post' | 'category' | 'tag', slug: string): string {
    return this.create(entity, slug)
  }
}

/**
 * Cache key generators using factory pattern.
 * 
 * @remarks
 * Use these functions to generate cache keys consistently:
 * - Prevents key typos
 * - Ensures predictable cache structure
 * - Makes debugging easier
 * - Type-safe key generation
 * 
 * Key format: `{entity}:{identifier}`
 * Examples: 'post:123', 'category:news', 'posts:default'
 * 
 * @example
 * ```typescript
 * // Good - Use key generators
 * cacheManager.set(cacheKeys.post(123), postData, CACHE_TTL.POST);
 * 
 * // Bad - String literals (prone to typos)
 * cacheManager.set('post-123', postData, 60000);
 * ```
 */
export const cacheKeys = {
  posts: (params?: string) => CacheKeyFactory.create('posts', params || 'default'),
  post: (slug: string) => CacheKeyFactory.createBySlug('post', slug),
  postById: (id: number) => CacheKeyFactory.createById('post', id),
  categories: () => CacheKeyFactory.create('categories'),
  category: (slug: string) => CacheKeyFactory.createBySlug('category', slug),
  tags: () => CacheKeyFactory.create('tags'),
  tag: (slug: string) => CacheKeyFactory.createBySlug('tag', slug),
  media: (id: number) => CacheKeyFactory.createById('media', id),
  author: (id: number) => CacheKeyFactory.createById('author', id),
  search: (query: string) => CacheKeyFactory.create('search', query),
  sitemap: () => CacheKeyFactory.create('sitemap'),
}