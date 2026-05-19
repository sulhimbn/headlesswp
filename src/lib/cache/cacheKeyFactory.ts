export class CacheKeyFactory {
  private static readonly SEPARATOR = ':';

  static create(
    entity:
      | 'posts'
      | 'post'
      | 'categories'
      | 'category'
      | 'tags'
      | 'tag'
      | 'media'
      | 'author'
      | 'search'
      | 'sitemap',
    params?: string | number
  ): string {
    return params ? `${entity}${this.SEPARATOR}${params}` : entity;
  }

  static createById(entity: 'post' | 'media' | 'author', id: number): string {
    return this.create(entity, id);
  }

  static createBySlug(entity: 'post' | 'category' | 'tag', slug: string): string {
    return this.create(entity, slug);
  }
}

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
};
