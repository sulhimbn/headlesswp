import { WordPressPost } from '@/types/wordpress';

// Mock the modules before importing
jest.mock('@/lib/apollo-client', () => ({
  apolloClient: {
    query: jest.fn(),
  },
}));

jest.mock('@/lib/graphql-queries', () => ({
  GET_POSTS: 'GET_POSTS',
  GET_POST: 'GET_POST',
  GET_POST_BY_ID: 'GET_POST_BY_ID',
  GET_CATEGORIES: 'GET_CATEGORIES',
  GET_CATEGORY: 'GET_CATEGORY',
  GET_TAGS: 'GET_TAGS',
  GET_TAG: 'GET_TAG',
  SEARCH_POSTS: 'SEARCH_POSTS',
}));

// Import after mocking
import { graphqlWordPressAPI } from '@/lib/wordpress-graphql';
import { apolloClient } from '@/lib/apollo-client';

describe('GraphQL WordPress API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('should fetch posts successfully', async () => {
      const mockPostsResponse = {
        data: {
          posts: {
            edges: [
              {
                node: {
                  id: 'post:1',
                  databaseId: 1,
                  title: 'Test Post 1',
                  slug: 'test-post-1',
                  date: '2024-01-01T00:00:00',
                  modified: '2024-01-01T00:00:00',
                  content: 'Test content 1',
                  excerpt: 'Test excerpt 1',
                  status: 'publish',
                  link: 'https://example.com/test-post-1',
                  author: {
                    node: {
                      id: 'user:1',
                      databaseId: 1,
                      name: 'Test Author',
                      slug: 'test-author',
                      description: 'Test author description',
                      avatar: { url: 'https://example.com/avatar.jpg' },
                    },
                  },
                  featuredImage: {
                    node: {
                      id: 'media:1',
                      databaseId: 1,
                      sourceUrl: 'https://example.com/image.jpg',
                      title: 'Test Image',
                      altText: 'Test alt text',
                      mediaType: 'image',
                      mimeType: 'image/jpeg',
                    },
                  },
                  categories: { edges: [] },
                  tags: { edges: [] },
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
          },
        },
      };

      (apolloClient.query as jest.Mock).mockResolvedValue(mockPostsResponse);

      const result = await graphqlWordPressAPI.getPosts({ per_page: 10 });

      expect(apolloClient.query).toHaveBeenCalledWith({
        query: 'GET_POSTS',
        variables: { first: 10 },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        title: { rendered: 'Test Post 1' },
        slug: 'test-post-1',
      });
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('GraphQL error');
      (apolloClient.query as jest.Mock).mockRejectedValue(error);

      await expect(graphqlWordPressAPI.getPosts()).rejects.toThrow('GraphQL error');
    });
  });

  describe('getPost', () => {
    it('should fetch a single post by slug', async () => {
      const mockPostResponse = {
        data: {
          post: {
            id: 'post:1',
            databaseId: 1,
            title: 'Test Post',
            slug: 'test-post',
            date: '2024-01-01T00:00:00',
            modified: '2024-01-01T00:00:00',
            content: 'Test content',
            excerpt: 'Test excerpt',
            status: 'publish',
            link: 'https://example.com/test-post',
            author: {
              node: {
                id: 'user:1',
                databaseId: 1,
                name: 'Test Author',
                slug: 'test-author',
                description: 'Test author description',
                avatar: { url: 'https://example.com/avatar.jpg' },
              },
            },
            featuredImage: null,
            categories: { edges: [] },
            tags: { edges: [] },
          },
        },
      };

      (apolloClient.query as jest.Mock).mockResolvedValue(mockPostResponse);

      const result = await graphqlWordPressAPI.getPost('test-post');

      expect(apolloClient.query).toHaveBeenCalledWith({
        query: 'GET_POST',
        variables: { slug: 'test-post' },
      });
      expect(result).toMatchObject({
        id: 1,
        title: { rendered: 'Test Post' },
        slug: 'test-post',
      });
    });

    it('should throw error when post not found', async () => {
      const mockPostResponse = {
        data: {
          post: null,
        },
      };

      (apolloClient.query as jest.Mock).mockResolvedValue(mockPostResponse);

      await expect(graphqlWordPressAPI.getPost('non-existent-post')).rejects.toThrow(
        'Post with slug "non-existent-post" not found'
      );
    });
  });

  describe('getCategories', () => {
    it('should fetch categories successfully', async () => {
      const mockCategoriesResponse = {
        data: {
          categories: {
            edges: [
              {
                node: {
                  id: 'category:1',
                  databaseId: 1,
                  name: 'Test Category',
                  slug: 'test-category',
                  description: 'Test category description',
                  parentId: 0,
                  count: 5,
                },
              },
            ],
          },
        },
      };

      (apolloClient.query as jest.Mock).mockResolvedValue(mockCategoriesResponse);

      const result = await graphqlWordPressAPI.getCategories();

      expect(apolloClient.query).toHaveBeenCalledWith({
        query: 'GET_CATEGORIES',
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'Test Category',
        slug: 'test-category',
      });
    });
  });

  describe('search', () => {
    it('should search posts successfully', async () => {
      const mockSearchResponse = {
        data: {
          posts: {
            edges: [
              {
                node: {
                  id: 'post:1',
                  databaseId: 1,
                  title: 'Search Result Post',
                  slug: 'search-result-post',
                  date: '2024-01-01T00:00:00',
                  modified: '2024-01-01T00:00:00',
                  content: 'Search result content',
                  excerpt: 'Search result excerpt',
                  status: 'publish',
                  link: 'https://example.com/search-result-post',
                  author: {
                    node: {
                      id: 'user:1',
                      databaseId: 1,
                      name: 'Test Author',
                      slug: 'test-author',
                      description: 'Test author description',
                      avatar: { url: 'https://example.com/avatar.jpg' },
                    },
                  },
                  featuredImage: {
                    node: {
                      id: 'media:1',
                      databaseId: 1,
                      sourceUrl: 'https://example.com/image.jpg',
                      title: 'Search Image',
                      altText: 'Search image',
                      mediaType: 'image',
                      mimeType: 'image/jpeg',
                    },
                  },
                  categories: { edges: [] },
                  tags: { edges: [] },
                },
              },
            ],
          },
        },
      };

      (apolloClient.query as jest.Mock).mockResolvedValue(mockSearchResponse);

      const result = await graphqlWordPressAPI.search('search query');

      expect(apolloClient.query).toHaveBeenCalledWith({
        query: 'SEARCH_POSTS',
        variables: { search: 'search query' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        title: { rendered: 'Search Result Post' },
      });
    });
  });
});