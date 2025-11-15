import { wordpressAPI } from '@/lib/wordpress';
import { WordPressPost } from '@/types/wordpress';
import { mockPosts, mockCategories, mockTags, mockMedia, mockAuthors } from './fixtures/wordpress-data';

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
    const mockPost: WordPressPost = mockPosts[0];

    expect(mockPost.title.rendered).toBe('Berita Pertama: Teknologi Terbaru');
    expect(mockPost.content.rendered).toContain('teknologi terbaru');
    expect(mockPost.slug).toBe('berita-pertama-teknologi-terbaru');
    expect(mockPost.categories).toContain(1);
    expect(mockPost.tags).toContain(1);
  });

  it('should validate mock data structure', () => {
    // Validate posts structure
    mockPosts.forEach(post => {
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('title.rendered');
      expect(post).toHaveProperty('content.rendered');
      expect(post).toHaveProperty('excerpt.rendered');
      expect(post).toHaveProperty('slug');
      expect(post).toHaveProperty('date');
      expect(post).toHaveProperty('status');
      expect(post).toHaveProperty('type');
    });

    // Validate categories structure
    mockCategories.forEach(category => {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('count');
    });

    // Validate tags structure
    mockTags.forEach(tag => {
      expect(tag).toHaveProperty('id');
      expect(tag).toHaveProperty('name');
      expect(tag).toHaveProperty('slug');
      expect(tag).toHaveProperty('count');
    });

    // Validate media structure
    mockMedia.forEach(media => {
      expect(media).toHaveProperty('id');
      expect(media).toHaveProperty('source_url');
      expect(media).toHaveProperty('media_type');
      expect(media).toHaveProperty('mime_type');
    });

    // Validate authors structure
    mockAuthors.forEach(author => {
      expect(author).toHaveProperty('id');
      expect(author).toHaveProperty('name');
      expect(author).toHaveProperty('slug');
      expect(author).toHaveProperty('avatar_urls');
    });
  });

  it('should have consistent data relationships', () => {
    const firstPost = mockPosts[0];
    
    // Check that category references exist
    expect(firstPost.categories.length).toBeGreaterThan(0);
    firstPost.categories.forEach(catId => {
      expect(mockCategories.find(cat => cat.id === catId)).toBeDefined();
    });

    // Check that tag references exist
    expect(firstPost.tags.length).toBeGreaterThan(0);
    firstPost.tags.forEach(tagId => {
      expect(mockTags.find(tag => tag.id === tagId)).toBeDefined();
    });

    // Check that author reference exists
    expect(mockAuthors.find(author => author.id === firstPost.author)).toBeDefined();

    // Check that media reference exists if featured_media is not 0
    if (firstPost.featured_media > 0) {
      expect(mockMedia.find(media => media.id === firstPost.featured_media)).toBeDefined();
    }
  });
});