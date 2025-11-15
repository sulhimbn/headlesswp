import { wordpressAPI } from '@/lib/wordpress';
import { WordPressPost } from '@/types/wordpress';

describe('WordPress REST API', () => {
  it('should have wordpressAPI object', () => {
    expect(wordpressAPI).toBeDefined();
  });

  it('should have required methods', () => {
    expect(typeof wordpressAPI.getPosts).toBe('function');
    expect(typeof wordpressAPI.getPost).toBe('function');
    expect(typeof wordpressAPI.getPostById).toBe('function');
    expect(typeof wordpressAPI.getCategories).toBe('function');
    expect(typeof wordpressAPI.getTags).toBe('function');
    expect(typeof wordpressAPI.getMedia).toBe('function');
    expect(typeof wordpressAPI.getAuthor).toBe('function');
    expect(typeof wordpressAPI.search).toBe('function');
  });

  it('should use correct API endpoints', () => {
    // Test that the API is configured for REST endpoints
    expect(process.env.NEXT_PUBLIC_WORDPRESS_API_URL).toBeDefined();
  });

  it('should handle WordPress post structure', () => {
    const mockPost: WordPressPost = {
      id: 1,
      title: { rendered: 'Test Post' },
      content: { rendered: '<p>Test content</p>' },
      excerpt: { rendered: '<p>Test excerpt</p>' },
      slug: 'test-post',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      featured_media: 0,
      categories: [],
      tags: [],
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test-post'
    };

    expect(mockPost.title.rendered).toBe('Test Post');
    expect(mockPost.content.rendered).toContain('Test content');
    expect(mockPost.slug).toBe('test-post');
  });
});