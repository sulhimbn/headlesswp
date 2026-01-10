import { dataValidator, unwrapValidationResult, unwrapValidationResultSafe, isValidationResultValid } from '@/lib/validation/dataValidator';
import {
  validateEnum,
  validatePattern,
  validateLength,
  validateMin,
  validatePositiveInteger,
  validateNonEmptyString,
  validateNonEmptyArray,
  validateIso8601Date,
  validateUrl,
  validateNonNegativeInteger,
} from '@/lib/validation/validationUtils';
import { POST_STATUS_VALUES, POST_TYPE_VALUES, MEDIA_TYPE_VALUES } from '@/lib/validation/validationRules';

describe('ValidationUtils - Enum Validation', () => {
  it('should accept valid enum values', () => {
    const result = validateEnum('publish', POST_STATUS_VALUES, 'Post.status');
    expect(result).toBeNull();
  });

  it('should reject invalid enum values', () => {
    const result = validateEnum('invalid-status', POST_STATUS_VALUES, 'Post.status');
    expect(result).not.toBeNull();
    expect(result?.field).toBe('Post.status');
    expect(result?.rule).toBe('enum');
    expect(result?.message).toContain('must be one of');
  });

  it('should include all allowed values in error message', () => {
    const result = validateEnum('invalid', POST_STATUS_VALUES, 'Test.field');
    expect(result?.message).toContain('publish, draft, private, future, pending');
  });
});

describe('ValidationUtils - Pattern Validation', () => {
  it('should accept valid slug pattern', () => {
    const result = validatePattern('my-slug-123', /^[a-z0-9-]+$/, 'Post.slug');
    expect(result).toBeNull();
  });

  it('should reject uppercase letters in slug', () => {
    const result = validatePattern('InvalidSlug', /^[a-z0-9-]+$/, 'Post.slug');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('pattern');
  });

  it('should reject special characters in slug', () => {
    const result = validatePattern('slug@invalid', /^[a-z0-9-]+$/, 'Post.slug');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('pattern');
  });

  it('should reject spaces in slug', () => {
    const result = validatePattern('slug with spaces', /^[a-z0-9-]+$/, 'Post.slug');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('pattern');
  });
});

describe('ValidationUtils - Length Validation', () => {
  it('should accept strings within length bounds', () => {
    const result = validateLength('valid-slug', 1, 200, 'Post.slug');
    expect(result).toBeNull();
  });

  it('should reject strings shorter than minimum', () => {
    const result = validateLength('', 1, 200, 'Post.slug');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('length');
    expect(result?.message).toContain('between 1 and 200');
  });

  it('should reject strings longer than maximum', () => {
    const longString = 'a'.repeat(201);
    const result = validateLength(longString, 1, 200, 'Post.slug');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('length');
  });

  it('should reject strings at exact minimum when min is 1 and string is empty', () => {
    const result = validateLength('', 1, 200, 'Post.slug');
    expect(result).not.toBeNull();
  });

  it('should accept strings at exact minimum length', () => {
    const result = validateLength('a', 1, 200, 'Post.slug');
    expect(result).toBeNull();
  });

  it('should accept strings at exact maximum length', () => {
    const exactMaxString = 'a'.repeat(200);
    const result = validateLength(exactMaxString, 1, 200, 'Post.slug');
    expect(result).toBeNull();
  });
});

describe('ValidationUtils - Min Validation', () => {
  it('should accept values at or above minimum', () => {
    const result = validateMin(0, 0, 'Category.parent');
    expect(result).toBeNull();
  });

  it('should accept values above minimum', () => {
    const result = validateMin(5, 0, 'Category.parent');
    expect(result).toBeNull();
  });

  it('should reject values below minimum', () => {
    const result = validateMin(-1, 0, 'Category.parent');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('min');
    expect(result?.message).toContain('at least 0');
  });
});

