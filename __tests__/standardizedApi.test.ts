import { standardizedAPI } from '@/lib/api/standardized';
import { wordpressAPI } from '@/lib/wordpress';
import { ApiErrorType } from '@/lib/api/errors';
import { isApiResultSuccessful } from '@/lib/api/response';

jest.mock('@/lib/wordpress');
const mockedWordpressAPI = wordpressAPI as jest.Mocked<typeof wordpressAPI>;

describe('Standardized API - getPostById', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns ApiResult with post data on success', async () => {
    const mockPost = {
      id: 123,
      title: { rendered: 'Test Post' },
      content: { rendered: '<p>Content</p>' },
      excerpt: { rendered: '<p>Excerpt</p>' },
      slug: 'test-post',
      date: '2026-01-07T10:00:00',
      modified: '2026-01-07T10:00:00',
      author: 1,
      featured_media: 456,
      categories: [5, 8],
      tags: [12, 15],
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test-post'
    };

    mockedWordpressAPI.getPostById.mockResolvedValue(mockPost);

    const result = await standardizedAPI.getPostById(123);

    expect(isApiResultSuccessful(result)).toBe(true);
    expect(result.data).toEqual(mockPost);
    expect(result.error).toBeNull();
    expect(result.metadata.endpoint).toBe('/wp/v2/posts/123');
    expect(result.metadata.timestamp).toBeDefined();
    expect(result.metadata.cacheHit).toBeUndefined();
  });

  test('returns ApiResult with error on failure', async () => {
    const error = new Error('Unknown error');
    mockedWordpressAPI.getPostById.mockRejectedValue(error);

    const result = await standardizedAPI.getPostById(123);

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.type).toBe(ApiErrorType.UNKNOWN_ERROR);
    expect(result.error?.message).toBe('Unknown error');
    expect(result.metadata.endpoint).toBe('/wp/v2/posts/123');
  });

  test('handles 404 not found error', async () => {
    const error = new Error('Request failed with status code 404');
    (error as any).response = { status: 404 };
    mockedWordpressAPI.getPostById.mockRejectedValue(error);

    const result = await standardizedAPI.getPostById(999);

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.error?.type).toBe(ApiErrorType.CLIENT_ERROR);
    expect(result.error?.statusCode).toBe(404);
  });
});

describe('Standardized API - getPostBySlug', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns ApiResult with post data on success', async () => {
    const mockPost = {
      id: 123,
      title: { rendered: 'Test Post' },
      content: { rendered: '<p>Content</p>' },
      excerpt: { rendered: '<p>Excerpt</p>' },
      slug: 'test-post',
      date: '2026-01-07T10:00:00',
      modified: '2026-01-07T10:00:00',
      author: 1,
      featured_media: 456,
      categories: [5, 8],
      tags: [12, 15],
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test-post'
    };

    mockedWordpressAPI.getPost.mockResolvedValue(mockPost);

    const result = await standardizedAPI.getPostBySlug('test-post');

    expect(isApiResultSuccessful(result)).toBe(true);
    expect(result.data).toEqual(mockPost);
    expect(result.error).toBeNull();
    expect(result.metadata.endpoint).toBe('/wp/v2/posts?slug=test-post');
  });

  test('returns ApiResult with error when post not found', async () => {
    mockedWordpressAPI.getPost.mockResolvedValue(null as any);

    const result = await standardizedAPI.getPostBySlug('non-existent');

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('Post not found: non-existent');
    expect(result.error?.type).toBeDefined();
  });

  test('returns ApiResult with error on API failure', async () => {
    const error = new Error('Unknown error');
    mockedWordpressAPI.getPost.mockRejectedValue(error);

    const result = await standardizedAPI.getPostBySlug('test-post');

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.error?.type).toBe(ApiErrorType.UNKNOWN_ERROR);
  });
});

