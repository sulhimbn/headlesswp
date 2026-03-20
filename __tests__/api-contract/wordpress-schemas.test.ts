import {
  WordPressPostSchema,
  WordPressCategorySchema,
  WordPressTagSchema,
  WordPressMediaSchema,
  WordPressAuthorSchema,
  validateWordPressPost,
  validateWordPressCategory,
  validateWordPressTag,
  validateWordPressMedia,
  validateWordPressAuthor,
  validateWordPressPostArray,
  validateWordPressCategoryArray,
  validateWordPressTagArray,
  validateWordPressMediaArray
} from '@/lib/validation/wpSchemas';
import { ZodError } from 'zod';

describe('WordPress API Contract Tests', () => {
  describe('Post Schema Contract Tests', () => {
    it('should validate a complete post object', () => {
      const validPost = {
        id: 1,
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>Test content</p>' },
        excerpt: { rendered: '<p>Test excerpt</p>' },
        slug: 'test-post',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        featured_media: 0,
        categories: [1, 2],
        tags: [3, 4],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post'
      };

      const result = validateWordPressPost(validPost);
      expect(result.id).toBe(1);
      expect(result.title.rendered).toBe('Test Post');
    });

    it('should reject post with missing required fields', () => {
      const invalidPost = {
        id: 1,
        title: { rendered: 'Test Post' }
      };

      expect(() => validateWordPressPost(invalidPost)).toThrow(ZodError);
    });

    it('should reject post with invalid link URL', () => {
      const invalidPost = {
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
        link: 'not-a-url'
      };

      expect(() => validateWordPressPost(invalidPost)).toThrow(ZodError);
    });

    it('should validate array of posts', () => {
      const validPosts = [
        {
          id: 1,
          title: { rendered: 'Post 1' },
          content: { rendered: '<p>Content 1</p>' },
          excerpt: { rendered: '<p>Excerpt 1</p>' },
          slug: 'post-1',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          author: 1,
          featured_media: 0,
          categories: [],
          tags: [],
          status: 'publish',
          type: 'post',
          link: 'https://example.com/post-1'
        },
        {
          id: 2,
          title: { rendered: 'Post 2' },
          content: { rendered: '<p>Content 2</p>' },
          excerpt: { rendered: '<p>Excerpt 2</p>' },
          slug: 'post-2',
          date: '2024-01-02T00:00:00',
          modified: '2024-01-02T00:00:00',
          author: 1,
          featured_media: 0,
          categories: [],
          tags: [],
          status: 'publish',
          type: 'post',
          link: 'https://example.com/post-2'
        }
      ];

      const result = validateWordPressPostArray(validPosts);
      expect(result).toHaveLength(2);
    });
  });

  describe('Category Schema Contract Tests', () => {
    it('should validate a complete category object', () => {
      const validCategory = {
        id: 1,
        name: 'Technology',
        slug: 'technology',
        description: 'Tech news and articles',
        parent: 0,
        count: 10,
        link: 'https://example.com/category/technology'
      };

      const result = validateWordPressCategory(validCategory);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Technology');
      expect(result.slug).toBe('technology');
    });

    it('should reject category with missing required fields', () => {
      const invalidCategory = {
        id: 1,
        name: 'Technology'
      };

      expect(() => validateWordPressCategory(invalidCategory)).toThrow(ZodError);
    });

    it('should reject category with negative count', () => {
      const invalidCategory = {
        id: 1,
        name: 'Technology',
        slug: 'technology',
        description: 'Tech news',
        parent: 0,
        count: -1,
        link: 'https://example.com/category/technology'
      };

      expect(() => validateWordPressCategory(invalidCategory)).toThrow(ZodError);
    });

    it('should validate array of categories', () => {
      const validCategories = [
        { id: 1, name: 'Tech', slug: 'tech', description: '', parent: 0, count: 5, link: 'https://example.com/1' },
        { id: 2, name: 'News', slug: 'news', description: '', parent: 0, count: 3, link: 'https://example.com/2' }
      ];

      const result = validateWordPressCategoryArray(validCategories);
      expect(result).toHaveLength(2);
    });
  });

  describe('Tag Schema Contract Tests', () => {
    it('should validate a complete tag object', () => {
      const validTag = {
        id: 1,
        name: 'JavaScript',
        slug: 'javascript',
        description: 'Posts about JavaScript',
        count: 15,
        link: 'https://example.com/tag/javascript'
      };

      const result = validateWordPressTag(validTag);
      expect(result.id).toBe(1);
      expect(result.name).toBe('JavaScript');
      expect(result.slug).toBe('javascript');
    });

    it('should reject tag with missing required fields', () => {
      const invalidTag = {
        id: 1,
        name: 'JavaScript'
      };

      expect(() => validateWordPressTag(invalidTag)).toThrow(ZodError);
    });

    it('should validate array of tags', () => {
      const validTags = [
        { id: 1, name: 'JS', slug: 'js', description: '', count: 5, link: 'https://example.com/1' },
        { id: 2, name: 'React', slug: 'react', description: '', count: 10, link: 'https://example.com/2' }
      ];

      const result = validateWordPressTagArray(validTags);
      expect(result).toHaveLength(2);
    });
  });

  describe('Media Schema Contract Tests', () => {
    it('should validate a complete media object', () => {
      const validMedia = {
        id: 1,
        source_url: 'https://example.com/image.jpg',
        title: { rendered: 'Image Title' },
        alt_text: 'Alt text for image',
        media_type: 'image',
        mime_type: 'image/jpeg'
      };

      const result = validateWordPressMedia(validMedia);
      expect(result.id).toBe(1);
      expect(result.source_url).toBe('https://example.com/image.jpg');
      expect(result.mime_type).toBe('image/jpeg');
    });

    it('should reject media with missing required fields', () => {
      const invalidMedia = {
        id: 1,
        source_url: 'https://example.com/image.jpg'
      };

      expect(() => validateWordPressMedia(invalidMedia)).toThrow(ZodError);
    });

    it('should reject media with invalid source_url', () => {
      const invalidMedia = {
        id: 1,
        source_url: 'not-a-url',
        title: { rendered: 'Image' },
        alt_text: 'Alt',
        media_type: 'image',
        mime_type: 'image/jpeg'
      };

      expect(() => validateWordPressMedia(invalidMedia)).toThrow(ZodError);
    });

    it('should validate array of media', () => {
      const validMedia = [
        { id: 1, source_url: 'https://example.com/1.jpg', title: { rendered: '1' }, alt_text: 'alt', media_type: 'image', mime_type: 'image/jpeg' },
        { id: 2, source_url: 'https://example.com/2.jpg', title: { rendered: '2' }, alt_text: 'alt', media_type: 'image', mime_type: 'image/png' }
      ];

      const result = validateWordPressMediaArray(validMedia);
      expect(result).toHaveLength(2);
    });
  });

  describe('Author Schema Contract Tests', () => {
    it('should validate a complete author object', () => {
      const validAuthor = {
        id: 1,
        name: 'John Doe',
        slug: 'john-doe',
        description: 'Author bio',
        avatar_urls: {
          '24': 'https://example.com/avatar-24.jpg',
          '48': 'https://example.com/avatar-48.jpg',
          '96': 'https://example.com/avatar-96.jpg'
        },
        link: 'https://example.com/author/john-doe'
      };

      const result = validateWordPressAuthor(validAuthor);
      expect(result.id).toBe(1);
      expect(result.name).toBe('John Doe');
    });

    it('should reject author with missing required fields', () => {
      const invalidAuthor = {
        id: 1,
        name: 'John Doe'
      };

      expect(() => validateWordPressAuthor(invalidAuthor)).toThrow(ZodError);
    });

    it('should reject author with invalid avatar_urls structure', () => {
      const invalidAuthor = {
        id: 1,
        name: 'John Doe',
        slug: 'john-doe',
        description: '',
        avatar_urls: 'not-an-object',
        link: 'https://example.com/author/john-doe'
      };

      expect(() => validateWordPressAuthor(invalidAuthor)).toThrow(ZodError);
    });
  });
});

