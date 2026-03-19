import Ajv from 'ajv';
import { WordPressPostSchema, WordPressCategorySchema, WordPressTagSchema, WordPressMediaSchema, WordPressAuthorSchema, WordPressSearchResultSchema } from './schemas';

const ajv = new Ajv({ allErrors: true });

describe('WordPress REST API Contract Tests', () => {
  describe('Post Schema Validation', () => {
    it('validates a complete post response', () => {
      const validPost = {
        id: 1,
        title: { rendered: 'Test Post Title' },
        content: { rendered: '<p>Test content</p>' },
        excerpt: { rendered: '<p>Test excerpt</p>' },
        slug: 'test-post-title',
        date: '2026-01-01T00:00:00',
        modified: '2026-01-01T00:00:00',
        author: 1,
        featured_media: 0,
        categories: [1, 2],
        tags: [1, 2],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post-title'
      };

      const validate = ajv.compile(WordPressPostSchema);
      const isValid = validate(validPost);
      
      expect(isValid).toBe(true);
    });

    it('fails validation when required fields are missing', () => {
      const invalidPost = {
        id: 1,
        title: { rendered: 'Test Post' }
      };

      const validate = ajv.compile(WordPressPostSchema);
      const isValid = validate(invalidPost);
      
      expect(isValid).toBe(false);
      expect(validate.errors).toBeDefined();
    });

    it('validates correct data types', () => {
      const validPost = {
        id: 123,
        title: { rendered: 'Valid Title' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: '<p>Excerpt</p>' },
        slug: 'valid-slug',
        date: '2026-03-15T10:30:00',
        modified: '2026-03-15T12:00:00',
        author: 1,
        categories: [1, 2, 3],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/valid-slug'
      };

      const validate = ajv.compile(WordPressPostSchema);
      const isValid = validate(validPost);
      
      expect(isValid).toBe(true);
    });

    it('fails validation for invalid status enum', () => {
      const invalidPost = {
        id: 1,
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: '<p>Excerpt</p>' },
        slug: 'test',
        date: '2026-01-01T00:00:00',
        modified: '2026-01-01T00:00:00',
        author: 1,
        categories: [],
        tags: [],
        status: 'invalid_status',
        type: 'post',
        link: 'https://example.com/test'
      };

      const validate = ajv.compile(WordPressPostSchema);
      const isValid = validate(invalidPost);
      
      expect(isValid).toBe(false);
    });

    it('validates ISO 8601 date format', () => {
      const validPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: '<p>Excerpt</p>' },
        slug: 'test-date',
        date: '2026-03-19T14:30:00+00:00',
        modified: '2026-03-19T15:00:00+00:00',
        author: 1,
        categories: [],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-date'
      };

      const validate = ajv.compile(WordPressPostSchema);
      const isValid = validate(validPost);
      
      expect(isValid).toBe(true);
    });

    it('validates URL format for link field', () => {
      const validPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: '<p>Excerpt</p>' },
        slug: 'test-url',
        date: '2026-01-01T00:00:00',
        modified: '2026-01-01T00:00:00',
        author: 1,
        categories: [],
        tags: [],
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-url'
      };

      const validate = ajv.compile(WordPressPostSchema);
      const isValid = validate(validPost);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Category Schema Validation', () => {
    it('validates a complete category response', () => {
      const validCategory = {
        id: 1,
        name: 'Technology',
        slug: 'technology',
        description: 'Technology news and articles',
        parent: 0,
        count: 150,
        link: 'https://example.com/category/technology'
      };

      const validate = ajv.compile(WordPressCategorySchema);
      const isValid = validate(validCategory);
      
      expect(isValid).toBe(true);
    });

    it('fails validation when required fields are missing', () => {
      const invalidCategory = {
        id: 1,
        name: 'Technology'
      };

      const validate = ajv.compile(WordPressCategorySchema);
      const isValid = validate(invalidCategory);
      
      expect(isValid).toBe(false);
    });

    it('validates nested category structure', () => {
      const nestedCategory = {
        id: 5,
        name: 'Programming',
        slug: 'programming',
        description: 'Programming tutorials',
        parent: 1,
        count: 25,
        link: 'https://example.com/category/technology/programming'
      };

      const validate = ajv.compile(WordPressCategorySchema);
      const isValid = validate(nestedCategory);
      
      expect(isValid).toBe(true);
    });

    it('validates URL format for link field', () => {
      const validCategory = {
        id: 1,
        name: 'News',
        slug: 'news',
        description: '',
        parent: 0,
        count: 100,
        link: 'https://example.com/category/news'
      };

      const validate = ajv.compile(WordPressCategorySchema);
      const isValid = validate(validCategory);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Tag Schema Validation', () => {
    it('validates a complete tag response', () => {
      const validTag = {
        id: 1,
        name: 'JavaScript',
        slug: 'javascript',
        description: 'JavaScript programming language articles',
        count: 50,
        link: 'https://example.com/tag/javascript'
      };

      const validate = ajv.compile(WordPressTagSchema);
      const isValid = validate(validTag);
      
      expect(isValid).toBe(true);
    });

    it('fails validation when required fields are missing', () => {
      const invalidTag = {
        id: 1,
        name: 'JavaScript'
      };

      const validate = ajv.compile(WordPressTagSchema);
      const isValid = validate(invalidTag);
      
      expect(isValid).toBe(false);
    });

    it('validates empty description', () => {
      const validTag = {
        id: 1,
        name: 'Tag',
        slug: 'tag',
        description: '',
        count: 0,
        link: 'https://example.com/tag/tag'
      };

      const validate = ajv.compile(WordPressTagSchema);
      const isValid = validate(validTag);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Media Schema Validation', () => {
    it('validates a complete media response', () => {
      const validMedia = {
        id: 123,
        source_url: 'https://example.com/uploads/image.jpg',
        title: { rendered: 'Image Title' },
        alt_text: 'Alt text for image',
        media_type: 'image',
        mime_type: 'image/jpeg'
      };

      const validate = ajv.compile(WordPressMediaSchema);
      const isValid = validate(validMedia);
      
      expect(isValid).toBe(true);
    });

    it('validates video media type', () => {
      const validVideo = {
        id: 456,
        source_url: 'https://example.com/uploads/video.mp4',
        title: { rendered: 'Video Title' },
        alt_text: '',
        media_type: 'video',
        mime_type: 'video/mp4'
      };

      const validate = ajv.compile(WordPressMediaSchema);
      const isValid = validate(validVideo);
      
      expect(isValid).toBe(true);
    });

    it('fails validation for invalid media_type enum', () => {
      const invalidMedia = {
        id: 1,
        source_url: 'https://example.com/file.pdf',
        title: { rendered: 'File' },
        alt_text: '',
        media_type: 'document',
        mime_type: 'application/pdf'
      };

      const validate = ajv.compile(WordPressMediaSchema);
      const isValid = validate(invalidMedia);
      
      expect(isValid).toBe(false);
    });

    it('fails validation when required fields are missing', () => {
      const invalidMedia = {
        id: 1,
        source_url: 'https://example.com/image.jpg'
      };

      const validate = ajv.compile(WordPressMediaSchema);
      const isValid = validate(invalidMedia);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Author Schema Validation', () => {
    it('validates a complete author response', () => {
      const validAuthor = {
        id: 1,
        name: 'John Doe',
        slug: 'john-doe',
        description: 'Senior Developer',
        avatar_urls: {
          '24': 'https://example.com/avatar-24.jpg',
          '48': 'https://example.com/avatar-48.jpg',
          '96': 'https://example.com/avatar-96.jpg'
        },
        link: 'https://example.com/author/john-doe'
      };

      const validate = ajv.compile(WordPressAuthorSchema);
      const isValid = validate(validAuthor);
      
      expect(isValid).toBe(true);
    });

    it('fails validation when required fields are missing', () => {
      const invalidAuthor = {
        id: 1,
        name: 'John Doe'
      };

      const validate = ajv.compile(WordPressAuthorSchema);
      const isValid = validate(invalidAuthor);
      
      expect(isValid).toBe(false);
    });

    it('validates avatar_urls as flexible object', () => {
      const validAuthor = {
        id: 1,
        name: 'Jane Doe',
        slug: 'jane-doe',
        description: '',
        avatar_urls: {
          '96': 'https://example.com/avatar-96.jpg',
          '128': 'https://example.com/avatar-128.jpg'
        },
        link: 'https://example.com/author/jane-doe'
      };

      const validate = ajv.compile(WordPressAuthorSchema);
      const isValid = validate(validAuthor);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Search Result Schema Validation', () => {
    it('validates a complete search result response', () => {
      const validSearchResult = {
        id: 1,
        title: { rendered: 'Search Result Title' },
        url: 'https://example.com/search-result',
        type: 'post',
        subtype: 'post'
      };

      const validate = ajv.compile(WordPressSearchResultSchema);
      const isValid = validate(validSearchResult);
      
      expect(isValid).toBe(true);
    });

    it('fails validation when required fields are missing', () => {
      const invalidSearchResult = {
        id: 1,
        title: { rendered: 'Title' }
      };

      const validate = ajv.compile(WordPressSearchResultSchema);
      const isValid = validate(invalidSearchResult);
      
      expect(isValid).toBe(false);
    });

    it('validates page type search results', () => {
      const validPageResult = {
        id: 2,
        title: { rendered: 'About Page' },
        url: 'https://example.com/about',
        type: 'page',
        subtype: 'page'
      };

      const validate = ajv.compile(WordPressSearchResultSchema);
      const isValid = validate(validPageResult);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Collection Response Validation', () => {
    it('validates array of posts', () => {
      const posts = [
        {
          id: 1,
          title: { rendered: 'Post 1' },
          content: { rendered: '<p>Content 1</p>' },
          excerpt: { rendered: '<p>Excerpt 1</p>' },
          slug: 'post-1',
          date: '2026-01-01T00:00:00',
          modified: '2026-01-01T00:00:00',
          author: 1,
          categories: [1],
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
          date: '2026-01-02T00:00:00',
          modified: '2026-01-02T00:00:00',
          author: 1,
          categories: [1],
          tags: [1],
          status: 'publish',
          type: 'post',
          link: 'https://example.com/post-2'
        }
      ];

      const validate = ajv.compile({
        type: 'array',
        items: WordPressPostSchema
      });
      const isValid = validate(posts);
      
      expect(isValid).toBe(true);
    });

    it('validates array of categories', () => {
      const categories = [
        {
          id: 1,
          name: 'Category 1',
          slug: 'category-1',
          description: 'Description 1',
          parent: 0,
          count: 10,
          link: 'https://example.com/category/category-1'
        },
        {
          id: 2,
          name: 'Category 2',
          slug: 'category-2',
          description: 'Description 2',
          parent: 1,
          count: 5,
          link: 'https://example.com/category/category-1/category-2'
        }
      ];

      const validate = ajv.compile({
        type: 'array',
        items: WordPressCategorySchema
      });
      const isValid = validate(categories);
      
      expect(isValid).toBe(true);
    });

    it('validates empty arrays', () => {
      const validate = ajv.compile({
        type: 'array',
        items: WordPressPostSchema
      });
      const isValid = validate([]);
      
      expect(isValid).toBe(true);
    });
  });
});