describe('ValidationUtils - Positive Integer Validation', () => {
  it('should accept positive integers', () => {
    const result = validatePositiveInteger(1, 'Post.id');
    expect(result).toBeNull();
  });

  it('should accept large positive integers', () => {
    const result = validatePositiveInteger(999999, 'Post.id');
    expect(result).toBeNull();
  });

  it('should reject zero', () => {
    const result = validatePositiveInteger(0, 'Post.id');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('positiveInteger');
  });

  it('should reject negative integers', () => {
    const result = validatePositiveInteger(-1, 'Post.id');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('positiveInteger');
  });

  it('should reject floating point numbers', () => {
    const result = validatePositiveInteger(1.5 as number, 'Post.id');
    expect(result).not.toBeNull();
  });

  it('should reject NaN', () => {
    const result = validatePositiveInteger(NaN, 'Post.id');
    expect(result).not.toBeNull();
  });
});

describe('ValidationUtils - Non-Negative Integer Validation', () => {
  it('should accept zero', () => {
    const result = validateNonNegativeInteger(0, 'Category.count');
    expect(result).toBeNull();
  });

  it('should accept positive integers', () => {
    const result = validateNonNegativeInteger(10, 'Category.count');
    expect(result).toBeNull();
  });

  it('should reject negative integers', () => {
    const result = validateNonNegativeInteger(-1, 'Category.count');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('nonNegative');
  });

  it('should reject floating point numbers', () => {
    const result = validateNonNegativeInteger(1.5 as number, 'Category.count');
    expect(result).not.toBeNull();
  });
});

describe('ValidationUtils - Non-Empty String Validation', () => {
  it('should accept non-empty strings', () => {
    const result = validateNonEmptyString('valid', 'Post.title.rendered');
    expect(result).toBeNull();
  });

  it('should reject empty strings', () => {
    const result = validateNonEmptyString('', 'Post.title.rendered');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('nonEmpty');
    expect(result?.message).toContain('must not be empty');
  });

  it('should reject whitespace-only strings', () => {
    const result = validateNonEmptyString('   ', 'Post.title.rendered');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('nonEmpty');
  });
});

describe('ValidationUtils - Non-Empty Array Validation', () => {
  it('should accept arrays with elements', () => {
    const result = validateNonEmptyArray([1, 2, 3], 'Post.categories');
    expect(result).toBeNull();
  });

  it('should reject empty arrays', () => {
    const result = validateNonEmptyArray([], 'Post.categories');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('nonEmpty');
    expect(result?.message).toContain('must not be empty');
  });
});

describe('ValidationUtils - ISO 8601 Date Validation', () => {
  it('should accept valid ISO 8601 dates', () => {
    const result = validateIso8601Date('2024-01-01T00:00:00', 'Post.date');
    expect(result).toBeNull();
  });

  it('should accept ISO 8601 dates with timezone', () => {
    const result = validateIso8601Date('2024-01-01T00:00:00Z', 'Post.date');
    expect(result).toBeNull();
  });

  it('should reject invalid date format', () => {
    const result = validateIso8601Date('2024/01/01', 'Post.date');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('format');
    expect(result?.message).toContain('ISO 8601');
  });

  it('should reject unparsable dates', () => {
    const result = validateIso8601Date('not-a-date', 'Post.date');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('format');
  });

  it('should reject dates with time component', () => {
    const result = validateIso8601Date('2024-01-01', 'Post.date');
    expect(result).not.toBeNull();
  });
});

describe('ValidationUtils - URL Validation', () => {
  it('should accept valid HTTP URLs', () => {
    const result = validateUrl('http://example.com/post', 'Post.link');
    expect(result).toBeNull();
  });

  it('should accept valid HTTPS URLs', () => {
    const result = validateUrl('https://example.com/post', 'Post.link');
    expect(result).toBeNull();
  });

  it('should reject FTP URLs', () => {
    const result = validateUrl('ftp://example.com/file', 'Post.link');
    expect(result).not.toBeNull();
    expect(result?.message).toContain('http or https');
  });

  it('should reject malformed URLs', () => {
    const result = validateUrl('not-a-url', 'Post.link');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('format');
  });

  it('should reject URLs without protocol', () => {
    const result = validateUrl('example.com/post', 'Post.link');
    expect(result).not.toBeNull();
  });
});