describe('Standardized API - getAllPosts', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns ApiListResult with posts and pagination', async () => {
    const mockPosts = [
      { id: 1, title: { rendered: 'Post 1' } },
      { id: 2, title: { rendered: 'Post 2' } },
      { id: 3, title: { rendered: 'Post 3' } }
    ] as any[];

    mockedWordpressAPI.getPostsWithHeaders?.mockResolvedValue({
      data: mockPosts,
      total: 3,
      totalPages: 1,
    });

    const result = await standardizedAPI.getAllPosts();

    expect(isApiResultSuccessful(result)).toBe(true);
    expect(result.data).toEqual(mockPosts);
    expect(result.error).toBeNull();
    expect(result.metadata.endpoint).toBe('/wp/v2/posts');
    expect(result.pagination).toEqual({
      page: 1,
      perPage: 10,
      total: 3,
      totalPages: 1
    });
  });

  test('calculates pagination correctly with custom params', async () => {
    const mockPosts = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      title: { rendered: `Post ${i + 1}` }
    })) as any[];

    mockedWordpressAPI.getPostsWithHeaders?.mockResolvedValue({
      data: mockPosts,
      total: 25,
      totalPages: 3,
    });

    const result = await standardizedAPI.getAllPosts({ page: 2, per_page: 10 });

    expect(result.pagination).toEqual({
      page: 2,
      perPage: 10,
      total: 25,
      totalPages: 3
    });
  });

  test('returns ApiListResult with error on failure', async () => {
    const error = new Error('Network error');
    mockedWordpressAPI.getPostsWithHeaders?.mockRejectedValue(error);

    const result = await standardizedAPI.getAllPosts();

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.error).not.toBeNull();
    expect(result.pagination).toEqual({
      page: 1,
      perPage: 10,
      total: 0,
      totalPages: 0
    });
  });
});

describe('Standardized API - searchPosts', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns ApiListResult with search results', async () => {
    const mockPosts = [
      { id: 1, title: { rendered: 'Search Result 1' } },
      { id: 2, title: { rendered: 'Search Result 2' } }
    ] as any[];

    mockedWordpressAPI.search.mockResolvedValue(mockPosts);

    const result = await standardizedAPI.searchPosts('test query');

    expect(isApiResultSuccessful(result)).toBe(true);
    expect(result.data).toEqual(mockPosts);
    expect(result.metadata.endpoint).toBe('/wp/v2/search');
    expect(result.metadata.cacheHit).toBe(false);
    expect(result.pagination).toEqual({
      page: 1,
      perPage: 2,
      total: 2,
      totalPages: 1
    });
  });

  test('returns ApiListResult with error on failure', async () => {
    const error = new Error('Search failed');
    mockedWordpressAPI.search.mockRejectedValue(error);

    const result = await standardizedAPI.searchPosts('test');

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.error).not.toBeNull();
    expect(result.pagination).toEqual({
      page: 1,
      perPage: 0,
      total: 0,
      totalPages: 0
    });
  });
});

describe('Standardized API - getCategoryById', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns ApiResult with category data on success', async () => {
    const mockCategory = {
      id: 5,
      name: 'Politics',
      slug: 'politics',
      description: 'Political news',
      parent: 0,
      count: 150,
      link: 'https://example.com/category/politics'
    };

    mockedWordpressAPI.getCategoryById.mockResolvedValue(mockCategory);

    const result = await standardizedAPI.getCategoryById(5);

    expect(isApiResultSuccessful(result)).toBe(true);
    expect(result.data).toEqual(mockCategory);
    expect(result.metadata.endpoint).toBe('/wp/v2/categories/5');
  });

  test('returns ApiResult with error when category not found', async () => {
    mockedWordpressAPI.getCategoryById.mockResolvedValue(null as any);

    const result = await standardizedAPI.getCategoryById(999);

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.error?.message).toBe('Category not found: 999');
    expect(result.error?.type).toBeDefined();
  });

  test('returns ApiResult with error when getCategory throws exception', async () => {
    const networkError = new Error('Network error: Connection refused');
    mockedWordpressAPI.getCategoryById.mockRejectedValue(networkError);

    const result = await standardizedAPI.getCategoryById(5);

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.error?.message).toContain('Network error');
    expect(result.error?.type).toBeDefined();
    expect(result.metadata.endpoint).toBe('/wp/v2/categories/5');
  });
});

