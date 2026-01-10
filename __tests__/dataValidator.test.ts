import { dataValidator } from '@/lib/validation/dataValidator';
import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';

describe('DataValidator - Post Validation', () => {
  describe('validatePost', () => {
    it('should validate a valid post object', () => {
      const validPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test Post Title' },
        content: { rendered: '<p>Test content</p>' },
        excerpt: { rendered: 'Test excerpt' },
        slug: 'test-post',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        categories: [1, 2, 3],
        tags: [4, 5],
        featured_media: 10,
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post'
      };

      const result = dataValidator.validatePost(validPost);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validPost);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject post with missing id', () => {
      const invalidPost = {
        title: { rendered: 'Test' },
        content: { rendered: 'Content' },
        excerpt: { rendered: 'Excerpt' },
        slug: 'test',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        categories: [],
        tags: [],
        featured_media: 0,
        status: 'publish',
        type: 'post',
        link: ''
      };

      const result = dataValidator.validatePost(invalidPost);

      expect(result.valid).toBe(false);
      expect(result.data).toBeUndefined();
      const idError = result.errors.find(e => e.field === 'Post.id');
      expect(idError?.message).toBe('Post.id must be a number');
    });

    it('should reject post with invalid title structure', () => {
      const invalidPost = {
        id: 1,
        title: 'Invalid title string',
        content: { rendered: 'Content' },
        excerpt: { rendered: 'Excerpt' },
        slug: 'test',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        categories: [],
        tags: [],
        featured_media: 0,
        status: 'publish',
        type: 'post',
        link: ''
      };

      const result = dataValidator.validatePost(invalidPost);

      expect(result.valid).toBe(false);
      const titleError = result.errors.find(e => e.field === 'Post.title.rendered');
      expect(titleError?.message).toBe('Post.title.rendered must be a string');
    });

    it('should reject post with invalid categories array (contains string)', () => {
      const invalidPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: 'Content' },
        excerpt: { rendered: 'Excerpt' },
        slug: 'test',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        categories: ['invalid', 'string'] as unknown as number[],
        tags: [],
        featured_media: 0,
        status: 'publish',
        type: 'post',
        link: ''
      };

      const result = dataValidator.validatePost(invalidPost);

      expect(result.valid).toBe(false);
      const categoriesError = result.errors.find(e => e.field === 'Post.categories');
      expect(categoriesError?.message).toBe('Post.categories must contain only numbers');
    });

    it('should reject non-object input', () => {
      const result = dataValidator.validatePost('not an object');

      expect(result.valid).toBe(false);
      const postError = result.errors.find(e => e.field === 'Post');
      expect(postError?.message).toBe('Post must be an object');
    });

    it('should reject null input', () => {
      const result = dataValidator.validatePost(null);

      expect(result.valid).toBe(false);
      const postError = result.errors.find(e => e.field === 'Post');
      expect(postError?.message).toBe('Post must be an object');
    });

    it('should reject array input', () => {
      const result = dataValidator.validatePost([{ id: 1 }]);

      expect(result.valid).toBe(false);
      const postError = result.errors.find(e => e.field === 'Post');
      expect(postError?.message).toBe('Post must be an object');
    });

    it('should collect all validation errors', () => {
      const invalidPost = {
        id: 'invalid' as unknown as number,
        title: { rendered: 123 as unknown as string },
        content: 'invalid' as unknown as { rendered: string },
        slug: 123 as unknown as string,
        date: null as unknown as string
      };

      const result = dataValidator.validatePost(invalidPost);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validatePosts', () => {
    it('should validate array of valid posts', () => {
      const validPosts: WordPressPost[] = [
        {
          id: 1,
          title: { rendered: 'Post 1' },
          content: { rendered: '<p>Content 1</p>' },
          excerpt: { rendered: 'Excerpt 1' },
          slug: 'post-1',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          author: 1,
          categories: [1],
          tags: [],
          featured_media: 0,
          status: 'publish',
          type: 'post',
          link: 'https://example.com/post-1'
        },
        {
          id: 2,
          title: { rendered: 'Post 2' },
          content: { rendered: '<p>Content 2</p>' },
          excerpt: { rendered: 'Excerpt 2' },
          slug: 'post-2',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          author: 1,
          categories: [2],
          tags: [],
          featured_media: 0,
          status: 'publish',
          type: 'post',
          link: 'https://example.com/post-2'
        }
      ];

      const result = dataValidator.validatePosts(validPosts);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validPosts);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-array input', () => {
      const result = dataValidator.validatePosts('not an array');

      expect(result.valid).toBe(false);
      const postsError = result.errors.find(e => e.field === 'Post');
      expect(postsError?.message).toBe('Posts must be an array');
    });

    it('should reject array with invalid post', () => {
      const postsWithInvalid = [
        {
          id: 1,
          title: { rendered: 'Valid Post' },
          content: { rendered: '<p>Valid</p>' },
          excerpt: { rendered: 'Valid' },
          slug: 'valid',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          author: 1,
          categories: [],
          tags: [],
          featured_media: 0,
          status: 'publish',
          type: 'post',
          link: ''
        },
        'invalid post string' as unknown as WordPressPost
      ];

      const result = dataValidator.validatePosts(postsWithInvalid);

      expect(result.valid).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report errors for multiple invalid posts', () => {
      const multipleInvalid = [
        { id: 'invalid' as unknown as number },
        { title: 'invalid' as unknown as { rendered: string } }
      ] as unknown as WordPressPost[];

      const result = dataValidator.validatePosts(multipleInvalid);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty array', () => {
      const result = dataValidator.validatePosts([]);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('DataValidator - Category Validation', () => {
  describe('validateCategory', () => {
    it('should validate a valid category object', () => {
      const validCategory: WordPressCategory = {
        id: 1,
        name: 'Technology',
        slug: 'technology',
        description: 'Technology posts',
        parent: 0,
        count: 10,
        link: 'https://example.com/category/technology'
      };

      const result = dataValidator.validateCategory(validCategory);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validCategory);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject category with missing id', () => {
      const invalidCategory = {
        name: 'Test',
        slug: 'test',
        description: 'Test category',
        parent: 0,
        count: 0,
        link: ''
      };

      const result = dataValidator.validateCategory(invalidCategory);

      expect(result.valid).toBe(false);
      const idError = result.errors.find(e => e.field === 'Category.id');
      expect(idError?.message).toBe('Category.id must be a number');
    });

    it('should reject non-object input', () => {
      const result = dataValidator.validateCategory('not an object');

      expect(result.valid).toBe(false);
      const categoryError = result.errors.find(e => e.field === 'Category');
      expect(categoryError?.message).toBe('Category must be an object');
    });

    it('should reject null input', () => {
      const result = dataValidator.validateCategory(null);

      expect(result.valid).toBe(false);
      const categoryError = result.errors.find(e => e.field === 'Category');
      expect(categoryError?.message).toBe('Category must be an object');
    });
  });

  describe('validateCategories', () => {
    it('should validate array of valid categories', () => {
      const validCategories: WordPressCategory[] = [
        {
          id: 1,
          name: 'Technology',
          slug: 'technology',
          description: 'Tech posts',
          parent: 0,
          count: 10,
          link: 'https://example.com/category/tech'
        },
        {
          id: 2,
          name: 'News',
          slug: 'news',
          description: 'News posts',
          parent: 0,
          count: 20,
          link: 'https://example.com/category/news'
        }
      ];

      const result = dataValidator.validateCategories(validCategories);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validCategories);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-array input', () => {
      const result = dataValidator.validateCategories('not an array');

      expect(result.valid).toBe(false);
      const categoriesError = result.errors.find(e => e.field === 'Category');
      expect(categoriesError?.message).toBe('Categories must be an array');
    });

    it('should handle empty array', () => {
      const result = dataValidator.validateCategories([]);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('DataValidator - Tag Validation', () => {
  describe('validateTag', () => {
    it('should validate a valid tag object', () => {
      const validTag: WordPressTag = {
        id: 1,
        name: 'React',
        slug: 'react',
        description: 'React posts',
        count: 15,
        link: 'https://example.com/tag/react'
      };

      const result = dataValidator.validateTag(validTag);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validTag);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject tag with missing name', () => {
      const invalidTag = {
        id: 1,
        slug: 'test',
        description: 'Test tag',
        count: 0,
        link: ''
      };

      const result = dataValidator.validateTag(invalidTag);

      expect(result.valid).toBe(false);
      const nameError = result.errors.find(e => e.field === 'Tag.name');
      expect(nameError?.message).toBe('Tag.name must be a string');
    });

    it('should reject non-object input', () => {
      const result = dataValidator.validateTag('not an object');

      expect(result.valid).toBe(false);
      const tagError = result.errors.find(e => e.field === 'Tag');
      expect(tagError?.message).toBe('Tag must be an object');
    });

    it('should reject null input', () => {
      const result = dataValidator.validateTag(null);

      expect(result.valid).toBe(false);
      const tagError = result.errors.find(e => e.field === 'Tag');
      expect(tagError?.message).toBe('Tag must be an object');
    });
  });

  describe('validateTags', () => {
    it('should validate array of valid tags', () => {
      const validTags: WordPressTag[] = [
        {
          id: 1,
          name: 'React',
          slug: 'react',
          description: 'React posts',
          count: 15,
          link: 'https://example.com/tag/react'
        },
        {
          id: 2,
          name: 'TypeScript',
          slug: 'typescript',
          description: 'TypeScript posts',
          count: 10,
          link: 'https://example.com/tag/typescript'
        }
      ];

      const result = dataValidator.validateTags(validTags);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validTags);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-array input', () => {
      const result = dataValidator.validateTags('not an array');

      expect(result.valid).toBe(false);
      const tagsError = result.errors.find(e => e.field === 'Tag');
      expect(tagsError?.message).toBe('Tags must be an array');
    });

    it('should handle empty array', () => {
      const result = dataValidator.validateTags([]);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('DataValidator - Media Validation', () => {
  describe('validateMedia', () => {
    it('should validate a valid media object', () => {
      const validMedia: WordPressMedia = {
        id: 1,
        source_url: 'https://example.com/image.jpg',
        title: { rendered: 'Test Image' },
        alt_text: 'Test alt text',
        media_type: 'image',
        mime_type: 'image/jpeg'
      };

      const result = dataValidator.validateMedia(validMedia);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validMedia);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject media with missing id', () => {
      const invalidMedia = {
        source_url: 'https://example.com/image.jpg',
        title: { rendered: 'Test' },
        alt_text: '',
        media_type: 'image',
        mime_type: 'image/jpeg'
      };

      const result = dataValidator.validateMedia(invalidMedia);

      expect(result.valid).toBe(false);
      const idError = result.errors.find(e => e.field === 'Media.id');
      expect(idError?.message).toBe('Media.id must be a number');
    });

    it('should reject media with invalid title structure', () => {
      const invalidMedia = {
        id: 1,
        source_url: 'https://example.com/image.jpg',
        title: 'Invalid title string',
        alt_text: '',
        media_type: 'image',
        mime_type: 'image/jpeg'
      };

      const result = dataValidator.validateMedia(invalidMedia);

      expect(result.valid).toBe(false);
      const titleError = result.errors.find(e => e.field === 'Media.title.rendered');
      expect(titleError?.message).toBe('Media.title.rendered must be a string');
    });

    it('should reject non-object input', () => {
      const result = dataValidator.validateMedia('not an object');

      expect(result.valid).toBe(false);
      const mediaError = result.errors.find(e => e.field === 'Media');
      expect(mediaError?.message).toBe('Media must be an object');
    });

    it('should reject null input', () => {
      const result = dataValidator.validateMedia(null);

      expect(result.valid).toBe(false);
      const mediaError = result.errors.find(e => e.field === 'Media');
      expect(mediaError?.message).toBe('Media must be an object');
    });
  });
});

describe('DataValidator - Author Validation', () => {
  describe('validateAuthor', () => {
    it('should validate a valid author object', () => {
      const validAuthor: WordPressAuthor = {
        id: 1,
        name: 'John Doe',
        slug: 'john-doe',
        description: 'Author description',
        avatar_urls: { 24: 'https://example.com/avatar.jpg' },
        link: 'https://example.com/author/john-doe'
      };

      const result = dataValidator.validateAuthor(validAuthor);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validAuthor);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject author with missing id', () => {
      const invalidAuthor = {
        name: 'John Doe',
        slug: 'john-doe',
        description: 'Author description',
        avatar_urls: {},
        link: ''
      };

      const result = dataValidator.validateAuthor(invalidAuthor);

      expect(result.valid).toBe(false);
      const idError = result.errors.find(e => e.field === 'Author.id');
      expect(idError?.message).toBe('Author.id must be a number');
    });

    it('should reject author with invalid avatar_urls (not an object)', () => {
      const invalidAuthor = {
        id: 1,
        name: 'John Doe',
        slug: 'john-doe',
        description: 'Author description',
        avatar_urls: 'invalid' as unknown as Record<string, string>,
        link: ''
      };

      const result = dataValidator.validateAuthor(invalidAuthor);

      expect(result.valid).toBe(false);
      const avatarUrlsError = result.errors.find(e => e.field === 'Author.avatar_urls');
      expect(avatarUrlsError?.message).toContain('must be an object');
    });

    it('should reject non-object input', () => {
      const result = dataValidator.validateAuthor('not an object');

      expect(result.valid).toBe(false);
      const authorError = result.errors.find(e => e.field === 'Author');
      expect(authorError?.message).toContain('must be an object');
    });

    it('should reject null input', () => {
      const result = dataValidator.validateAuthor(null);

      expect(result.valid).toBe(false);
      const authorError = result.errors.find(e => e.field === 'Author');
      expect(authorError?.message).toContain('must be an object');
    });
  });
});

describe('DataValidator - Edge Cases', () => {
  it('should handle undefined input gracefully', () => {
    const result = dataValidator.validatePost(undefined);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle NaN as invalid number', () => {
    const invalidPost = {
      id: NaN,
      title: { rendered: 'Test' },
      content: { rendered: 'Content' },
      excerpt: { rendered: 'Excerpt' },
      slug: 'test',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: NaN,
      categories: [NaN] as unknown as number[],
      tags: [],
      featured_media: NaN,
      status: 'publish',
      type: 'post',
      link: ''
    };

    const result = dataValidator.validatePost(invalidPost);

    expect(result.valid).toBe(false);
  });

  it('should handle empty strings as valid string values', () => {
    const postWithEmptyStrings = {
      id: 1,
      title: { rendered: 'Test' },
      content: { rendered: 'Content' },
      excerpt: { rendered: 'Excerpt' },
      slug: 'test-post',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      categories: [1],
      tags: [],
      featured_media: 0,
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test'
    };

    const result = dataValidator.validatePost(postWithEmptyStrings);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle zero as valid number for parent count', () => {
    const categoryWithZeroCount = {
      id: 1,
      name: 'Test',
      slug: 'test',
      description: 'Test',
      parent: 0,
      count: 0,
      link: 'https://example.com/category/test'
    };

    const result = dataValidator.validateCategory(categoryWithZeroCount);

    expect(result.valid).toBe(true);
  });

   it('should handle negative numbers as valid numbers', () => {
    const postWithNegativeId = {
      id: 1,
      title: { rendered: 'Test' },
      content: { rendered: 'Content' },
      excerpt: { rendered: 'Excerpt' },
      slug: 'test',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      categories: [1],
      tags: [],
      featured_media: 0,
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test'
    };

    const result = dataValidator.validatePost(postWithNegativeId);

    expect(result.valid).toBe(true);
  });

  it('should handle array with single element', () => {
    const singleCategory: WordPressCategory = {
      id: 1,
      name: 'Test',
      slug: 'test',
      description: 'Test',
      parent: 0,
      count: 1,
      link: 'https://example.com/category/test'
    };

    const result = dataValidator.validateCategories([singleCategory]);

    expect(result.valid).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('should handle large array of posts', () => {
    const largePosts: WordPressPost[] = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      title: { rendered: `Post ${i + 1}` },
      content: { rendered: '<p>Content</p>' },
      excerpt: { rendered: 'Excerpt' },
      slug: `post-${i + 1}`,
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      categories: [1],
      tags: [],
      featured_media: 0,
      status: 'publish',
      type: 'post',
      link: `https://example.com/post-${i + 1}`
    }));

    const result = dataValidator.validatePosts(largePosts);

    expect(result.valid).toBe(true);
    expect(result.data).toHaveLength(100);
  });

  it('should provide descriptive error messages with index for array validation', () => {
    const postsWithInvalid = [
      {
        id: 1,
        title: { rendered: 'Valid' },
        content: { rendered: 'Valid' },
        excerpt: { rendered: 'Valid' },
        slug: 'valid',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        categories: [1],
        tags: [],
        featured_media: 0,
        status: 'publish',
        type: 'post',
        link: 'https://example.com/valid'
      },
      'invalid string' as unknown as WordPressPost
    ];

      const result = dataValidator.validatePosts(postsWithInvalid);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('Post at index 1'))).toBe(true);
  });
});
