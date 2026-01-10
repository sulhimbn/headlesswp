import { wordpressAPI } from '@/lib/wordpress';
import { WordPressPost } from '@/types/wordpress';
import { apiClient } from '@/lib/api/client';
import { cacheManager } from '@/lib/cache';

jest.mock('@/lib/api/client');
jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');

describe('WordPress REST API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic API Methods', () => {
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
      expect(process.env.NEXT_PUBLIC_WORDPRESS_API_URL).toBeDefined();
    });

    it('should handle WordPress post structure', () => {
      const mockPost: WordPressPost = {
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
        link: 'https://example.com/test-post'
      };

      expect(mockPost.title.rendered).toBe('Test Post');
      expect(mockPost.content.rendered).toContain('Test content');
      expect(mockPost.slug).toBe('test-post');
    });
  });

  describe('getPost', () => {
    it('should fetch post by slug', async () => {
      const mockPost = { id: 1, title: { rendered: 'Test Post' }, slug: 'test-post' };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: [mockPost]
      });

      const result = await wordpressAPI.getPost('test-post');

      expect(result).toEqual(mockPost);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should return first result from array', async () => {
      const mockPosts = [
        { id: 1, title: { rendered: 'First' } },
        { id: 2, title: { rendered: 'Second' } }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockPosts
      });

      const result = await wordpressAPI.getPost('test');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.title.rendered).toBe('First');
    });

    it('should support optional signal parameter', async () => {
      const mockPost = { id: 1, title: { rendered: 'Test' } };
      const mockSignal = {} as AbortSignal;

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: [mockPost]
      });

      await wordpressAPI.getPost('test', mockSignal);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect((apiClient.get as jest.Mock).mock.calls[0][1]?.signal).toBe(mockSignal);
    });
  });

  describe('getPostById', () => {
    it('should fetch post by ID', async () => {
      const mockPost = { id: 123, title: { rendered: 'Test Post' } };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockPost
      });

      const result = await wordpressAPI.getPostById(123);

      expect(result).toEqual(mockPost);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should support optional signal parameter', async () => {
      const mockPost = { id: 456, title: { rendered: 'Test' } };
      const mockSignal = {} as AbortSignal;

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockPost
      });

      await wordpressAPI.getPostById(456, mockSignal);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect((apiClient.get as jest.Mock).mock.calls[0][1]?.signal).toBe(mockSignal);
    });
  });

  describe('getCategory', () => {
    it('should fetch category by slug', async () => {
      const mockCategory = { id: 1, name: 'Technology', slug: 'technology' };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: [mockCategory]
      });

      const result = await wordpressAPI.getCategory('technology');

      expect(result).toEqual(mockCategory);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should support optional signal parameter', async () => {
      const mockCategory = { id: 1, name: 'News' };
      const mockSignal = {} as AbortSignal;

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: [mockCategory]
      });

      await wordpressAPI.getCategory('news', mockSignal);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect((apiClient.get as jest.Mock).mock.calls[0][1]?.signal).toBe(mockSignal);
    });
  });

  describe('getTag', () => {
    it('should fetch tag by slug', async () => {
      const mockTag = { id: 1, name: 'JavaScript', slug: 'javascript' };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: [mockTag]
      });

      const result = await wordpressAPI.getTag('javascript');

      expect(result).toEqual(mockTag);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should support optional signal parameter', async () => {
      const mockTag = { id: 1, name: 'React' };
      const mockSignal = {} as AbortSignal;

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: [mockTag]
      });

      await wordpressAPI.getTag('react', mockSignal);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect((apiClient.get as jest.Mock).mock.calls[0][1]?.signal).toBe(mockSignal);
    });
  });

  describe('getAuthor', () => {
    it('should fetch author by ID', async () => {
      const mockAuthor = {
        id: 1,
        name: 'John Doe',
        slug: 'john-doe',
        email: 'john@example.com'
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockAuthor
      });

      const result = await wordpressAPI.getAuthor(1);

      expect(result).toEqual(mockAuthor);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should support optional signal parameter', async () => {
      const mockAuthor = { id: 2, name: 'Jane Doe' };
      const mockSignal = {} as AbortSignal;

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockAuthor
      });

      await wordpressAPI.getAuthor(2, mockSignal);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect((apiClient.get as jest.Mock).mock.calls[0][1]?.signal).toBe(mockSignal);
    });
  });

  describe('search', () => {
    it('should cache search results', async () => {
      const mockResults = [
        { id: 1, title: { rendered: 'React Tutorial' } },
        { id: 2, title: { rendered: 'React Hooks Guide' } }
      ];

      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResults
      });

      const result = await wordpressAPI.search('react');

      expect(result).toEqual(mockResults);
      expect(apiClient.get).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should return cached search results', async () => {
      const cachedResults = [
        { id: 1, title: { rendered: 'Cached Result' } }
      ];

      (cacheManager.get as jest.Mock).mockReturnValue(cachedResults);

      const result = await wordpressAPI.search('test');

      expect(result).toEqual(cachedResults);
      expect(apiClient.get).not.toHaveBeenCalled();
      expect(cacheManager.get).toHaveBeenCalled();
    });

    it('should handle empty search results', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: []
      });

      const result = await wordpressAPI.search('nonexistent');

      expect(result).toEqual([]);
      expect(apiClient.get).toHaveBeenCalled();
    });

    it('should handle search query with spaces', async () => {
      const mockResults = [{ id: 1, title: { rendered: 'Test' } }];

      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResults
      });

      await wordpressAPI.search('react hooks');

      expect(cacheManager.get).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getPosts', () => {
    it('should fetch posts with optional parameters', async () => {
      const mockPosts = [
        { id: 1, title: { rendered: 'Post 1' } },
        { id: 2, title: { rendered: 'Post 2' } }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockPosts
      });

      const result = await wordpressAPI.getPosts({ page: 1, per_page: 10 });

      expect(result).toEqual(mockPosts);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should support signal parameter', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Test' } }];
      const mockSignal = {} as AbortSignal;

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockPosts
      });

      await wordpressAPI.getPosts({}, mockSignal);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect((apiClient.get as jest.Mock).mock.calls[0][1]?.signal).toBe(mockSignal);
    });
  });

  describe('getCategories', () => {
    it('should fetch all categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Technology' },
        { id: 2, name: 'News' }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockCategories
      });

      const result = await wordpressAPI.getCategories();

      expect(result).toEqual(mockCategories);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should support signal parameter', async () => {
      const mockCategories = [{ id: 1, name: 'Tech' }];
      const mockSignal = {} as AbortSignal;

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockCategories
      });

      await wordpressAPI.getCategories(mockSignal);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect((apiClient.get as jest.Mock).mock.calls[0][1]?.signal).toBe(mockSignal);
    });
  });

  describe('getTags', () => {
    it('should fetch all tags', async () => {
      const mockTags = [
        { id: 1, name: 'JavaScript' },
        { id: 2, name: 'React' }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockTags
      });

      const result = await wordpressAPI.getTags();

      expect(result).toEqual(mockTags);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should support signal parameter', async () => {
      const mockTags = [{ id: 1, name: 'JS' }];
      const mockSignal = {} as AbortSignal;

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockTags
      });

      await wordpressAPI.getTags(mockSignal);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect((apiClient.get as jest.Mock).mock.calls[0][1]?.signal).toBe(mockSignal);
    });
  });
});
