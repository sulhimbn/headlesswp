import { wordpressAPI } from '../src/lib/wordpress';

describe('WordPress API Cache Management', () => {
  beforeEach(() => {
    // Clear cache before each test
    wordpressAPI.clearCache();
  });

  test('should provide cache statistics', () => {
    const stats = wordpressAPI.getCacheStats();
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('keys');
    expect(Array.isArray(stats.keys)).toBe(true);
    expect(typeof stats.size).toBe('number');
  });

  test('should clear all cache', () => {
    // Initially cache should be empty
    let stats = wordpressAPI.getCacheStats();
    expect(stats.size).toBe(0);

    // Clear cache should not throw errors
    wordpressAPI.clearCache();
    
    // Cache should still be empty
    stats = wordpressAPI.getCacheStats();
    expect(stats.size).toBe(0);
  });

  test('should clear cache with pattern', () => {
    // Clear cache with pattern should not throw errors
    wordpressAPI.clearCache('posts');
    wordpressAPI.clearCache('categories');
    wordpressAPI.clearCache('tags');
    
    const stats = wordpressAPI.getCacheStats();
    expect(stats.size).toBe(0);
  });

  test('should have cache management methods', () => {
    // Verify that cache management methods exist
    expect(typeof wordpressAPI.clearCache).toBe('function');
    expect(typeof wordpressAPI.getCacheStats).toBe('function');
  });

  test('should have all required API methods', () => {
    // Verify that all required API methods exist
    expect(typeof wordpressAPI.getPosts).toBe('function');
    expect(typeof wordpressAPI.getPost).toBe('function');
    expect(typeof wordpressAPI.getPostById).toBe('function');
    expect(typeof wordpressAPI.getCategories).toBe('function');
    expect(typeof wordpressAPI.getCategory).toBe('function');
    expect(typeof wordpressAPI.getTags).toBe('function');
    expect(typeof wordpressAPI.getTag).toBe('function');
    expect(typeof wordpressAPI.getMedia).toBe('function');
    expect(typeof wordpressAPI.getAuthor).toBe('function');
    expect(typeof wordpressAPI.search).toBe('function');
  });
});