describe('Standardized API - getCategoryBySlug', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns ApiResult with category data on success', async () => {
    const mockCategory = {
      id: 5,
      name: 'Politics',
      slug: 'politics',
      description: 'Political news',
      parent: 0,
      count: 150,
      link: 'https://example.com/category/politics'
    };

    mockedWordpressAPI.getCategory.mockResolvedValue(mockCategory);

    const result = await standardizedAPI.getCategoryBySlug('politics');

    expect(isApiResultSuccessful(result)).toBe(true);
    expect(result.data).toEqual(mockCategory);
    expect(result.error).toBeNull();
    expect(result.metadata.endpoint).toBe('/wp/v2/categories?slug=politics');
  });

  test('returns ApiResult with error when category not found', async () => {
    mockedWordpressAPI.getCategory.mockResolvedValue(null as any);

    const result = await standardizedAPI.getCategoryBySlug('non-existent');

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('Category not found: non-existent');
    expect(result.error?.type).toBeDefined();
  });

  test('returns ApiResult with error on API failure', async () => {
    const error = new Error('Unknown error');
    mockedWordpressAPI.getCategory.mockRejectedValue(error);

    const result = await standardizedAPI.getCategoryBySlug('politics');

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.error?.type).toBe(ApiErrorType.UNKNOWN_ERROR);
  });
});

describe('Standardized API - getAllCategories', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns ApiListResult with categories and pagination', async () => {
    const mockCategories = [
      { id: 1, name: 'Category 1', slug: 'category-1', parent: 0, count: 10, link: 'https://example.com/category-1' },
      { id: 2, name: 'Category 2', slug: 'category-2', parent: 0, count: 20, link: 'https://example.com/category-2' },
      { id: 3, name: 'Category 3', slug: 'category-3', parent: 0, count: 30, link: 'https://example.com/category-3' }
    ] as any[];

    mockedWordpressAPI.getCategories.mockResolvedValue(mockCategories);

    const result = await standardizedAPI.getAllCategories();

    expect(isApiResultSuccessful(result)).toBe(true);
    expect(result.data).toEqual(mockCategories);
    expect(result.metadata.endpoint).toBe('/wp/v2/categories');
    expect(result.pagination).toEqual({
      page: 1,
      perPage: 3,
      total: 3,
      totalPages: 1
    });
  });

  test('returns ApiListResult with error on failure', async () => {
    const error = new Error('Failed to fetch categories');
    mockedWordpressAPI.getCategories.mockRejectedValue(error);

    const result = await standardizedAPI.getAllCategories();

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.error).not.toBeNull();
  });
});

describe('Standardized API - getTagById', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns ApiResult with tag data on success', async () => {
    const mockTag = {
      id: 12,
      name: 'Elections',
      slug: 'elections',
      description: 'Election news',
      count: 45,
      link: 'https://example.com/tag/elections'
    };

    mockedWordpressAPI.getTagById.mockResolvedValue(mockTag);

    const result = await standardizedAPI.getTagById(12);

    expect(isApiResultSuccessful(result)).toBe(true);
    expect(result.data).toEqual(mockTag);
    expect(result.metadata.endpoint).toBe('/wp/v2/tags/12');
  });

  test('returns ApiResult with error when tag not found', async () => {
    mockedWordpressAPI.getTagById.mockResolvedValue(null as any);

    const result = await standardizedAPI.getTagById(999);

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.error?.message).toBe('Tag not found: 999');
    expect(result.error?.type).toBeDefined();
  });

  test('returns ApiResult with error when getTag throws exception', async () => {
    const timeoutError = new Error('Request timeout after 30s');
    mockedWordpressAPI.getTagById.mockRejectedValue(timeoutError);

    const result = await standardizedAPI.getTagById(12);

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.error?.message).toContain('Request timeout');
    expect(result.error?.type).toBeDefined();
    expect(result.metadata.endpoint).toBe('/wp/v2/tags/12');
  });
});

