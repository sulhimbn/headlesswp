import { relationshipValidator } from '@/lib/validation/relationshipValidator';
import type { WordPressPost, WordPressCategory, WordPressTag, WordPressAuthor } from '@/types/wordpress';

describe('RelationshipValidator', () => {
  const categoriesMap = new Map<number, WordPressCategory>([
    [1, { id: 1, slug: 'news', name: 'News', link: 'https://example.com/category/news', description: '', parent: 0, count: 10 }],
    [2, { id: 2, slug: 'sports', name: 'Sports', link: 'https://example.com/category/sports', description: '', parent: 0, count: 5 }],
    [5, { id: 5, slug: 'technology', name: 'Technology', link: 'https://example.com/category/technology', description: '', parent: 0, count: 15 }]
  ]);

  const tagsMap = new Map<number, WordPressTag>([
    [10, { id: 10, slug: 'breaking', name: 'Breaking', link: 'https://example.com/tag/breaking', description: '', count: 20 }],
    [11, { id: 11, slug: 'local', name: 'Local', link: 'https://example.com/tag/local', description: '', count: 30 }],
    [15, { id: 15, slug: 'trending', name: 'Trending', link: 'https://example.com/tag/trending', description: '', count: 25 }]
  ]);

  const authorsMap = new Map<number, WordPressAuthor>([
    [100, { id: 100, slug: 'john-doe', name: 'John Doe', link: 'https://example.com/author/john-doe', description: '', avatar_urls: { '24': 'https://example.com/avatar.jpg' } }],
    [101, { id: 101, slug: 'jane-smith', name: 'Jane Smith', link: 'https://example.com/author/jane-smith', description: '', avatar_urls: { '24': 'https://example.com/avatar2.jpg' } }]
  ]);

  const validPost: WordPressPost = {
    id: 123,
    slug: 'test-post',
    title: { rendered: 'Test Post' },
    content: { rendered: '<p>Test content</p>' },
    excerpt: { rendered: 'Test excerpt' },
    date: '2026-01-10T00:00:00',
    modified: '2026-01-10T00:00:00',
    author: 100,
    categories: [1, 2],
    tags: [10, 11],
    featured_media: 0,
    status: 'publish',
    type: 'post',
    link: 'https://example.com/test-post'
  };

  describe('validatePostRelationships', () => {
    it('should validate post with all valid relationships', () => {
      const errors = relationshipValidator.validatePostRelationships(validPost, {
        categories: categoriesMap,
        tags: tagsMap,
        authors: authorsMap
      });

      expect(errors).toHaveLength(0);
    });

    it('should validate post with valid categories only', () => {
      const errors = relationshipValidator.validatePostRelationships(validPost, {
        categories: categoriesMap
      });

      expect(errors).toHaveLength(0);
    });

    it('should validate post with valid tags only', () => {
      const errors = relationshipValidator.validatePostRelationships(validPost, {
        tags: tagsMap
      });

      expect(errors).toHaveLength(0);
    });

    it('should validate post with valid author only', () => {
      const errors = relationshipValidator.validatePostRelationships(validPost, {
        authors: authorsMap
      });

      expect(errors).toHaveLength(0);
    });

    it('should detect invalid category IDs', () => {
      const postWithInvalidCategories = {
        ...validPost,
        categories: [1, 99, 5]
      };

      const errors = relationshipValidator.validatePostRelationships(postWithInvalidCategories, {
        categories: categoriesMap
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('Post.categories');
      expect(errors[0].rule).toBe('reference');
      expect(errors[0].message).toContain('99');
    });

    it('should detect invalid tag IDs', () => {
      const postWithInvalidTags = {
        ...validPost,
        tags: [10, 99, 15]
      };

      const errors = relationshipValidator.validatePostRelationships(postWithInvalidTags, {
        tags: tagsMap
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('Post.tags');
      expect(errors[0].rule).toBe('reference');
      expect(errors[0].message).toContain('99');
    });

    it('should detect invalid author ID', () => {
      const postWithInvalidAuthor = {
        ...validPost,
        author: 999
      };

      const errors = relationshipValidator.validatePostRelationships(postWithInvalidAuthor, {
        authors: authorsMap
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('Post.author');
      expect(errors[0].rule).toBe('reference');
      expect(errors[0].message).toContain('999');
    });

    it('should skip validation when no lookup maps provided', () => {
      const errors = relationshipValidator.validatePostRelationships(validPost, {});

      expect(errors).toHaveLength(0);
    });

    it('should skip category validation when categories map not provided', () => {
      const postWithInvalidCategories = {
        ...validPost,
        categories: [99]
      };

      const errors = relationshipValidator.validatePostRelationships(postWithInvalidCategories, {
        tags: tagsMap,
        authors: authorsMap
      });

      expect(errors).toHaveLength(0);
    });

    it('should skip tag validation when tags map not provided', () => {
      const postWithInvalidTags = {
        ...validPost,
        tags: [99]
      };

      const errors = relationshipValidator.validatePostRelationships(postWithInvalidTags, {
        categories: categoriesMap,
        authors: authorsMap
      });

      expect(errors).toHaveLength(0);
    });

    it('should skip author validation when authors map not provided', () => {
      const postWithInvalidAuthor = {
        ...validPost,
        author: 999
      };

      const errors = relationshipValidator.validatePostRelationships(postWithInvalidAuthor, {
        categories: categoriesMap,
        tags: tagsMap
      });

      expect(errors).toHaveLength(0);
    });

    it('should handle empty categories array', () => {
      const postWithEmptyCategories = {
        ...validPost,
        categories: []
      };

      const errors = relationshipValidator.validatePostRelationships(postWithEmptyCategories, {
        categories: categoriesMap
      });

      expect(errors).toHaveLength(0);
    });

    it('should handle empty tags array', () => {
      const postWithEmptyTags = {
        ...validPost,
        tags: []
      };

      const errors = relationshipValidator.validatePostRelationships(postWithEmptyTags, {
        tags: tagsMap
      });

      expect(errors).toHaveLength(0);
    });

    it('should handle post with zero author (no author)', () => {
      const postWithZeroAuthor = {
        ...validPost,
        author: 0
      };

      const errors = relationshipValidator.validatePostRelationships(postWithZeroAuthor, {
        authors: authorsMap
      });

      expect(errors).toHaveLength(0);
    });

    it('should handle multiple invalid IDs in same field', () => {
      const postWithMultipleInvalidCategories = {
        ...validPost,
        categories: [1, 99, 100, 5, 999]
      };

      const errors = relationshipValidator.validatePostRelationships(postWithMultipleInvalidCategories, {
        categories: categoriesMap
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('99, 100, 999');
    });

    it('should detect multiple relationship errors simultaneously', () => {
      const postWithMultipleErrors = {
        ...validPost,
        categories: [1, 99],
        tags: [10, 999],
        author: 888
      };

      const errors = relationshipValidator.validatePostRelationships(postWithMultipleErrors, {
        categories: categoriesMap,
        tags: tagsMap,
        authors: authorsMap
      });

      expect(errors).toHaveLength(3);
      expect(errors.some(e => e.field === 'Post.categories' && e.message.includes('99'))).toBe(true);
      expect(errors.some(e => e.field === 'Post.tags' && e.message.includes('999'))).toBe(true);
      expect(errors.some(e => e.field === 'Post.author' && e.message.includes('888'))).toBe(true);
    });
  });

  describe('validatePostsRelationships', () => {
    it('should validate multiple posts with valid relationships', () => {
      const posts: WordPressPost[] = [
        validPost,
        { ...validPost, id: 124, slug: 'test-post-2' },
        { ...validPost, id: 125, slug: 'test-post-3', categories: [5], tags: [15] }
      ];

      const errors = relationshipValidator.validatePostsRelationships(posts, {
        categories: categoriesMap,
        tags: tagsMap,
        authors: authorsMap
      });

      expect(errors).toHaveLength(0);
    });

    it('should detect invalid relationships across multiple posts', () => {
      const posts: WordPressPost[] = [
        validPost,
        { ...validPost, id: 124, slug: 'test-post-2', categories: [1, 99] },
        { ...validPost, id: 125, slug: 'test-post-3', tags: [10, 999] }
      ];

      const errors = relationshipValidator.validatePostsRelationships(posts, {
        categories: categoriesMap,
        tags: tagsMap,
        authors: authorsMap
      });

      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('Post[1].Post.categories');
      expect(errors[1].field).toBe('Post[2].Post.tags');
    });

    it('should include index in error messages for array validation', () => {
      const posts: WordPressPost[] = [
        validPost,
        { ...validPost, id: 124, slug: 'test-post-2', categories: [99] },
        { ...validPost, id: 125, slug: 'test-post-3' }
      ];

      const errors = relationshipValidator.validatePostsRelationships(posts, {
        categories: categoriesMap
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('Post[1].Post.categories');
      expect(errors[0].message).toContain('Post at index 1');
    });

    it('should handle empty posts array', () => {
      const errors = relationshipValidator.validatePostsRelationships([], {
        categories: categoriesMap,
        tags: tagsMap,
        authors: authorsMap
      });

      expect(errors).toHaveLength(0);
    });

    it('should detect multiple errors in single post within array', () => {
      const posts: WordPressPost[] = [
        { ...validPost, id: 124, slug: 'test-post-2', categories: [99], tags: [999], author: 888 }
      ];

      const errors = relationshipValidator.validatePostsRelationships(posts, {
        categories: categoriesMap,
        tags: tagsMap,
        authors: authorsMap
      });

      expect(errors).toHaveLength(3);
      expect(errors.every(e => e.field.startsWith('Post[0].'))).toBe(true);
    });
  });
});