describe('Schema Validation Edge Cases', () => {
  it('should handle optional fields correctly', () => {
    const postWithOptionalFields = {
      id: 1,
      title: { rendered: 'Test' },
      content: { rendered: '<p>Content</p>' },
      excerpt: { rendered: '<p>Excerpt</p>' },
      slug: 'test',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      featured_media: 0,
      categories: [],
      tags: [],
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test'
    };

    const result = validateWordPressPost(postWithOptionalFields);
    expect(result).toBeDefined();
  });

  it('should reject null values for required fields', () => {
    const nullPost = {
      id: null,
      title: { rendered: 'Test' },
      content: { rendered: '<p>Content</p>' },
      excerpt: { rendered: '<p>Excerpt</p>' },
      slug: 'test',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      featured_media: 0,
      categories: [],
      tags: [],
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test'
    };

    expect(() => validateWordPressPost(nullPost)).toThrow(ZodError);
  });

  it('should reject undefined values for required fields', () => {
    const undefinedPost = {
      id: 1,
      title: undefined,
      content: { rendered: '<p>Content</p>' },
      excerpt: { rendered: '<p>Excerpt</p>' },
      slug: 'test',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      featured_media: 0,
      categories: [],
      tags: [],
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test'
    };

    expect(() => validateWordPressPost(undefinedPost)).toThrow(ZodError);
  });
});