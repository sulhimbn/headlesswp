import { dataValidator, isValidationResultValid, unwrapValidationResult, unwrapValidationResultSafe } from '@/lib/validation/dataValidator';
import { WordPressPost, WordPressCategory, WordPressTag } from '@/types/wordpress';

describe('DataValidator Type Guards', () => {
  describe('isValidationResultValid', () => {
    it('should return true for valid post validation result', () => {
      const mockPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test Post' },
        content: { rendered: 'Test content' },
        excerpt: { rendered: 'Test excerpt' },
        slug: 'test-post',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        featured_media: 0,
        categories: [1],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post'
      };

      const result = dataValidator.validatePost(mockPost);

      if (isValidationResultValid(result)) {
        expect(result.valid).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.id).toBe(1);
      } else {
        fail('Result should be valid');
      }
    });

    it('should return false for invalid post validation result', () => {
      const invalidData = { id: 'not a number' };
      const result = dataValidator.validatePost(invalidData);

      expect(isValidationResultValid(result)).toBe(false);
    });

    it('should narrow type correctly for valid result', () => {
      const mockPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test Post' },
        content: { rendered: 'Test content' },
        excerpt: { rendered: 'Test excerpt' },
        slug: 'test-post',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        featured_media: 0,
        categories: [1],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post'
      };

      const result = dataValidator.validatePost(mockPost);

      if (isValidationResultValid(result)) {
        expect(typeof result.data.id).toBe('number');
        expect(result.data.title.rendered).toBe('Test Post');
      } else {
        fail('Result should be valid');
      }
    });

    it('should narrow type correctly for invalid result', () => {
      const invalidData = { id: 'not a number' };
      const result = dataValidator.validatePost(invalidData);

      if (!isValidationResultValid(result)) {
        expect(result.valid).toBe(false);
        expect(result.data).toBeUndefined();
      }
    });

    it('should work with posts array validation', () => {
      const mockPosts: WordPressPost[] = [
        {
          id: 1,
          title: { rendered: 'Post 1' },
          content: { rendered: 'Content 1' },
          excerpt: { rendered: 'Excerpt 1' },
          slug: 'post-1',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          author: 1,
          featured_media: 0,
          categories: [1],
          tags: [],
          status: 'publish',
          type: 'post',
          link: 'https://example.com/post-1'
        }
      ];

      const result = dataValidator.validatePosts(mockPosts);

      if (isValidationResultValid(result)) {
        expect(result.valid).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe(1);
      } else {
        fail('Result should be valid');
      }
    });

    it('should work with categories validation', () => {
      const mockCategory: WordPressCategory = {
        id: 1,
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description',
        parent: 0,
        count: 10,
        link: 'https://example.com/category/test-category'
      };

      const result = dataValidator.validateCategory(mockCategory);

      if (isValidationResultValid(result)) {
        expect(result.valid).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.name).toBe('Test Category');
      } else {
        fail('Result should be valid');
      }
    });

    it('should work with tags validation', () => {
      const mockTag: WordPressTag = {
        id: 1,
        name: 'Test Tag',
        slug: 'test-tag',
        description: 'Test description',
        count: 5,
        link: 'https://example.com/tag/test-tag'
      };

      const result = dataValidator.validateTag(mockTag);

      if (isValidationResultValid(result)) {
        expect(result.valid).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.name).toBe('Test Tag');
      } else {
        fail('Result should be valid');
      }
    });

    it('should work with categories array validation', () => {
      const mockCategories: WordPressCategory[] = [
        {
          id: 1,
          name: 'Category 1',
          slug: 'category-1',
          description: 'Description 1',
          parent: 0,
          count: 10,
          link: 'https://example.com/category/category-1'
        }
      ];

      const result = dataValidator.validateCategories(mockCategories);

      if (isValidationResultValid(result)) {
        expect(result.valid).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe(1);
      } else {
        fail('Result should be valid');
      }
    });

    it('should work with tags array validation', () => {
      const mockTags: WordPressTag[] = [
        {
          id: 1,
          name: 'Tag 1',
          slug: 'tag-1',
          description: 'Description 1',
          count: 5,
          link: 'https://example.com/tag/tag-1'
        }
      ];

      const result = dataValidator.validateTags(mockTags);

      if (isValidationResultValid(result)) {
        expect(result.valid).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe(1);
      } else {
        fail('Result should be valid');
      }
    });
  });

  describe('unwrapValidationResult', () => {
    it('should return data when validation result is valid', () => {
      const mockPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test Post' },
        content: { rendered: 'Test content' },
        excerpt: { rendered: 'Test excerpt' },
        slug: 'test-post',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        featured_media: 0,
        categories: [1],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post'
      };

      const result = dataValidator.validatePost(mockPost);
      const data = unwrapValidationResult(result);

      expect(data).toEqual(mockPost);
    });

    it('should throw error when validation result is invalid', () => {
      const invalidData = { id: 'not a number' };
      const result = dataValidator.validatePost(invalidData);

      expect(() => unwrapValidationResult(result)).toThrow('Validation failed:');
    });

    it('should include error messages in thrown error', () => {
      const invalidData = { id: 'not a number' };
      const result = dataValidator.validatePost(invalidData);

      expect(() => unwrapValidationResult(result)).toThrow('Post.id must be a number');
    });

    it('should work with array data types', () => {
      const mockPosts: WordPressPost[] = [
        {
          id: 1,
          title: { rendered: 'Post 1' },
          content: { rendered: 'Content 1' },
          excerpt: { rendered: 'Excerpt 1' },
          slug: 'post-1',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          author: 1,
          featured_media: 0,
          categories: [1],
          tags: [],
          status: 'publish',
          type: 'post',
          link: 'https://example.com/post-1'
        }
      ];

      const result = dataValidator.validatePosts(mockPosts);
      const data = unwrapValidationResult(result);

      expect(data).toEqual(mockPosts);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should work with complex nested types', () => {
      const mockCategory: WordPressCategory = {
        id: 1,
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description',
        parent: 0,
        count: 10,
        link: 'https://example.com/category/test-category'
      };

      const result = dataValidator.validateCategory(mockCategory);
      const data = unwrapValidationResult(result);

      expect(data).toEqual(mockCategory);
    });
  });

  describe('unwrapValidationResultSafe', () => {
    it('should return data when validation result is valid', () => {
      const mockPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test Post' },
        content: { rendered: 'Test content' },
        excerpt: { rendered: 'Test excerpt' },
        slug: 'test-post',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        featured_media: 0,
        categories: [1],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post'
      };

      const result = dataValidator.validatePost(mockPost);
      const fallback: WordPressPost = {
        id: 1,
        title: { rendered: 'Fallback' },
        content: { rendered: 'Fallback content' },
        excerpt: { rendered: 'Fallback excerpt' },
        slug: 'fallback',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 0,
        featured_media: 0,
        categories: [1],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/fallback'
      };

      const data = unwrapValidationResultSafe(result, fallback);

      expect(data).toEqual(mockPost);
    });

    it('should return fallback when validation result is invalid', () => {
      const invalidData = { id: 'not a number' };
      const result = dataValidator.validatePost(invalidData);

      const fallback: WordPressPost = {
        id: 0,
        title: { rendered: 'Fallback' },
        content: { rendered: 'Fallback content' },
        excerpt: { rendered: 'Fallback excerpt' },
        slug: 'fallback',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 0,
        featured_media: 0,
        categories: [1],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/fallback'
      };

      const data = unwrapValidationResultSafe(result, fallback);

      expect(data).toEqual(fallback);
      expect(data.id).toBe(0);
    });

    it('should not throw error when validation result is invalid', () => {
      const invalidData = { id: 'not a number' };
      const result = dataValidator.validatePost(invalidData);

      const fallback: WordPressPost = {
        id: 1,
        title: { rendered: 'Fallback' },
        content: { rendered: 'Fallback content' },
        excerpt: { rendered: 'Fallback excerpt' },
        slug: 'fallback',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 0,
        featured_media: 0,
        categories: [1],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/fallback'
      };

      expect(() => unwrapValidationResultSafe(result, fallback)).not.toThrow();
    });

    it('should work with array data and array fallback', () => {
      const mockPosts: WordPressPost[] = [];
      const result = dataValidator.validatePosts(mockPosts);
      const fallback: WordPressPost[] = [];

      const data = unwrapValidationResultSafe(result, fallback);

      expect(data).toEqual([]);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should work with empty array fallback', () => {
      const invalidData = 'not an array';
      const result = dataValidator.validatePosts(invalidData);
      const fallback: WordPressPost[] = [];

      const data = unwrapValidationResultSafe(result, fallback);

      expect(data).toEqual([]);
    });

    it('should work with null fallback for single item', () => {
      const invalidData = { id: 'not a number' };
      const result = dataValidator.validatePost(invalidData);

      const data = unwrapValidationResultSafe(result, null);

      expect(data).toBeNull();
    });

    it('should work with complex nested types', () => {
      const mockCategory: WordPressCategory = {
        id: 1,
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description',
        parent: 0,
        count: 10,
        link: 'https://example.com/category/test-category'
      };

      const result = dataValidator.validateCategory(mockCategory);
      const fallback: WordPressCategory = {
        id: 1,
        name: 'Fallback',
        slug: 'fallback',
        description: 'Fallback description',
        parent: 0,
        count: 0,
        link: 'https://example.com/category/fallback'
      };

      const data = unwrapValidationResultSafe(result, fallback);

      expect(data).toEqual(mockCategory);
    });

    it('should maintain type safety with fallback', () => {
      const invalidData = { id: 'not a number' };
      const result = dataValidator.validatePost(invalidData);
      const fallback: WordPressPost = {
        id: 1,
        title: { rendered: 'Fallback' },
        content: { rendered: 'Fallback content' },
        excerpt: { rendered: 'Fallback excerpt' },
        slug: 'fallback',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 0,
        featured_media: 0,
        categories: [1],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/fallback'
      };

      const data = unwrapValidationResultSafe(result, fallback);

      expect(typeof data.id).toBe('number');
      expect(data.title).toHaveProperty('rendered');
    });
  });

  describe('Integration with enhancedPostService', () => {
    it('should enable type-safe data access without null checks', () => {
      const mockPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test Post' },
        content: { rendered: 'Test content' },
        excerpt: { rendered: 'Test excerpt' },
        slug: 'test-post',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        featured_media: 0,
        categories: [1],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post'
      };

      const result = dataValidator.validatePost(mockPost);

      if (isValidationResultValid(result)) {
        expect(() => {
          const title = result.data.title.rendered;
          expect(title).toBe('Test Post');
        }).not.toThrow();
      }
    });

    it('should prevent accessing data on invalid results', () => {
      const invalidData = { id: 'not a number' };
      const result = dataValidator.validatePost(invalidData);

      if (!isValidationResultValid(result)) {
        expect(result.data).toBeUndefined();
        expect(result.data?.title?.rendered).toBeUndefined();
      }
    });
  });
});
