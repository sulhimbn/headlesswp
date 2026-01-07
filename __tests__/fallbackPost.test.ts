import { createFallbackPost } from '@/lib/utils/fallbackPost';
import { WordPressPost } from '@/types/wordpress';

describe('createFallbackPost', () => {
  it('should create a valid post object with provided id and title', () => {
    const result = createFallbackPost('123', 'Test Title');

    expect(result).toBeDefined();
    expect(result.id).toBe(123);
    expect(result.title.rendered).toBe('Test Title');
  });

  it('should convert string id to number', () => {
    const result = createFallbackPost('42', 'Test');

    expect(result.id).toBe(42);
    expect(typeof result.id).toBe('number');
  });

  it('should set Indonesian error message in content', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result.content.rendered).toContain('Maaf, artikel tidak dapat dimuat saat ini');
    expect(result.content.rendered).toContain('Silakan coba lagi nanti');
  });

  it('should set Indonesian error message in excerpt', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result.excerpt.rendered).toContain('Maaf, artikel tidak dapat dimuat saat ini');
    expect(result.excerpt.rendered).toContain('Silakan coba lagi nanti');
  });

  it('should create fallback slug with provided id', () => {
    const result = createFallbackPost('test-id', 'Test Title');

    expect(result.slug).toBe('fallback-test-id');
  });

  it('should set author to 0', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result.author).toBe(0);
  });

  it('should set featured_media to 0', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result.featured_media).toBe(0);
  });

  it('should set categories to empty array', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result.categories).toEqual([]);
    expect(Array.isArray(result.categories)).toBe(true);
  });

  it('should set tags to empty array', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result.tags).toEqual([]);
    expect(Array.isArray(result.tags)).toBe(true);
  });

  it('should set status to publish', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result.status).toBe('publish');
  });

  it('should set type to post', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result.type).toBe('post');
  });

  it('should set link to empty string', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result.link).toBe('');
  });

  it('should create valid date strings', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result.date).toBeDefined();
    expect(result.modified).toBeDefined();
    expect(typeof result.date).toBe('string');
    expect(typeof result.modified).toBe('string');
  });

  it('should create ISO format date strings', () => {
    const result = createFallbackPost('1', 'Test');

    expect(() => new Date(result.date)).not.toThrow();
    expect(() => new Date(result.modified)).not.toThrow();
  });

  it('should have date and modified equal to current time', () => {
    const before = new Date().getTime();
    const result = createFallbackPost('1', 'Test');
    const after = new Date().getTime();

    const resultDate = new Date(result.date).getTime();
    const resultModified = new Date(result.modified).getTime();

    expect(resultDate).toBeGreaterThanOrEqual(before);
    expect(resultDate).toBeLessThanOrEqual(after);
    expect(resultModified).toBeGreaterThanOrEqual(before);
    expect(resultModified).toBeLessThanOrEqual(after);
  });

  it('should handle numeric string id', () => {
    const result = createFallbackPost('999', 'Test');

    expect(result.id).toBe(999);
    expect(typeof result.id).toBe('number');
  });

  it('should handle alphanumeric string id', () => {
    const result = createFallbackPost('post-123', 'Test');

    expect(result.id).toBe(NaN);
    expect(result.slug).toBe('fallback-post-123');
  });

  it('should handle empty string id', () => {
    const result = createFallbackPost('', 'Test');

    expect(result.id).toBeNaN();
    expect(result.slug).toBe('fallback-');
  });

  it('should handle special characters in id', () => {
    const result = createFallbackPost('test@#$', 'Test');

    expect(result.slug).toBe('fallback-test@#$');
  });

  it('should handle very long id string', () => {
    const longId = 'a'.repeat(100);
    const result = createFallbackPost(longId, 'Test');

    expect(result.slug).toBe(`fallback-${longId}`);
    expect(result.slug.length).toBeGreaterThan(100);
  });

  it('should handle special characters in title', () => {
    const result = createFallbackPost('1', 'Test <script>alert("XSS")</script>');

    expect(result.title.rendered).toContain('<script>');
    expect(result.title.rendered).toContain('alert("XSS")');
  });

  it('should handle HTML in title', () => {
    const result = createFallbackPost('1', '<strong>Bold</strong> Title');

    expect(result.title.rendered).toContain('<strong>');
    expect(result.title.rendered).toContain('Bold');
  });

  it('should handle empty string title', () => {
    const result = createFallbackPost('1', '');

    expect(result.title.rendered).toBe('');
  });

  it('should handle unicode characters in title', () => {
    const result = createFallbackPost('1', '测试标题 🚀');

    expect(result.title.rendered).toBe('测试标题 🚀');
  });

  it('should maintain WordPressPost interface structure', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('excerpt');
    expect(result).toHaveProperty('slug');
    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('modified');
    expect(result).toHaveProperty('author');
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('tags');
    expect(result).toHaveProperty('featured_media');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('link');
  });

  it('should have title with rendered property', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result.title).toHaveProperty('rendered');
    expect(typeof result.title.rendered).toBe('string');
  });

  it('should have content with rendered property', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result.content).toHaveProperty('rendered');
    expect(typeof result.content.rendered).toBe('string');
  });

  it('should have excerpt with rendered property', () => {
    const result = createFallbackPost('1', 'Test');

    expect(result.excerpt).toHaveProperty('rendered');
    expect(typeof result.excerpt.rendered).toBe('string');
  });

  it('should be usable as WordPressPost type', () => {
    const result = createFallbackPost('1', 'Test');
    const typedResult: WordPressPost = result;

    expect(typedResult).toBeDefined();
    expect(typedResult.id).toBe(1);
  });

  it('should create consistent fallback posts for different ids', () => {
    const result1 = createFallbackPost('1', 'Test 1');
    const result2 = createFallbackPost('2', 'Test 2');

    expect(result1.id).not.toBe(result2.id);
    expect(result1.slug).not.toBe(result2.slug);
    expect(result1.title.rendered).not.toBe(result2.title.rendered);

    expect(result1.author).toBe(result2.author);
    expect(result1.featured_media).toBe(result2.featured_media);
    expect(result1.status).toBe(result2.status);
    expect(result1.type).toBe(result2.type);
  });

  it('should handle whitespace in id', () => {
    const result = createFallbackPost('  test  ', 'Test');

    expect(result.slug).toBe('fallback-  test  ');
  });

  it('should handle very long title', () => {
    const longTitle = 'x'.repeat(1000);
    const result = createFallbackPost('1', longTitle);

    expect(result.title.rendered).toBe(longTitle);
    expect(result.title.rendered.length).toBe(1000);
  });

  it('should have consistent behavior across multiple calls', () => {
    const result1 = createFallbackPost('1', 'Test');
    const result2 = createFallbackPost('1', 'Test');

    expect(result1.id).toBe(result2.id);
    expect(result1.slug).toBe(result2.slug);
    expect(result1.title.rendered).toBe(result2.title.rendered);
  });
});
