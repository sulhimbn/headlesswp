import { apiClient } from '@/lib/api/client';
import {
  createCollectionMethod,
  createItemMethod,
  createIdMethod,
  createPostsMethod,
  createPostsWithHeadersMethod
} from '@/lib/api/wpMethodFactory';

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn()
  },
  getApiUrl: jest.fn((endpoint: string) => `http://localhost:8080${endpoint}`)
}));

describe('WordPress API Method Factory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCollectionMethod', () => {
    it('should fetch collection data', async () => {
      const mockData = [{ id: 1, name: 'Category 1' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: {} });

      const getCategories = createCollectionMethod<{ id: number; name: string }>({
        endpoint: '/wp/v2/categories',
        fields: 'id,name'
      });

      const result = await getCategories();

      expect(apiClient.get).toHaveBeenCalledWith('http://localhost:8080/wp/v2/categories', {
        params: { _fields: 'id,name' },
        signal: undefined
      });
      expect(result).toEqual(mockData);
    });

    it('should transform data if transform function provided', async () => {
      const mockData = [{ id: 1, name: 'Category 1' }];
      const transformFn = jest.fn((data: any[]) => data.map((item: any) => ({ ...item, transformed: true })));
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: {} });

      const getCategories = createCollectionMethod<{ id: number; name: string; transformed: boolean }>({
        endpoint: '/wp/v2/categories',
        fields: 'id,name',
        transform: transformFn
      });

      const result = await getCategories();

      expect(transformFn).toHaveBeenCalledWith(mockData);
      expect(result).toEqual([{ id: 1, name: 'Category 1', transformed: true }]);
    });

    it('should handle signal parameter', async () => {
      const mockData = [{ id: 1, name: 'Category 1' }];
      const signal = new AbortController().signal;
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: {} });

      const getCategories = createCollectionMethod<{ id: number; name: string }>({
        endpoint: '/wp/v2/categories',
        fields: 'id,name'
      });

      await getCategories(signal);

      expect(apiClient.get).toHaveBeenCalledWith(
        'http://localhost:8080/wp/v2/categories',
        expect.objectContaining({ signal })
      );
    });

    it('should work without fields parameter', async () => {
      const mockData = [{ id: 1, name: 'Category 1' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: {} });

      const getCategories = createCollectionMethod<{ id: number; name: string }>({
        endpoint: '/wp/v2/categories'
      });

      await getCategories();

      expect(apiClient.get).toHaveBeenCalledWith('http://localhost:8080/wp/v2/categories', {
        params: {},
        signal: undefined
      });
    });
  });

  describe('createItemMethod', () => {
    it('should fetch single item by slug', async () => {
      const mockData = [{ id: 1, name: 'Category 1', slug: 'category-1' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: {} });

      const getCategory = createItemMethod<{ id: number; name: string; slug: string }>({
        endpoint: '/wp/v2/categories',
        fields: 'id,name,slug'
      });

      const result = await getCategory('category-1');

      expect(apiClient.get).toHaveBeenCalledWith('http://localhost:8080/wp/v2/categories', {
        params: { slug: 'category-1', _fields: 'id,name,slug' },
        signal: undefined
      });
      expect(result).toEqual(mockData[0]);
    });

    it('should return null if no data found', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: [], headers: {} });

      const getCategory = createItemMethod<{ id: number; name: string; slug: string }>({
        endpoint: '/wp/v2/categories',
        fields: 'id,name,slug'
      });

      const result = await getCategory('nonexistent');

      expect(result).toBeNull();
    });

    it('should transform data if transform function provided', async () => {
      const mockData = [{ id: 1, name: 'Category 1', slug: 'category-1' }];
      const transformFn = jest.fn((data: any) => data[0] ? { ...data[0], transformed: true } : null);
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: {} });

      const getCategory = createItemMethod<{ id: number; name: string; slug: string; transformed: boolean }>({
        endpoint: '/wp/v2/categories',
        fields: 'id,name,slug',
        transform: transformFn
      });

      const result = await getCategory('category-1');

      expect(transformFn).toHaveBeenCalledWith(mockData);
      expect(result).toEqual({ id: 1, name: 'Category 1', slug: 'category-1', transformed: true });
    });
  });

  describe('createIdMethod', () => {
    it('should fetch item by id', async () => {
      const mockData = { id: 1, name: 'Category 1', slug: 'category-1' };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: {} });

      const getCategoryById = createIdMethod<{ id: number; name: string; slug: string }>({
        endpoint: '/wp/v2/categories',
        fields: 'id,name,slug'
      });

      const result = await getCategoryById(1);

      expect(apiClient.get).toHaveBeenCalledWith('http://localhost:8080/wp/v2/categories/1', {
        params: { _fields: 'id,name,slug' },
        signal: undefined
      });
      expect(result).toEqual(mockData);
    });

    it('should return null on error', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Not found'));

      const getCategoryById = createIdMethod<{ id: number; name: string; slug: string }>({
        endpoint: '/wp/v2/categories',
        fields: 'id,name,slug'
      });

      const result = await getCategoryById(999);

      expect(result).toBeNull();
    });

    it('should transform data if transform function provided', async () => {
      const mockData = { id: 1, name: 'Category 1', slug: 'category-1' };
      const transformFn = jest.fn((data: any) => ({ ...data, transformed: true }));
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: {} });

      const getCategoryById = createIdMethod<{ id: number; name: string; slug: string; transformed: boolean }>({
        endpoint: '/wp/v2/categories',
        fields: 'id,name,slug',
        transform: transformFn
      });

      const result = await getCategoryById(1);

      expect(transformFn).toHaveBeenCalledWith(mockData);
      expect(result).toEqual({ id: 1, name: 'Category 1', slug: 'category-1', transformed: true });
    });
  });

  describe('createPostsMethod', () => {
    it('should fetch posts with default params', async () => {
      const mockData = [{ id: 1, title: { rendered: 'Post 1' } }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: {} });

      const getPosts = createPostsMethod();
      await getPosts();

      expect(apiClient.get).toHaveBeenCalledWith('http://localhost:8080/wp/v2/posts', {
        params: undefined,
        signal: undefined
      });
    });

    it('should fetch posts with custom params', async () => {
      const mockData = [{ id: 1, title: { rendered: 'Post 1' } }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: {} });

      const getPosts = createPostsMethod();
      await getPosts({ page: 2, per_page: 10, category: 5 });

      expect(apiClient.get).toHaveBeenCalledWith('http://localhost:8080/wp/v2/posts', {
        params: { page: 2, per_page: 10, category: 5 },
        signal: undefined
      });
    });
  });

  describe('createPostsWithHeadersMethod', () => {
    it('should fetch posts with headers', async () => {
      const mockData = [{ id: 1, title: { rendered: 'Post 1' } }];
      const mockHeaders = { 'x-wp-total': '100', 'x-wp-totalpages': '10' };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: mockHeaders });

      const getPostsWithHeaders = createPostsWithHeadersMethod();
      const result = await getPostsWithHeaders({ page: 1, per_page: 10 });

      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(100);
      expect(result.totalPages).toBe(10);
    });

    it('should handle missing headers gracefully', async () => {
      const mockData = [{ id: 1, title: { rendered: 'Post 1' } }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: {} });

      const getPostsWithHeaders = createPostsWithHeadersMethod();
      const result = await getPostsWithHeaders();

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty response in collection method', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: [], headers: {} });

      const getCategories = createCollectionMethod<{ id: number; name: string }>({
        endpoint: '/wp/v2/categories'
      });

      const result = await getCategories();

      expect(result).toEqual([]);
    });

    it('should handle multiple items in item method', async () => {
      const mockData = [
        { id: 1, name: 'Category 1', slug: 'category-1' },
        { id: 2, name: 'Category 2', slug: 'category-1' }
      ];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: {} });

      const getCategory = createItemMethod<{ id: number; name: string; slug: string }>({
        endpoint: '/wp/v2/categories'
      });

      const result = await getCategory('category-1');

      expect(result).toEqual(mockData[0]);
    });

    it('should handle signal parameter in all methods', async () => {
      const signal = new AbortController().signal;
      const mockData = [{ id: 1, name: 'Category 1' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData, headers: {} });

      const getCategories = createCollectionMethod<{ id: number; name: string }>({
        endpoint: '/wp/v2/categories'
      });
      const getCategory = createItemMethod<{ id: number; name: string; slug: string }>({
        endpoint: '/wp/v2/categories'
      });
      const getCategoryById = createIdMethod<{ id: number; name: string; slug: string }>({
        endpoint: '/wp/v2/categories'
      });
      const getPosts = createPostsMethod();
      const getPostsWithHeaders = createPostsWithHeadersMethod();

      await Promise.all([
        getCategories(signal),
        getCategory('test', signal),
        getCategoryById(1, signal),
        getPosts(undefined, signal),
        getPostsWithHeaders(undefined, signal)
      ]);

      expect(apiClient.get).toHaveBeenCalledTimes(5);
    });
  });
});
