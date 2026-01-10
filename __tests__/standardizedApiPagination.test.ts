import { getAllPosts } from '@/lib/api/standardized';
import { wordpressAPI } from '@/lib/wordpress';
import type { WordPressPost } from '@/types/wordpress';

// Mock wordpressAPI
jest.mock('@/lib/wordpress', () => ({
  wordpressAPI: {
    getPostsWithHeaders: jest.fn(),
    getPosts: jest.fn(),
  },
}));

const mockGetPostsWithHeaders = wordpressAPI.getPostsWithHeaders as jest.MockedFunction<
  (params?: {
    page?: number;
    per_page?: number;
    category?: number;
    tag?: number;
    search?: string;
  }) => Promise<{ data: WordPressPost[]; total: number; totalPages: number }>
>;

describe('standardizedAPI - getAllPosts Pagination', () => {
  const mockPosts: WordPressPost[] = [
    {
      id: 1,
      title: { rendered: 'Post 1' },
      content: { rendered: '<p>Content 1</p>' },
      excerpt: { rendered: '<p>Excerpt 1</p>' },
      slug: 'post-1',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      featured_media: 0,
      categories: [1],
      tags: [],
      status: 'publish',
      type: 'post',
      link: 'https://example.com/post-1',
    },
    {
      id: 2,
      title: { rendered: 'Post 2' },
      content: { rendered: '<p>Content 2</p>' },
      excerpt: { rendered: '<p>Excerpt 2</p>' },
      slug: 'post-2',
      date: '2024-01-02T00:00:00',
      modified: '2024-01-02T00:00:00',
      author: 1,
      featured_media: 0,
      categories: [1],
      tags: [],
      status: 'publish',
      type: 'post',
      link: 'https://example.com/post-2',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Pagination Accuracy', () => {
    it('should return correct total count from API headers', async () => {
      // Arrange: Mock API returns 2 posts but total is 150
      mockGetPostsWithHeaders.mockResolvedValueOnce({
        data: mockPosts,
        total: 150,
        totalPages: 15,
      });

      // Act
      const result = await getAllPosts({ page: 1, per_page: 10 });

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(150); // Should be from header, not posts.length
      expect(result.metadata.endpoint).toBe('/wp/v2/posts');
    });

    it('should return correct total pages from API headers', async () => {
      // Arrange: Mock API returns 2 posts but total pages is 15
      mockGetPostsWithHeaders.mockResolvedValueOnce({
        data: mockPosts,
        total: 150,
        totalPages: 15,
      });

      // Act
      const result = await getAllPosts({ page: 1, per_page: 10 });

      // Assert
      expect(result.error).toBeNull();
      expect(result.pagination.totalPages).toBe(15); // Should be from header
    });

    it('should handle per_page parameter correctly', async () => {
      // Arrange
      mockGetPostsWithHeaders.mockResolvedValueOnce({
        data: mockPosts,
        total: 25,
        totalPages: 5,
      });

      // Act
      const result = await getAllPosts({ page: 1, per_page: 5 });

      // Assert
      expect(mockGetPostsWithHeaders).toHaveBeenCalledWith(
        expect.objectContaining({ per_page: 5 })
      );
      expect(result.pagination.perPage).toBe(5);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(5);
    });

    it('should handle page parameter correctly', async () => {
      // Arrange
      mockGetPostsWithHeaders.mockResolvedValueOnce({
        data: mockPosts,
        total: 25,
        totalPages: 5,
      });

      // Act
      const result = await getAllPosts({ page: 3, per_page: 5 });

      // Assert
      expect(mockGetPostsWithHeaders).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3 })
      );
      expect(result.pagination.page).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty result set correctly (total=0, totalPages=0)', async () => {
      // Arrange: WordPress returns no posts
      mockGetPostsWithHeaders.mockResolvedValueOnce({
        data: [],
        total: 0,
        totalPages: 0,
      });

      // Act
      const result = await getAllPosts();

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should handle single page correctly (total <= per_page, totalPages=1)', async () => {
      // Arrange: Only 8 posts total, per_page=10 - create 8 mock posts
      const eightPosts: WordPressPost[] = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        title: { rendered: `Post ${i + 1}` },
        content: { rendered: `<p>Content ${i + 1}</p>` },
        excerpt: { rendered: `<p>Excerpt ${i + 1}</p>` },
        slug: `post-${i + 1}`,
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        featured_media: 0,
        categories: [1],
        tags: [],
        status: 'publish',
        type: 'post',
        link: `https://example.com/post-${i + 1}`,
      }));

      mockGetPostsWithHeaders.mockResolvedValueOnce({
        data: eightPosts,
        total: 8,
        totalPages: 1,
      });

      // Act
      const result = await getAllPosts({ per_page: 10 });

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(8);
      expect(result.pagination.total).toBe(8);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should handle large dataset with many pages', async () => {
      // Arrange: 1000 total posts, 10 per page
      mockGetPostsWithHeaders.mockResolvedValueOnce({
        data: mockPosts,
        total: 1000,
        totalPages: 100,
      });

      // Act
      const result = await getAllPosts({ page: 1, per_page: 10 });

      // Assert
      expect(result.error).toBeNull();
      expect(result.pagination.total).toBe(1000);
      expect(result.pagination.totalPages).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should preserve error result structure on API error', async () => {
      // Arrange: API returns error
      const apiError = new Error('API Error: 500 Internal Server Error');
      mockGetPostsWithHeaders.mockRejectedValueOnce(apiError);

      // Act
      const result = await getAllPosts();

      // Assert
      expect(result.error).not.toBeNull();
      expect(result.data).toEqual([]);
      expect(result.error?.type).toBe('UNKNOWN_ERROR');
      expect(result.error?.message).toBe('API Error: 500 Internal Server Error');
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should return zero pagination on network error', async () => {
      // Arrange: Network error
      const networkError = new Error('Network Error: ECONNREFUSED');
      mockGetPostsWithHeaders.mockRejectedValueOnce(networkError);

      // Act
      const result = await getAllPosts();

      // Assert
      expect(result.error).not.toBeNull();
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('Default Behavior', () => {
    it('should use default page (1) when not specified', async () => {
      // Arrange
      mockGetPostsWithHeaders.mockResolvedValueOnce({
        data: mockPosts,
        total: 50,
        totalPages: 5,
      });

      // Act
      const result = await getAllPosts();

      // Assert
      expect(result.pagination.page).toBe(1);
    });

    it('should use default per_page when not specified', async () => {
      // Arrange: DEFAULT_PER_PAGE is 10 (from config.ts)
      mockGetPostsWithHeaders.mockResolvedValueOnce({
        data: mockPosts,
        total: 100,
        totalPages: 10,
      });

      // Act
      const result = await getAllPosts();

      // Assert
      expect(result.pagination.perPage).toBe(10);
    });
  });
});
