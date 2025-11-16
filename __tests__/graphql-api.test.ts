import { graphqlAPI } from '@/lib/graphql-client';
import { apolloClient } from '@/lib/apollo';

// Mock Apollo Client
jest.mock('@/lib/apollo', () => ({
  apolloClient: {
    query: jest.fn(),
  },
}));

describe('GraphQL API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have graphqlAPI object', () => {
    expect(graphqlAPI).toBeDefined();
  });

  it('should have required methods', () => {
    expect(typeof graphqlAPI.getPosts).toBe('function');
    expect(typeof graphqlAPI.getPost).toBe('function');
    expect(typeof graphqlAPI.getPostById).toBe('function');
    expect(typeof graphqlAPI.getCategories).toBe('function');
    expect(typeof graphqlAPI.getCategory).toBe('function');
    expect(typeof graphqlAPI.getTags).toBe('function');
    expect(typeof graphqlAPI.getTag).toBe('function');
    expect(typeof graphqlAPI.getMedia).toBe('function');
    expect(typeof graphqlAPI.getAuthor).toBe('function');
    expect(typeof graphqlAPI.search).toBe('function');
  });

  it('should convert GraphQL post data to WordPress format', async () => {
    const mockGraphQLResponse = {
      data: {
        posts: {
          edges: [
            {
              node: {
                id: 'cG9zdDox',
                databaseId: 1,
                title: 'Test Post',
                slug: 'test-post',
                content: '<p>Test content</p>',
                excerpt: '<p>Test excerpt</p>',
                date: '2024-01-01T00:00:00',
                modified: '2024-01-01T00:00:00',
                status: 'publish',
                featuredImage: null,
                author: {
                  node: {
                    id: 'dXNlcjox',
                    databaseId: 1,
                    name: 'Test Author',
                    slug: 'test-author',
                    avatar: { url: 'https://example.com/avatar.jpg' },
                  },
                },
                categories: { nodes: [] },
                tags: { nodes: [] },
              },
            },
          ],
        },
      },
    };

    (apolloClient.query as jest.Mock).mockResolvedValue(mockGraphQLResponse);

    const posts = await graphqlAPI.getPosts({ per_page: 10 });

    expect(apolloClient.query).toHaveBeenCalledWith({
      query: expect.any(Object),
      variables: {
        first: 10,
        where: {},
      },
    });

    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({
      id: 1,
      slug: 'test-post',
      title: { rendered: 'Test Post' },
      content: { rendered: '<p>Test content</p>' },
      excerpt: { rendered: '<p>Test excerpt</p>' },
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      status: 'publish',
      author: 1,
      featured_media: 0,
      categories: [],
      tags: [],
    });
  });

  it('should handle pagination correctly', async () => {
    const mockGraphQLResponse = {
      data: {
        posts: {
          edges: [],
        },
      },
    };

    (apolloClient.query as jest.Mock).mockResolvedValue(mockGraphQLResponse);

    await graphqlAPI.getPosts({ page: 2, per_page: 10 });

    expect(apolloClient.query).toHaveBeenCalledWith({
      query: expect.any(Object),
      variables: {
        first: 10,
        after: 'YXJyYXljb25uZWN0aW9uOjEw',
        where: {},
      },
    });
  });

  it('should handle category filtering', async () => {
    const mockGraphQLResponse = {
      data: {
        posts: {
          edges: [],
        },
      },
    };

    (apolloClient.query as jest.Mock).mockResolvedValue(mockGraphQLResponse);

    await graphqlAPI.getPosts({ category: 5, per_page: 10 });

    expect(apolloClient.query).toHaveBeenCalledWith({
      query: expect.any(Object),
      variables: {
        first: 10,
        where: {
          categoryIn: [5],
        },
      },
    });
  });

  it('should handle search functionality', async () => {
    const mockGraphQLResponse = {
      data: {
        posts: {
          edges: [],
        },
      },
    };

    (apolloClient.query as jest.Mock).mockResolvedValue(mockGraphQLResponse);

    await graphqlAPI.search('test query');

    expect(apolloClient.query).toHaveBeenCalledWith({
      query: expect.any(Object),
      variables: {
        search: 'test query',
      },
    });
  });

  it('should get single post by slug', async () => {
    const mockGraphQLResponse = {
      data: {
        post: {
          id: 'cG9zdDox',
          databaseId: 1,
          title: 'Test Post',
          slug: 'test-post',
          content: '<p>Test content</p>',
          excerpt: '<p>Test excerpt</p>',
          date: '2024-01-01T00:00:00',
          modified: '2024-01-01T00:00:00',
          status: 'publish',
          featuredImage: null,
          author: {
            node: {
              id: 'dXNlcjox',
              databaseId: 1,
              name: 'Test Author',
              slug: 'test-author',
              avatar: { url: 'https://example.com/avatar.jpg' },
            },
          },
          categories: { nodes: [] },
          tags: { nodes: [] },
        },
      },
    };

    (apolloClient.query as jest.Mock).mockResolvedValue(mockGraphQLResponse);

    const post = await graphqlAPI.getPost('test-post');

    expect(apolloClient.query).toHaveBeenCalledWith({
      query: expect.any(Object),
      variables: {
        slug: 'test-post',
      },
    });

    expect(post).toMatchObject({
      id: 1,
      slug: 'test-post',
      title: { rendered: 'Test Post' },
    });
  });

  it('should get categories', async () => {
    const mockGraphQLResponse = {
      data: {
        categories: {
          edges: [
            {
              node: {
                id: 'Y2F0ZWdvcnk6MQ==',
                databaseId: 1,
                name: 'Test Category',
                slug: 'test-category',
                description: 'Test description',
                count: 5,
              },
            },
          ],
        },
      },
    };

    (apolloClient.query as jest.Mock).mockResolvedValue(mockGraphQLResponse);

    const categories = await graphqlAPI.getCategories();

    expect(apolloClient.query).toHaveBeenCalledWith({
      query: expect.any(Object),
      variables: {
        first: 100,
      },
    });

    expect(categories).toHaveLength(1);
    expect(categories[0]).toMatchObject({
      id: 1,
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test description',
      count: 5,
    });
  });

  it('should handle API errors gracefully', async () => {
    (apolloClient.query as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(graphqlAPI.getPosts()).rejects.toThrow('Network error');
  });
});