describe('Standardized API - getTagBySlug', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns ApiResult with tag data on success', async () => {
    const mockTag = {
      id: 12,
      name: 'Elections',
      slug: 'elections',
      description: 'Election news',
      count: 45,
      link: 'https://example.com/tag/elections'
    };

    mockedWordpressAPI.getTag.mockResolvedValue(mockTag);

    const result = await standardizedAPI.getTagBySlug('elections');

    expect(isApiResultSuccessful(result)).toBe(true);
    expect(result.data).toEqual(mockTag);
    expect(result.error).toBeNull();
    expect(result.metadata.endpoint).toBe('/wp/v2/tags?slug=elections');
  });

  test('returns ApiResult with error when tag not found', async () => {
    mockedWordpressAPI.getTag.mockResolvedValue(null as any);

    const result = await standardizedAPI.getTagBySlug('non-existent');

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('Tag not found: non-existent');
    expect(result.error?.type).toBeDefined();
  });

  test('returns ApiResult with error on API failure', async () => {
    const error = new Error('Unknown error');
    mockedWordpressAPI.getTag.mockRejectedValue(error);

    const result = await standardizedAPI.getTagBySlug('elections');

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.error?.type).toBe(ApiErrorType.UNKNOWN_ERROR);
  });
});

describe('Standardized API - getAllTags', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns ApiListResult with tags and pagination', async () => {
    const mockTags = [
      { id: 1, name: 'Tag 1', slug: 'tag-1', count: 15, link: 'https://example.com/tag/tag-1' },
      { id: 2, name: 'Tag 2', slug: 'tag-2', count: 25, link: 'https://example.com/tag/tag-2' },
      { id: 3, name: 'Tag 3', slug: 'tag-3', count: 35, link: 'https://example.com/tag/tag-3' }
    ] as any[];

    mockedWordpressAPI.getTags.mockResolvedValue(mockTags);

    const result = await standardizedAPI.getAllTags();

    expect(isApiResultSuccessful(result)).toBe(true);
    expect(result.data).toEqual(mockTags);
    expect(result.metadata.endpoint).toBe('/wp/v2/tags');
    expect(result.pagination).toEqual({
      page: 1,
      perPage: 3,
      total: 3,
      totalPages: 1
    });
  });

  test('returns ApiListResult with error on failure', async () => {
    const error = new Error('Failed to fetch tags');
    mockedWordpressAPI.getTags.mockRejectedValue(error);

    const result = await standardizedAPI.getAllTags();

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.error).not.toBeNull();
  });
});

describe('Standardized API - getMediaById', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns ApiResult with media data on success', async () => {
    const mockMedia = {
      id: 456,
      date: '2026-01-07T10:00:00',
      slug: 'test-image',
      title: { rendered: 'Test Image' },
      media_type: 'image',
      mime_type: 'image/jpeg',
      source_url: 'https://example.com/image.jpg',
      alt_text: 'Alt text',
      caption: { rendered: '' },
      description: { rendered: '' }
    };

    mockedWordpressAPI.getMedia.mockResolvedValue(mockMedia);

    const result = await standardizedAPI.getMediaById(456);

    expect(isApiResultSuccessful(result)).toBe(true);
    expect(result.data).toEqual(mockMedia);
    expect(result.metadata.endpoint).toBe('/wp/v2/media/456');
  });

  test('returns ApiResult with error on failure', async () => {
    const error = new Error('Media not found');
    mockedWordpressAPI.getMedia.mockRejectedValue(error);

    const result = await standardizedAPI.getMediaById(999);

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.error?.message).toBe('Media not found');
    expect(result.error?.type).toBeDefined();
  });
});

