import { standardizedAPI } from '@/lib/api/standardized';
import { wordpressAPI } from '@/lib/wordpress';
import { isApiResultSuccessful } from '@/lib/api/response';

jest.mock('@/lib/wordpress');
const mockedWordpressAPI = wordpressAPI as jest.Mocked<typeof wordpressAPI>;

describe('Standardized API - Edge Cases and Critical Paths', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPosts with Category and Tag Filtering', () => {
    test('filters posts by category ID', async () => {
      const mockPosts = [
        { id: 1, title: { rendered: 'Tech Post 1' }, categories: [5] },
        { id: 2, title: { rendered: 'Tech Post 2' }, categories: [5] }
      ] as any[];

      mockedWordpressAPI.getPostsWithHeaders?.mockResolvedValue({
        data: mockPosts,
        total: mockPosts.length,
        totalPages: 1,
      });

      const result = await standardizedAPI.getAllPosts({ category: 5 });

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(mockedWordpressAPI.getPostsWithHeaders).toHaveBeenCalledWith({ category: 5 });
      expect(result.data).toEqual(mockPosts);
    });

    test('filters posts by tag ID', async () => {
      const mockPosts = [
        { id: 1, title: { rendered: 'React Post' }, tags: [10] },
        { id: 2, title: { rendered: 'Another React Post' }, tags: [10] }
      ] as any[];

      mockedWordpressAPI.getPostsWithHeaders?.mockResolvedValue({
        data: mockPosts,
        total: mockPosts.length,
        totalPages: 1,
      });

      const result = await standardizedAPI.getAllPosts({ tag: 10 });

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(mockedWordpressAPI.getPostsWithHeaders).toHaveBeenCalledWith({ tag: 10 });
      expect(result.data).toEqual(mockPosts);
    });

    test('filters posts by both category and tag', async () => {
      const mockPosts = [
        { id: 1, title: { rendered: 'React in Tech' }, categories: [5], tags: [10] }
      ] as any[];

      mockedWordpressAPI.getPostsWithHeaders?.mockResolvedValue({
        data: mockPosts,
        total: mockPosts.length,
        totalPages: 1,
      });

      const result = await standardizedAPI.getAllPosts({ category: 5, tag: 10 });

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(mockedWordpressAPI.getPostsWithHeaders).toHaveBeenCalledWith({ category: 5, tag: 10 });
      expect(result.data).toEqual(mockPosts);
    });

    test('handles filtering errors gracefully', async () => {
      mockedWordpressAPI.getPostsWithHeaders?.mockRejectedValue(new Error('Filtering failed'));

      const result = await standardizedAPI.getAllPosts({ category: 999 });

      expect(isApiResultSuccessful(result)).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).not.toBeNull();
    });
  });

  describe('searchPosts Edge Cases', () => {
    test('handles empty search results', async () => {
      mockedWordpressAPI.search.mockResolvedValue([]);

      const result = await standardizedAPI.searchPosts('nonexistent-term');

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        page: 1,
        perPage: 0,
        total: 0,
        totalPages: 1
      });
    });

    test('handles empty search query', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Post 1' } }] as any[];
      mockedWordpressAPI.search.mockResolvedValue(mockPosts);

      const result = await standardizedAPI.searchPosts('');

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(wordpressAPI.search).toHaveBeenCalledWith('');
    });

    test('handles special characters in search query', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Post with émojis 🎉' } }] as any[];
      mockedWordpressAPI.search.mockResolvedValue(mockPosts);

      const result = await standardizedAPI.searchPosts('test & special@chars#');

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(wordpressAPI.search).toHaveBeenCalledWith('test & special@chars#');
    });

    test('handles search API error', async () => {
      mockedWordpressAPI.search.mockRejectedValue(new Error('Search service unavailable'));

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

  describe('getAllPosts Pagination Edge Cases', () => {
    test('handles zero page number (defaults to 1)', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Post 1' } }] as any[];

      mockedWordpressAPI.getPostsWithHeaders?.mockResolvedValue({
        data: mockPosts,
        total: mockPosts.length,
        totalPages: 1,
      });

      const result = await standardizedAPI.getAllPosts({ page: 0, per_page: 10 });

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(result.pagination.page).toBe(1);
    });

    test('handles large page numbers', async () => {
      const mockPosts = [] as any[];

      mockedWordpressAPI.getPostsWithHeaders?.mockResolvedValue({
        data: mockPosts,
        total: 0,
        totalPages: 0,
      });

      const result = await standardizedAPI.getAllPosts({ page: 9999, per_page: 10 });

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(result.pagination.page).toBe(9999);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    test('handles custom per_page values', async () => {
      const mockPosts = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        title: { rendered: `Post ${i + 1}` }
      })) as any[];

      mockedWordpressAPI.getPostsWithHeaders?.mockResolvedValue({
        data: mockPosts,
        total: 25,
        totalPages: 1,
      });

      const result = await standardizedAPI.getAllPosts({ per_page: 25 });

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(result.pagination.perPage).toBe(25);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(1);
    });

    test('calculates correct totalPages for multiple pages', async () => {
      const mockPosts = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: { rendered: `Post ${i + 1}` }
      })) as any[];

      mockedWordpressAPI.getPostsWithHeaders?.mockResolvedValue({
        data: mockPosts,
        total: 100,
        totalPages: 10,
      });

      const result = await standardizedAPI.getAllPosts({ per_page: 10 });

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.totalPages).toBe(10);
    });

    test('handles single post correctly', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Single Post' } }] as any[];

      mockedWordpressAPI.getPostsWithHeaders?.mockResolvedValue({
        data: mockPosts,
        total: 1,
        totalPages: 1,
      });

      const result = await standardizedAPI.getAllPosts();

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    test('handles pagination with category filter', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Category Post' } }] as any[];

      mockedWordpressAPI.getPostsWithHeaders?.mockResolvedValue({
        data: mockPosts,
        total: mockPosts.length,
        totalPages: 1,
      });

      const result = await standardizedAPI.getAllPosts({ page: 2, per_page: 10, category: 5 });

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(mockedWordpressAPI.getPostsWithHeaders).toHaveBeenCalledWith({ page: 2, per_page: 10, category: 5 });
      expect(result.pagination.page).toBe(2);
    });

    test('handles pagination with tag filter', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Tag Post' } }] as any[];

      mockedWordpressAPI.getPostsWithHeaders?.mockResolvedValue({
        data: mockPosts,
        total: mockPosts.length,
        totalPages: 1,
      });

      const result = await standardizedAPI.getAllPosts({ page: 3, per_page: 20, tag: 15 });

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(mockedWordpressAPI.getPostsWithHeaders).toHaveBeenCalledWith({ page: 3, per_page: 20, tag: 15 });
      expect(result.pagination.page).toBe(3);
    });
  });

  describe('getAllCategories and getAllTags Edge Cases', () => {
    test('handles empty categories list', async () => {
      mockedWordpressAPI.getCategories.mockResolvedValue([]);

      const result = await standardizedAPI.getAllCategories();

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        page: 1,
        perPage: 0,
        total: 0,
        totalPages: 1
      });
    });

    test('handles empty tags list', async () => {
      mockedWordpressAPI.getTags.mockResolvedValue([]);

      const result = await standardizedAPI.getAllTags();

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        page: 1,
        perPage: 0,
        total: 0,
        totalPages: 1
      });
    });

    test('handles large number of categories', async () => {
      const mockCategories = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Category ${i + 1}`,
        slug: `category-${i + 1}`,
        description: `Description ${i + 1}`,
        parent: 0,
        count: i + 1,
        link: `https://example.com/category-${i + 1}`
      })) as any[];

      mockedWordpressAPI.getCategories.mockResolvedValue(mockCategories);

      const result = await standardizedAPI.getAllCategories();

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(result.data).toHaveLength(100);
      expect(result.pagination.total).toBe(100);
    });

    test('handles large number of tags', async () => {
      const mockTags = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Tag ${i + 1}`,
        slug: `tag-${i + 1}`,
        description: `Description ${i + 1}`,
        count: i + 1,
        link: `https://example.com/tag-${i + 1}`
      })) as any[];

      mockedWordpressAPI.getTags.mockResolvedValue(mockTags);

      const result = await standardizedAPI.getAllTags();

      expect(isApiResultSuccessful(result)).toBe(true);
      expect(result.data).toHaveLength(50);
      expect(result.pagination.total).toBe(50);
    });
  });

  describe('getMediaById Edge Cases', () => {
    test('handles 404 for non-existent media', async () => {
      const error = new Error('Media not found');
      (error as any).response = { status: 404 };
      mockedWordpressAPI.getMedia.mockRejectedValue(error);

      const result = await standardizedAPI.getMediaById(99999);

      expect(isApiResultSuccessful(result)).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.statusCode).toBe(404);
    });

    test('handles media with zero ID', async () => {
      const error = new Error('Invalid media ID');
      mockedWordpressAPI.getMedia.mockRejectedValue(error);

      const result = await standardizedAPI.getMediaById(0);

      expect(isApiResultSuccessful(result)).toBe(false);
      expect(result.error).not.toBeNull();
    });
  });

  describe('getAuthorById Edge Cases', () => {
    test('handles 404 for non-existent author', async () => {
      const error = new Error('Author not found');
      (error as any).response = { status: 404 };
      mockedWordpressAPI.getAuthor.mockRejectedValue(error);

      const result = await standardizedAPI.getAuthorById(99999);

      expect(isApiResultSuccessful(result)).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.statusCode).toBe(404);
    });

    test('handles author with zero ID', async () => {
      const error = new Error('Invalid author ID');
      mockedWordpressAPI.getAuthor.mockRejectedValue(error);

      const result = await standardizedAPI.getAuthorById(0);

      expect(isApiResultSuccessful(result)).toBe(false);
      expect(result.error).not.toBeNull();
    });
  });
});
