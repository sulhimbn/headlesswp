import { graphqlAPI } from '@/lib/graphql-api';

// Mock GraphQL client
jest.mock('@/lib/graphql', () => ({
  graphqlClient: {
    query: jest.fn(),
  },
}));

describe('GraphQL API', () => {
  const mockGraphQLClient = require('@/lib/graphql').graphqlClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('should fetch posts successfully', async () => {
      const mockPosts = {
        posts: {
          pageInfo: {
            hasNextPage: false,
            endCursor: 'cursor123',
          },
          edges: [
            {
              node: {
                id: '1',
                title: 'Test Post',
                content: 'Test content',
                excerpt: 'Test excerpt',
                slug: 'test-post',
                date: '2023-01-01T00:00:00',
                modified: '2023-01-01T00:00:00',
                status: 'publish',
                link: 'https://example.com/test-post',
              },
            },
          ],
        },
      };

      mockGraphQLClient.query.mockResolvedValue({ data: mockPosts });

      const result = await graphqlAPI.getPosts();

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].title).toBe('Test Post');
      expect(result.hasNextPage).toBe(false);
    });

    it('should handle GraphQL errors', async () => {
      mockGraphQLClient.query.mockResolvedValue({
        errors: [{ message: 'GraphQL Error' }],
      });

      await expect(graphqlAPI.getPosts()).rejects.toThrow('GraphQL Error');
    });
  });

  describe('getPost', () => {
    it('should fetch a single post by slug', async () => {
      const mockPost = {
        post: {
          id: '1',
          title: 'Test Post',
          content: 'Test content',
          excerpt: 'Test excerpt',
          slug: 'test-post',
          date: '2023-01-01T00:00:00',
          modified: '2023-01-01T00:00:00',
          status: 'publish',
          link: 'https://example.com/test-post',
        },
      };

      mockGraphQLClient.query.mockResolvedValue({ data: mockPost });

      const result = await graphqlAPI.getPost('test-post');

      expect(result.title).toBe('Test Post');
      expect(result.slug).toBe('test-post');
    });
  });

  describe('getCategories', () => {
    it('should fetch categories successfully', async () => {
      const mockCategories = {
        categories: {
          edges: [
            {
              node: {
                id: '1',
                name: 'Test Category',
                slug: 'test-category',
                description: 'Test description',
                count: 5,
              },
            },
          ],
        },
      };

      mockGraphQLClient.query.mockResolvedValue({ data: mockCategories });

      const result = await graphqlAPI.getCategories();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Category');
    });
  });

  describe('getTags', () => {
    it('should fetch tags successfully', async () => {
      const mockTags = {
        tags: {
          edges: [
            {
              node: {
                id: '1',
                name: 'Test Tag',
                slug: 'test-tag',
                description: 'Test description',
                count: 3,
              },
            },
          ],
        },
      };

      mockGraphQLClient.query.mockResolvedValue({ data: mockTags });

      const result = await graphqlAPI.getTags();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Tag');
    });
  });

  describe('search', () => {
    it('should search posts successfully', async () => {
      const mockSearchResults = {
        posts: {
          edges: [
            {
              node: {
                id: '1',
                title: 'Search Result Post',
                content: 'Content with search term',
                excerpt: 'Search excerpt',
                slug: 'search-result',
                date: '2023-01-01T00:00:00',
                modified: '2023-01-01T00:00:00',
                status: 'publish',
                link: 'https://example.com/search-result',
              },
            },
          ],
        },
      };

      mockGraphQLClient.query.mockResolvedValue({ data: mockSearchResults });

      const result = await graphqlAPI.search('search term');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Search Result Post');
    });
  });
});