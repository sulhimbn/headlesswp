import { enhancedPostService } from '@/lib/services/enhancedPostService';
import { wordpressAPI } from '@/lib/wordpress';
import { cacheManager } from '@/lib/cache';
import { dataValidator } from '@/lib/validation/dataValidator';
import { WordPressPost, WordPressCategory, WordPressTag } from '@/types/wordpress';
import { PAGINATION_LIMITS } from '@/lib/api/config';

jest.mock('@/lib/wordpress');
jest.mock('@/lib/cache');
jest.mock('@/lib/validation/dataValidator');

describe('enhancedPostService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (wordpressAPI.getPostsWithHeaders as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0
    });
  });

  describe('getLatestPosts', () => {
    it('should return enriched posts with media URLs on success', async () => {
      const mockPosts: WordPressPost[] = [
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
          featured_media: 10,
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
          featured_media: 20,
          status: 'publish',
          type: 'post',
          link: 'https://example.com/post-2'
        }
      ];

      (wordpressAPI.getPosts as jest.Mock).mockResolvedValue(mockPosts);
      (dataValidator.validatePosts as jest.Mock).mockReturnValue({ valid: true, data: mockPosts, errors: [] });
      (wordpressAPI.getMediaUrlsBatch as jest.Mock).mockResolvedValue(
        new Map([[10, 'https://example.com/media1.jpg'], [20, 'https://example.com/media2.jpg']])
      );

      const result = await enhancedPostService.getLatestPosts();

      expect(wordpressAPI.getPosts).toHaveBeenCalledWith({ per_page: PAGINATION_LIMITS.LATEST_POSTS });
      expect(dataValidator.validatePosts).toHaveBeenCalledWith(mockPosts);
      expect(result).toHaveLength(2);
      expect(result[0].mediaUrl).toBe('https://example.com/media1.jpg');
      expect(result[1].mediaUrl).toBe('https://example.com/media2.jpg');
    });

    it('should return fallback posts on validation failure', async () => {
      const mockPosts = [{ id: 1 }] as WordPressPost[];
      (wordpressAPI.getPosts as jest.Mock).mockResolvedValue(mockPosts);
      (dataValidator.validatePosts as jest.Mock).mockReturnValue({
        valid: false,
        data: undefined,
        errors: ['Invalid post data']
      });

      const result = await enhancedPostService.getLatestPosts();

      expect(result).toHaveLength(3);
      expect(result[0].title.rendered).toBe('Berita Utama 1');
      expect(result[1].title.rendered).toBe('Berita Utama 2');
      expect(result[2].title.rendered).toBe('Berita Utama 3');
      expect(result.every(post => post.mediaUrl === null)).toBe(true);
    });

    it('should return fallback posts on API error', async () => {
      (wordpressAPI.getPosts as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await enhancedPostService.getLatestPosts();

      expect(result).toHaveLength(3);
      expect(result.every(post => post.mediaUrl === null)).toBe(true);
    });
  });

  describe('getCategoryPosts', () => {
    it('should return enriched posts with media URLs on success', async () => {
      const mockPosts: WordPressPost[] = [
        {
          id: 1,
          title: { rendered: 'Category Post 1' },
          content: { rendered: '<p>Content</p>' },
          excerpt: { rendered: 'Excerpt' },
          slug: 'cat-post-1',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          author: 1,
          categories: [1],
          tags: [],
          featured_media: 10,
          status: 'publish',
          type: 'post',
          link: 'https://example.com/cat-post-1'
        }
      ];

      (wordpressAPI.getPosts as jest.Mock).mockResolvedValue(mockPosts);
      (dataValidator.validatePosts as jest.Mock).mockReturnValue({ valid: true, data: mockPosts, errors: [] });
      (wordpressAPI.getMediaUrlsBatch as jest.Mock).mockResolvedValue(new Map([[10, 'https://example.com/media.jpg']]));

      const result = await enhancedPostService.getCategoryPosts();

      expect(wordpressAPI.getPosts).toHaveBeenCalledWith({ per_page: PAGINATION_LIMITS.CATEGORY_POSTS });
      expect(result).toHaveLength(1);
      expect(result[0].mediaUrl).toBe('https://example.com/media.jpg');
    });

    it('should return fallback posts on validation failure', async () => {
      const mockPosts = [{ id: 1 }] as WordPressPost[];
      (wordpressAPI.getPosts as jest.Mock).mockResolvedValue(mockPosts);
      (dataValidator.validatePosts as jest.Mock).mockReturnValue({
        valid: false,
        data: undefined,
        errors: ['Invalid category posts']
      });

      const result = await enhancedPostService.getCategoryPosts();

      expect(result).toHaveLength(3);
      expect(result[0].slug).toContain('cat-');
      expect(result.every(post => post.mediaUrl === null)).toBe(true);
    });

    it('should return fallback posts on API error', async () => {
      (wordpressAPI.getPosts as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await enhancedPostService.getCategoryPosts();

      expect(result).toHaveLength(3);
      expect(result.every(post => post.mediaUrl === null)).toBe(true);
    });
  });

  describe('getAllPosts', () => {
    it('should return all posts with media URLs on success', async () => {
      const mockPosts: WordPressPost[] = [
        {
          id: 1,
          title: { rendered: 'All Post 1' },
          content: { rendered: '<p>Content</p>' },
          excerpt: { rendered: 'Excerpt' },
          slug: 'all-post-1',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          author: 1,
          categories: [1],
          tags: [],
          featured_media: 10,
          status: 'publish',
          type: 'post',
          link: 'https://example.com/all-post-1'
        }
      ];

      (wordpressAPI.getPosts as jest.Mock).mockResolvedValue(mockPosts);
      (dataValidator.validatePosts as jest.Mock).mockReturnValue({ valid: true, data: mockPosts, errors: [] });
      (wordpressAPI.getMediaUrlsBatch as jest.Mock).mockResolvedValue(new Map([[10, 'https://example.com/media.jpg']]));

      const result = await enhancedPostService.getAllPosts();

      expect(wordpressAPI.getPosts).toHaveBeenCalledWith({ per_page: PAGINATION_LIMITS.ALL_POSTS });
      expect(result).toHaveLength(1);
      expect(result[0].mediaUrl).toBe('https://example.com/media.jpg');
    });

    it('should return empty array on validation failure', async () => {
      const mockPosts = [{ id: 1 }] as WordPressPost[];
      (wordpressAPI.getPosts as jest.Mock).mockResolvedValue(mockPosts);
      (dataValidator.validatePosts as jest.Mock).mockReturnValue({
        valid: false,
        data: undefined,
        errors: ['Invalid all posts']
      });

      const result = await enhancedPostService.getAllPosts();

      expect(result).toEqual([]);
    });

    it('should return empty array on API error', async () => {
      (wordpressAPI.getPosts as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await enhancedPostService.getAllPosts();

      expect(result).toEqual([]);
    });
  });

  describe('getPaginatedPosts', () => {
    it('should return paginated posts with accurate total count and pages from headers', async () => {
      const mockPosts: WordPressPost[] = [
        {
          id: 1,
          title: { rendered: 'Paginated Post 1' },
          content: { rendered: '<p>Content</p>' },
          excerpt: { rendered: 'Excerpt' },
          slug: 'paginated-1',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          author: 1,
          categories: [1],
          tags: [],
          featured_media: 10,
          status: 'publish',
          type: 'post',
          link: 'https://example.com/paginated-1'
        }
      ];

      (wordpressAPI.getPostsWithHeaders as jest.Mock).mockResolvedValue({
        data: mockPosts,
        total: 150,
        totalPages: 15
      });
      (dataValidator.validatePosts as jest.Mock).mockReturnValue({ valid: true, data: mockPosts, errors: [] });
      (wordpressAPI.getMediaUrlsBatch as jest.Mock).mockResolvedValue(new Map([[10, 'https://example.com/media.jpg']]));

      const result = await enhancedPostService.getPaginatedPosts(1, 10);

      expect(wordpressAPI.getPostsWithHeaders).toHaveBeenCalledWith({ page: 1, per_page: 10 });
      expect(result.posts).toHaveLength(1);
      expect(result.totalPosts).toBe(150);
      expect(result.totalPages).toBe(15);
      expect(result.posts[0].mediaUrl).toBe('https://example.com/media.jpg');
    });

    it('should return empty result on validation failure', async () => {
      const mockPosts = [{ id: 1 }] as WordPressPost[];
      (wordpressAPI.getPostsWithHeaders as jest.Mock).mockResolvedValue({
        data: mockPosts,
        total: 1,
        totalPages: 1
      });
      (dataValidator.validatePosts as jest.Mock).mockReturnValue({
        valid: false,
        data: undefined,
        errors: ['Invalid paginated posts']
      });

      const result = await enhancedPostService.getPaginatedPosts(1, 10);

      expect(result.posts).toEqual([]);
      expect(result.totalPosts).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should return empty result on API error', async () => {
      (wordpressAPI.getPostsWithHeaders as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await enhancedPostService.getPaginatedPosts(1, 10);

      expect(result.posts).toEqual([]);
      expect(result.totalPosts).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle zero total posts', async () => {
      (wordpressAPI.getPostsWithHeaders as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
        totalPages: 0
      });
      (dataValidator.validatePosts as jest.Mock).mockReturnValue({ valid: true, data: [], errors: [] });
      (wordpressAPI.getMediaUrlsBatch as jest.Mock).mockResolvedValue(new Map());

      const result = await enhancedPostService.getPaginatedPosts(1, 10);

      expect(result.posts).toEqual([]);
      expect(result.totalPosts).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('getPostBySlug', () => {
    it('should return post with details on success', async () => {
      const mockPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Post by Slug' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Excerpt' },
        slug: 'post-by-slug',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        categories: [1, 2],
        tags: [5, 6],
        featured_media: 10,
        status: 'publish',
        type: 'post',
        link: 'https://example.com/post-by-slug'
      };

      const mockCategories: WordPressCategory[] = [
        { id: 1, name: 'Tech', slug: 'tech', description: 'Tech', parent: 0, count: 10, link: 'https://example.com/tech' },
        { id: 2, name: 'News', slug: 'news', description: 'News', parent: 0, count: 20, link: 'https://example.com/news' }
      ];

      const mockTags: WordPressTag[] = [
        { id: 5, name: 'React', slug: 'react', description: 'React', count: 15, link: 'https://example.com/react' },
        { id: 6, name: 'TypeScript', slug: 'typescript', description: 'TypeScript', count: 10, link: 'https://example.com/typescript' }
      ];

      (wordpressAPI.getPost as jest.Mock).mockResolvedValue(mockPost);
      (dataValidator.validatePost as jest.Mock).mockReturnValue({ valid: true, data: mockPost, errors: [] });
      (wordpressAPI.getMediaUrl as jest.Mock).mockResolvedValue('https://example.com/media.jpg');
      (wordpressAPI.getCategories as jest.Mock).mockResolvedValue(mockCategories);
      (dataValidator.validateCategories as jest.Mock).mockReturnValue({ valid: true, data: mockCategories, errors: [] });
      (wordpressAPI.getTags as jest.Mock).mockResolvedValue(mockTags);
      (dataValidator.validateTags as jest.Mock).mockReturnValue({ valid: true, data: mockTags, errors: [] });

      const result = await enhancedPostService.getPostBySlug('post-by-slug');

      expect(result).not.toBeNull();
      expect(result!.mediaUrl).toBe('https://example.com/media.jpg');
      expect(result!.categoriesDetails).toHaveLength(2);
      expect(result!.categoriesDetails[0].name).toBe('Tech');
      expect(result!.tagsDetails).toHaveLength(2);
      expect(result!.tagsDetails[0].name).toBe('React');
    });

    it('should return null when post not found', async () => {
      (wordpressAPI.getPost as jest.Mock).mockResolvedValue(null);

      const result = await enhancedPostService.getPostBySlug('non-existent');

      expect(result).toBeNull();
    });

    it('should return null on validation failure', async () => {
      const mockPost = { id: 1 } as WordPressPost;
      (wordpressAPI.getPost as jest.Mock).mockResolvedValue(mockPost);
      (dataValidator.validatePost as jest.Mock).mockReturnValue({
        valid: false,
        data: undefined,
        errors: ['Invalid post']
      });

      const result = await enhancedPostService.getPostBySlug('test-slug');

      expect(result).toBeNull();
    });

    it('should return null on API error', async () => {
      (wordpressAPI.getPost as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await enhancedPostService.getPostBySlug('test-slug');

      expect(result).toBeNull();
    });

    it('should handle empty categories and tags', async () => {
      const mockPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Post' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Excerpt' },
        slug: 'post',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        categories: [],
        tags: [],
        featured_media: 0,
        status: 'publish',
        type: 'post',
        link: 'https://example.com/post'
      };

      (wordpressAPI.getPost as jest.Mock).mockResolvedValue(mockPost);
      (dataValidator.validatePost as jest.Mock).mockReturnValue({ valid: true, data: mockPost, errors: [] });
      (wordpressAPI.getMediaUrl as jest.Mock).mockResolvedValue(null);
      (wordpressAPI.getCategories as jest.Mock).mockResolvedValue([]);
      (dataValidator.validateCategories as jest.Mock).mockReturnValue({ valid: true, data: [], errors: [] });
      (wordpressAPI.getTags as jest.Mock).mockResolvedValue([]);
      (dataValidator.validateTags as jest.Mock).mockReturnValue({ valid: true, data: [], errors: [] });

      const result = await enhancedPostService.getPostBySlug('post');

      expect(result).not.toBeNull();
      expect(result!.categoriesDetails).toHaveLength(0);
      expect(result!.tagsDetails).toHaveLength(0);
      expect(result!.mediaUrl).toBeNull();
    });
  });

  describe('getPostById', () => {
    it('should return post with details on success', async () => {
      const mockPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Post by ID' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Excerpt' },
        slug: 'post-by-id',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        categories: [1],
        tags: [5],
        featured_media: 10,
        status: 'publish',
        type: 'post',
        link: 'https://example.com/post-by-id'
      };

      const mockCategories: WordPressCategory[] = [
        { id: 1, name: 'Tech', slug: 'tech', description: 'Tech', parent: 0, count: 10, link: 'https://example.com/tech' }
      ];

      const mockTags: WordPressTag[] = [
        { id: 5, name: 'React', slug: 'react', description: 'React', count: 15, link: 'https://example.com/react' }
      ];

      (wordpressAPI.getPostById as jest.Mock).mockResolvedValue(mockPost);
      (dataValidator.validatePost as jest.Mock).mockReturnValue({ valid: true, data: mockPost, errors: [] });
      (wordpressAPI.getMediaUrl as jest.Mock).mockResolvedValue('https://example.com/media.jpg');
      (wordpressAPI.getCategories as jest.Mock).mockResolvedValue(mockCategories);
      (dataValidator.validateCategories as jest.Mock).mockReturnValue({ valid: true, data: mockCategories, errors: [] });
      (wordpressAPI.getTags as jest.Mock).mockResolvedValue(mockTags);
      (dataValidator.validateTags as jest.Mock).mockReturnValue({ valid: true, data: mockTags, errors: [] });

      const result = await enhancedPostService.getPostById(1);

      expect(result).not.toBeNull();
      expect(result!.mediaUrl).toBe('https://example.com/media.jpg');
      expect(result!.categoriesDetails).toHaveLength(1);
      expect(result!.tagsDetails).toHaveLength(1);
    });

    it('should return null on validation failure', async () => {
      const mockPost = { id: 1 } as WordPressPost;
      (wordpressAPI.getPostById as jest.Mock).mockResolvedValue(mockPost);
      (dataValidator.validatePost as jest.Mock).mockReturnValue({
        valid: false,
        data: undefined,
        errors: ['Invalid post']
      });

      const result = await enhancedPostService.getPostById(1);

      expect(result).toBeNull();
    });

    it('should return null on API error', async () => {
      (wordpressAPI.getPostById as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await enhancedPostService.getPostById(1);

      expect(result).toBeNull();
    });
  });

  describe('getCategories', () => {
    it('should return array of categories on success', async () => {
      const mockCategories: WordPressCategory[] = [
        { id: 1, name: 'Tech', slug: 'tech', description: 'Tech', parent: 0, count: 10, link: 'https://example.com/tech' },
        { id: 2, name: 'News', slug: 'news', description: 'News', parent: 0, count: 20, link: 'https://example.com/news' }
      ];

      (wordpressAPI.getCategories as jest.Mock).mockResolvedValue(mockCategories);
      (dataValidator.validateCategories as jest.Mock).mockReturnValue({ valid: true, data: mockCategories, errors: [] });

      const result = await enhancedPostService.getCategories();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Tech');
      expect(result[1].name).toBe('News');
    });

    it('should return empty array on validation failure', async () => {
      (wordpressAPI.getCategories as jest.Mock).mockResolvedValue([]);
      (dataValidator.validateCategories as jest.Mock).mockReturnValue({
        valid: false,
        data: undefined,
        errors: ['Invalid categories']
      });

      const result = await enhancedPostService.getCategories();

      expect(result).toEqual([]);
    });

    it('should return empty array on API error', async () => {
      (wordpressAPI.getCategories as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await enhancedPostService.getCategories();

      expect(result).toEqual([]);
    });

    it('should use cached categories when available', async () => {
      const mockCategories: WordPressCategory[] = [
        { id: 1, name: 'Tech', slug: 'tech', description: 'Tech', parent: 0, count: 10, link: 'https://example.com/tech' }
      ];

      (cacheManager.get as jest.Mock).mockReturnValueOnce(mockCategories);

      const result = await enhancedPostService.getCategories();

      expect(cacheManager.get).toHaveBeenCalled();
      expect(wordpressAPI.getCategories).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('getTags', () => {
    it('should return array of tags on success', async () => {
      const mockTags: WordPressTag[] = [
        { id: 1, name: 'React', slug: 'react', description: 'React', count: 15, link: 'https://example.com/react' },
        { id: 2, name: 'TypeScript', slug: 'typescript', description: 'TypeScript', count: 10, link: 'https://example.com/typescript' }
      ];

      (wordpressAPI.getTags as jest.Mock).mockResolvedValue(mockTags);
      (dataValidator.validateTags as jest.Mock).mockReturnValue({ valid: true, data: mockTags, errors: [] });

      const result = await enhancedPostService.getTags();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('React');
      expect(result[1].name).toBe('TypeScript');
    });

    it('should return empty array on validation failure', async () => {
      (wordpressAPI.getTags as jest.Mock).mockResolvedValue([]);
      (dataValidator.validateTags as jest.Mock).mockReturnValue({
        valid: false,
        data: undefined,
        errors: ['Invalid tags']
      });

      const result = await enhancedPostService.getTags();

      expect(result).toEqual([]);
    });

    it('should return empty array on API error', async () => {
      (wordpressAPI.getTags as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await enhancedPostService.getTags();

      expect(result).toEqual([]);
    });

    it('should use cached tags when available', async () => {
      const mockTags: WordPressTag[] = [
        { id: 1, name: 'React', slug: 'react', description: 'React', count: 15, link: 'https://example.com/react' }
      ];

      (cacheManager.get as jest.Mock).mockReturnValueOnce(mockTags);

      const result = await enhancedPostService.getTags();

      expect(cacheManager.get).toHaveBeenCalled();
      expect(wordpressAPI.getTags).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache categories after fetching', async () => {
      const mockCategories: WordPressCategory[] = [
        { id: 1, name: 'Tech', slug: 'tech', description: 'Tech', parent: 0, count: 10, link: 'https://example.com/tech' }
      ];

      (cacheManager.get as jest.Mock).mockReturnValueOnce(null);
      (wordpressAPI.getCategories as jest.Mock).mockResolvedValue(mockCategories);
      (dataValidator.validateCategories as jest.Mock).mockReturnValue({ valid: true, data: mockCategories, errors: [] });

      await enhancedPostService.getCategories();

      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should cache tags after fetching', async () => {
      const mockTags: WordPressTag[] = [
        { id: 1, name: 'React', slug: 'react', description: 'React', count: 15, link: 'https://example.com/react' }
      ];

      (cacheManager.get as jest.Mock).mockReturnValueOnce(null);
      (wordpressAPI.getTags as jest.Mock).mockResolvedValue(mockTags);
      (dataValidator.validateTags as jest.Mock).mockReturnValue({ valid: true, data: mockTags, errors: [] });

      await enhancedPostService.getTags();

      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate posts before enrichment', async () => {
      const mockPosts: WordPressPost[] = [
        {
          id: 1,
          title: { rendered: 'Valid Post' },
          content: { rendered: '<p>Content</p>' },
          excerpt: { rendered: 'Excerpt' },
          slug: 'valid-post',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          author: 1,
          categories: [1],
          tags: [],
          featured_media: 10,
          status: 'publish',
          type: 'post',
          link: 'https://example.com/valid-post'
        }
      ];

      (wordpressAPI.getPosts as jest.Mock).mockResolvedValue(mockPosts);
      (dataValidator.validatePosts as jest.Mock).mockReturnValue({ valid: true, data: mockPosts, errors: [] });
      (wordpressAPI.getMediaUrlsBatch as jest.Mock).mockResolvedValue(new Map([[10, 'https://example.com/media.jpg']]));

      await enhancedPostService.getLatestPosts();

      expect(dataValidator.validatePosts).toHaveBeenCalledWith(mockPosts);
    });

    it('should validate categories before caching', async () => {
      const mockCategories: WordPressCategory[] = [
        { id: 1, name: 'Tech', slug: 'tech', description: 'Tech', parent: 0, count: 10, link: 'https://example.com/tech' }
      ];

      (cacheManager.get as jest.Mock).mockReturnValueOnce(null);
      (wordpressAPI.getCategories as jest.Mock).mockResolvedValue(mockCategories);
      (dataValidator.validateCategories as jest.Mock).mockReturnValue({ valid: true, data: mockCategories, errors: [] });

      await enhancedPostService.getCategories();

      expect(dataValidator.validateCategories).toHaveBeenCalledWith(mockCategories);
    });

    it('should validate tags before caching', async () => {
      const mockTags: WordPressTag[] = [
        { id: 1, name: 'React', slug: 'react', description: 'React', count: 15, link: 'https://example.com/react' }
      ];

      (cacheManager.get as jest.Mock).mockReturnValueOnce(null);
      (wordpressAPI.getTags as jest.Mock).mockResolvedValue(mockTags);
      (dataValidator.validateTags as jest.Mock).mockReturnValue({ valid: true, data: mockTags, errors: [] });

      await enhancedPostService.getTags();

      expect(dataValidator.validateTags).toHaveBeenCalledWith(mockTags);
    });
  });
});