describe('Standardized API - getAuthorById', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns ApiResult with author data on success', async () => {
    const mockAuthor = {
      id: 1,
      name: 'John Doe',
      slug: 'john-doe',
      description: 'Senior Editor',
      link: 'https://example.com/author/john-doe',
      avatar_urls: {
        '24': 'https://example.com/avatar-24.jpg',
        '48': 'https://example.com/avatar-48.jpg',
        '96': 'https://example.com/avatar-96.jpg'
      }
    };

    mockedWordpressAPI.getAuthor.mockResolvedValue(mockAuthor);

    const result = await standardizedAPI.getAuthorById(1);

    expect(isApiResultSuccessful(result)).toBe(true);
    expect(result.data).toEqual(mockAuthor);
    expect(result.metadata.endpoint).toBe('/wp/v2/users/1');
  });

  test('returns ApiResult with error on failure', async () => {
    const error = new Error('Author not found');
    mockedWordpressAPI.getAuthor.mockRejectedValue(error);

    const result = await standardizedAPI.getAuthorById(999);

    expect(isApiResultSuccessful(result)).toBe(false);
    expect(result.error?.message).toBe('Author not found');
    expect(result.error?.type).toBeDefined();
  });
});

describe('Standardized API - Integration with Error Types', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('handles NETWORK_ERROR correctly', async () => {
    const error = new Error('ECONNREFUSED');
    mockedWordpressAPI.getPostById.mockRejectedValue(error);

    const result = await standardizedAPI.getPostById(123);

    expect(result.error?.type).toBe(ApiErrorType.NETWORK_ERROR);
    expect(result.error?.retryable).toBe(true);
  });

  test('handles TIMEOUT_ERROR correctly', async () => {
    const error = new Error('Request timeout');
    mockedWordpressAPI.getPostById.mockRejectedValue(error);

    const result = await standardizedAPI.getPostById(123);

    expect(result.error?.type).toBe(ApiErrorType.TIMEOUT_ERROR);
    expect(result.error?.retryable).toBe(true);
  });

  test('handles RATE_LIMIT_ERROR correctly', async () => {
    const error = new Error('Rate limit exceeded');
    (error as any).response = { status: 429, headers: { 'retry-after': '60' } };
    mockedWordpressAPI.getPostById.mockRejectedValue(error);

    const result = await standardizedAPI.getPostById(123);

    expect(result.error?.type).toBe(ApiErrorType.RATE_LIMIT_ERROR);
    expect(result.error?.retryable).toBe(true);
  });

  test('handles SERVER_ERROR correctly', async () => {
    const error = new Error('Internal Server Error');
    (error as any).response = { status: 500 };
    mockedWordpressAPI.getPostById.mockRejectedValue(error);

    const result = await standardizedAPI.getPostById(123);

    expect(result.error?.type).toBe(ApiErrorType.SERVER_ERROR);
    expect(result.error?.retryable).toBe(true);
  });

  test('returns UNKNOWN_ERROR for unrecognized errors', async () => {
    const error = new Error('Unknown error');
    mockedWordpressAPI.getPostById.mockRejectedValue(error);

    const result = await standardizedAPI.getPostById(123);

    expect(result.error?.type).toBe(ApiErrorType.UNKNOWN_ERROR);
    expect(result.error?.retryable).toBe(false);
  });
});

describe('Standardized API - Metadata', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('includes timestamp in metadata', async () => {
    const mockPost = { id: 1, title: { rendered: 'Test' } } as any;
    mockedWordpressAPI.getPostById.mockResolvedValue(mockPost);

    const result = await standardizedAPI.getPostById(1);

    expect(result.metadata.timestamp).toBeDefined();
    expect(new Date(result.metadata.timestamp).toISOString()).toBe(result.metadata.timestamp);
  });

  test('includes endpoint in metadata', async () => {
    const mockPost = { id: 1, title: { rendered: 'Test' } } as any;
    mockedWordpressAPI.getPostById.mockResolvedValue(mockPost);

    const result = await standardizedAPI.getPostById(1);

    expect(result.metadata.endpoint).toBe('/wp/v2/posts/1');
  });

  test('includes cacheHit in metadata when specified', async () => {
    const mockPosts = [] as any[];
    mockedWordpressAPI.search.mockResolvedValue(mockPosts);

    const result = await standardizedAPI.searchPosts('test');

    expect(result.metadata.cacheHit).toBe(false);
  });
});