describe('DataValidator Enhanced - Business Rule Validation', () => {
  it('should accept valid post status values', () => {
    const validPost = {
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

    POST_STATUS_VALUES.forEach(status => {
      const post = { ...validPost, status };
      const result = dataValidator.validatePost(post);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject invalid post status values', () => {
    const invalidPost = {
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
      status: 'invalid-status',
      type: 'post',
      link: 'https://example.com/test'
    };

    const result = dataValidator.validatePost(invalidPost);
    expect(result.valid).toBe(false);
    const statusError = result.errors.find(e => e.field === 'Post.status' && e.rule === 'enum');
    expect(statusError).toBeDefined();
    expect(statusError?.message).toContain('must be one of');
  });

  it('should accept valid post type values', () => {
    const validPost = {
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

    POST_TYPE_VALUES.forEach(type => {
      const post = { ...validPost, type };
      const result = dataValidator.validatePost(post);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject invalid post type values', () => {
    const invalidPost = {
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
      type: 'invalid-type',
      link: 'https://example.com/test'
    };

    const result = dataValidator.validatePost(invalidPost);
    expect(result.valid).toBe(false);
    const typeError = result.errors.find(e => e.field === 'Post.type' && e.rule === 'enum');
    expect(typeError).toBeDefined();
  });

  it('should accept valid media type values', () => {
    const validMedia = {
      id: 1,
      source_url: 'https://example.com/image.jpg',
      title: { rendered: 'Test' },
      alt_text: 'Alt text',
      media_type: 'image',
      mime_type: 'image/jpeg'
    };

    MEDIA_TYPE_VALUES.forEach(type => {
      const media = { ...validMedia, media_type: type };
      const result = dataValidator.validateMedia(media);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject invalid media type values', () => {
    const invalidMedia = {
      id: 1,
      source_url: 'https://example.com/image.jpg',
      title: { rendered: 'Test' },
      alt_text: 'Alt text',
      media_type: 'invalid-type',
      mime_type: 'image/jpeg'
    };

    const result = dataValidator.validateMedia(invalidMedia);
    expect(result.valid).toBe(false);
    const typeError = result.errors.find(e => e.field === 'Media.media_type' && e.rule === 'enum');
    expect(typeError).toBeDefined();
  });
});

describe('DataValidator Enhanced - Range Validation', () => {
  it('should reject zero or negative post IDs', () => {
    [0, -1, -100].forEach(id => {
      const post = {
        id,
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

      const result = dataValidator.validatePost(post);
      expect(result.valid).toBe(false);
      const idError = result.errors.find(e => e.field === 'Post.id' && e.rule === 'positiveInteger');
      expect(idError).toBeDefined();
    });
  });

  it('should accept positive post IDs', () => {
    [1, 10, 999999].forEach(id => {
      const post = {
        id,
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

      const result = dataValidator.validatePost(post);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject negative category count', () => {
    const category = {
      id: 1,
      name: 'Test',
      slug: 'test',
      description: 'Test category',
      parent: 0,
      count: -1,
      link: 'https://example.com/category/test'
    };

    const result = dataValidator.validateCategory(category);
    expect(result.valid).toBe(false);
    const countError = result.errors.find(e => e.field === 'Category.count' && e.rule === 'nonNegative');
    expect(countError).toBeDefined();
  });

  it('should accept zero or positive category count', () => {
    [0, 1, 100].forEach(count => {
      const category = {
        id: 1,
        name: 'Test',
        slug: 'test',
        description: 'Test category',
        parent: 0,
        count,
        link: 'https://example.com/category/test'
      };

      const result = dataValidator.validateCategory(category);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject negative category parent', () => {
    const category = {
      id: 1,
      name: 'Test',
      slug: 'test',
      description: 'Test category',
      parent: -1,
      count: 10,
      link: 'https://example.com/category/test'
    };

    const result = dataValidator.validateCategory(category);
    expect(result.valid).toBe(false);
    const parentError = result.errors.find(e => e.field === 'Category.parent' && e.rule === 'min');
    expect(parentError).toBeDefined();
  });

  it('should accept zero or positive category parent', () => {
    [0, 1, 100].forEach(parent => {
      const category = {
        id: 1,
        name: 'Test',
        slug: 'test',
        description: 'Test category',
        parent,
        count: 10,
        link: 'https://example.com/category/test'
      };

      const result = dataValidator.validateCategory(category);
      expect(result.valid).toBe(true);
    });
  });
});

describe('DataValidator Enhanced - Non-Empty Validation', () => {
  it('should reject empty post title', () => {
    const post = {
      id: 1,
      title: { rendered: '' },
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

    const result = dataValidator.validatePost(post);
    expect(result.valid).toBe(false);
    const titleError = result.errors.find(e => e.field === 'Post.title.rendered' && e.rule === 'nonEmpty');
    expect(titleError).toBeDefined();
  });

  it('should reject whitespace-only post title', () => {
    const post = {
      id: 1,
      title: { rendered: '   ' },
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

    const result = dataValidator.validatePost(post);
    expect(result.valid).toBe(false);
    const titleError = result.errors.find(e => e.field === 'Post.title.rendered' && e.rule === 'nonEmpty');
    expect(titleError).toBeDefined();
  });

  it('should reject empty post slug', () => {
    const post = {
      id: 1,
      title: { rendered: 'Test' },
      content: { rendered: 'Content' },
      excerpt: { rendered: 'Excerpt' },
      slug: '',
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

    const result = dataValidator.validatePost(post);
    expect(result.valid).toBe(false);
    const slugErrors = result.errors.filter(e => e.field === 'Post.slug');
    const nonEmptyError = slugErrors.find(e => e.rule === 'nonEmpty');
    expect(nonEmptyError).toBeDefined();
  });

  it('should reject empty post categories array', () => {
    const post = {
      id: 1,
      title: { rendered: 'Test' },
      content: { rendered: 'Content' },
      excerpt: { rendered: 'Excerpt' },
      slug: 'test-post',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      categories: [],
      tags: [],
      featured_media: 0,
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test'
    };

    const result = dataValidator.validatePost(post);
    expect(result.valid).toBe(false);
    const categoriesError = result.errors.find(e => e.field === 'Post.categories' && e.rule === 'nonEmpty');
    expect(categoriesError).toBeDefined();
    expect(categoriesError?.message).toContain('at least one category');
  });

  it('should accept non-empty post categories array', () => {
    const post = {
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

    const result = dataValidator.validatePost(post);
    expect(result.valid).toBe(true);
  });

  it('should reject empty category name', () => {
    const category = {
      id: 1,
      name: '',
      slug: 'test',
      description: 'Test category',
      parent: 0,
      count: 10,
      link: 'https://example.com/category/test'
    };

    const result = dataValidator.validateCategory(category);
    expect(result.valid).toBe(false);
    const nameError = result.errors.find(e => e.field === 'Category.name' && e.rule === 'nonEmpty');
    expect(nameError).toBeDefined();
  });

  it('should reject empty tag name', () => {
    const tag = {
      id: 1,
      name: '',
      slug: 'test',
      description: 'Test tag',
      count: 10,
      link: 'https://example.com/tag/test'
    };

    const result = dataValidator.validateTag(tag);
    expect(result.valid).toBe(false);
    const nameError = result.errors.find(e => e.field === 'Tag.name' && e.rule === 'nonEmpty');
    expect(nameError).toBeDefined();
  });
});

describe('DataValidator Enhanced - Format Validation', () => {
  it('should reject invalid date format', () => {
    const post = {
      id: 1,
      title: { rendered: 'Test' },
      content: { rendered: 'Content' },
      excerpt: { rendered: 'Excerpt' },
      slug: 'test-post',
      date: '2024/01/01',
      modified: '2024-01-01T00:00:00',
      author: 1,
      categories: [1],
      tags: [],
      featured_media: 0,
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test'
    };

    const result = dataValidator.validatePost(post);
    expect(result.valid).toBe(false);
    const dateError = result.errors.find(e => e.field === 'Post.date' && e.rule === 'format');
    expect(dateError).toBeDefined();
  });

  it('should reject invalid URL format', () => {
    const post = {
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
      link: 'not-a-url'
    };

    const result = dataValidator.validatePost(post);
    expect(result.valid).toBe(false);
    const linkError = result.errors.find(e => e.field === 'Post.link' && e.rule === 'format');
    expect(linkError).toBeDefined();
  });

  it('should reject FTP URLs', () => {
    const post = {
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
      link: 'ftp://example.com/test'
    };

    const result = dataValidator.validatePost(post);
    expect(result.valid).toBe(false);
    const linkError = result.errors.find(e => e.field === 'Post.link' && e.rule === 'format');
    expect(linkError).toBeDefined();
    expect(linkError?.message).toContain('http or https');
  });
});

describe('DataValidator Enhanced - Slug Pattern Validation', () => {
  it('should reject uppercase letters in slug', () => {
    const post = {
      id: 1,
      title: { rendered: 'Test' },
      content: { rendered: 'Content' },
      excerpt: { rendered: 'Excerpt' },
      slug: 'InvalidSlug',
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

    const result = dataValidator.validatePost(post);
    expect(result.valid).toBe(false);
    const slugPatternError = result.errors.find(e => e.field === 'Post.slug' && e.rule === 'pattern');
    expect(slugPatternError).toBeDefined();
  });

  it('should reject special characters in slug', () => {
    const post = {
      id: 1,
      title: { rendered: 'Test' },
      content: { rendered: 'Content' },
      excerpt: { rendered: 'Excerpt' },
      slug: 'invalid@slug',
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

    const result = dataValidator.validatePost(post);
    expect(result.valid).toBe(false);
    const slugPatternError = result.errors.find(e => e.field === 'Post.slug' && e.rule === 'pattern');
    expect(slugPatternError).toBeDefined();
  });

  it('should reject spaces in slug', () => {
    const post = {
      id: 1,
      title: { rendered: 'Test' },
      content: { rendered: 'Content' },
      excerpt: { rendered: 'Excerpt' },
      slug: 'invalid slug',
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

    const result = dataValidator.validatePost(post);
    expect(result.valid).toBe(false);
    const slugPatternError = result.errors.find(e => e.field === 'Post.slug' && e.rule === 'pattern');
    expect(slugPatternError).toBeDefined();
  });

  it('should accept valid lowercase alphanumeric slugs with hyphens', () => {
    const post = {
      id: 1,
      title: { rendered: 'Test' },
      content: { rendered: 'Content' },
      excerpt: { rendered: 'Excerpt' },
      slug: 'my-valid-slug-123',
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

    const result = dataValidator.validatePost(post);
    expect(result.valid).toBe(true);
  });
});

describe('DataValidator Enhanced - Detailed Error Information', () => {
  it('should provide field information in validation errors', () => {
    const invalidPost = {
      id: 0,
      title: { rendered: '' },
      content: { rendered: 'Content' },
      excerpt: { rendered: 'Excerpt' },
      slug: 'INVALID',
      date: 'invalid-date',
      modified: '2024-01-01T00:00:00',
      author: 1,
      categories: [],
      tags: [],
      featured_media: 0,
      status: 'invalid-status',
      type: 'invalid-type',
      link: 'not-a-url'
    };

    const result = dataValidator.validatePost(invalidPost);
    expect(result.valid).toBe(false);

    const fields = result.errors.map(e => e.field);
    expect(fields).toContain('Post.id');
    expect(fields).toContain('Post.title.rendered');
    expect(fields).toContain('Post.slug');
    expect(fields).toContain('Post.date');
    expect(fields).toContain('Post.categories');
    expect(fields).toContain('Post.status');
    expect(fields).toContain('Post.type');
    expect(fields).toContain('Post.link');
  });

  it('should provide rule information in validation errors', () => {
    const invalidPost = {
      id: 0,
      title: { rendered: '' },
      content: { rendered: 'Content' },
      excerpt: { rendered: 'Excerpt' },
      slug: 'INVALID',
      date: 'invalid-date',
      modified: '2024-01-01T00:00:00',
      author: 1,
      categories: [],
      tags: [],
      featured_media: 0,
      status: 'invalid-status',
      type: 'invalid-type',
      link: 'not-a-url'
    };

    const result = dataValidator.validatePost(invalidPost);
    expect(result.valid).toBe(false);

    const rules = result.errors.map(e => e.rule);
    expect(rules).toContain('positiveInteger');
    expect(rules).toContain('nonEmpty');
    expect(rules).toContain('pattern');
    expect(rules).toContain('format');
    expect(rules).toContain('enum');
  });

  it('should provide descriptive error messages', () => {
    const invalidPost = {
      id: 0,
      title: { rendered: 'Test' },
      content: { rendered: 'Content' },
      excerpt: { rendered: 'Excerpt' },
      slug: 'test',
      date: 'invalid-date',
      modified: '2024-01-01T00:00:00',
      author: 1,
      categories: [1],
      tags: [],
      featured_media: 0,
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test'
    };

    const result = dataValidator.validatePost(invalidPost);
    expect(result.valid).toBe(false);

    const dateError = result.errors.find(e => e.field === 'Post.date');
    expect(dateError?.message).toContain('ISO 8601');
  });
});

describe('DataValidator Enhanced - Type Guard Functions', () => {
  it('isValidationResultValid should narrow type correctly', () => {
    const validResult = dataValidator.validatePost({
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
    });

    const invalidResult = dataValidator.validatePost({});

    if (isValidationResultValid(validResult)) {
      expect(validResult.data).toBeDefined();
    }

    if (!isValidationResultValid(invalidResult)) {
      expect(invalidResult.data).toBeUndefined();
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    }
  });

  it('unwrapValidationResult should throw on invalid result', () => {
    const invalidResult = dataValidator.validatePost({});

    expect(() => unwrapValidationResult(invalidResult)).toThrow();
  });

  it('unwrapValidationResult should return data on valid result', () => {
    const validResult = dataValidator.validatePost({
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
    });

    const data = unwrapValidationResult(validResult);
    expect(data).toBeDefined();
    expect(data.id).toBe(1);
  });

  it('unwrapValidationResultSafe should return fallback on invalid result', () => {
    const invalidResult = dataValidator.validatePost({});
    const fallback = { id: -1, title: { rendered: 'Fallback' }, content: { rendered: '' }, excerpt: { rendered: '' }, slug: '', date: '', modified: '', author: -1, categories: [], tags: [], featured_media: 0, status: 'publish', type: 'post', link: '' };

    const data = unwrapValidationResultSafe(invalidResult, fallback);
    expect(data).toEqual(fallback);
  });

  it('unwrapValidationResultSafe should return data on valid result', () => {
    const validResult = dataValidator.validatePost({
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
    });

    const data = unwrapValidationResultSafe(validResult, null);
    expect(data).not.toBeNull();
    expect(data!.id).toBe(1);
  });
});
