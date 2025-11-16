import { graphqlClient } from './graphql';
import {
  GET_POSTS,
  GET_POST_BY_SLUG,
  GET_POST_BY_ID,
  GET_CATEGORIES,
  GET_CATEGORY_BY_SLUG,
  GET_TAGS,
  GET_TAG_BY_SLUG,
  GET_AUTHOR_BY_ID,
  GET_MEDIA_BY_ID,
  SEARCH_POSTS,
  GET_MENU_DATA,
  GET_GENERAL_SETTINGS,
} from './graphql-queries';
import type {
  WordPressPost,
  WordPressCategory,
  WordPressTag,
  WordPressMedia,
  WordPressAuthor,
} from '@/types/wordpress';
import {
  normalizePost,
  normalizeCategory,
  normalizeTag,
  normalizeMedia,
  normalizeAuthor,
} from './data-normalization';

// GraphQL Response Types
interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

interface PostEdge {
  node: WordPressPost;
}

interface CategoryEdge {
  node: WordPressCategory;
}

interface TagEdge {
  node: WordPressTag;
}

interface PostsResponse {
  posts: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
    };
    edges: PostEdge[];
  };
}

interface PostResponse {
  post: WordPressPost;
}

interface CategoriesResponse {
  categories: {
    edges: CategoryEdge[];
  };
}

interface CategoryResponse {
  category: WordPressCategory;
}

interface TagsResponse {
  tags: {
    edges: TagEdge[];
  };
}

interface TagResponse {
  tag: WordPressTag;
}

interface AuthorResponse {
  user: WordPressAuthor;
}

interface MediaResponse {
  mediaItem: WordPressMedia;
}

interface SearchResponse {
  posts: {
    edges: PostEdge[];
  };
}

// Helper function to handle GraphQL errors
const handleGraphQLError = <T>(response: GraphQLResponse<T>): T => {
  if (response.errors) {
    const errorMessages = response.errors.map(err => err.message).join(', ');
    throw new Error(`GraphQL Error: ${errorMessages}`);
  }
  if (!response.data) {
    throw new Error('GraphQL Error: No data returned');
  }
  return response.data;
};

// GraphQL API Service
export const graphqlAPI = {
  // Posts
  getPosts: async (params?: {
    first?: number;
    after?: string;
    category?: string;
    tag?: string;
    search?: string;
  }): Promise<{ posts: WordPressPost[]; hasNextPage: boolean; endCursor?: string }> => {
    try {
      const response = await graphqlClient.query<PostsResponse>({
        query: GET_POSTS,
        variables: {
          first: params?.first || 10,
          after: params?.after,
          category: params?.category,
          tag: params?.tag,
          search: params?.search,
        },
      });

      const data = handleGraphQLError(response);
      if (!data || !data.posts) {
        throw new Error('GraphQL Error: No posts data returned');
      }
      return {
        posts: data.posts.edges.map(edge => normalizePost(edge.node)),
        hasNextPage: data.posts.pageInfo.hasNextPage,
        endCursor: data.posts.pageInfo.endCursor,
      };
    } catch (error) {
      console.error('GraphQL getPosts error:', error);
      throw error;
    }
  },

  getPost: async (slug: string): Promise<WordPressPost> => {
    try {
      const response = await graphqlClient.query<PostResponse>({
        query: GET_POST_BY_SLUG,
        variables: { slug },
      });

      const data = handleGraphQLError(response);
      if (!data || !data.post) {
        throw new Error('GraphQL Error: No post data returned');
      }
      return normalizePost(data.post);
    } catch (error) {
      console.error('GraphQL getPost error:', error);
      throw error;
    }
  },

  getPostById: async (id: number): Promise<WordPressPost> => {
    try {
      const response = await graphqlClient.query<PostResponse>({
        query: GET_POST_BY_ID,
        variables: { id: id.toString() },
      });

      const data = handleGraphQLError(response);
      if (!data || !data.post) {
        throw new Error('GraphQL Error: No post data returned');
      }
      return normalizePost(data.post);
    } catch (error) {
      console.error('GraphQL getPostById error:', error);
      throw error;
    }
  },

  // Categories
  getCategories: async (): Promise<WordPressCategory[]> => {
    try {
      const response = await graphqlClient.query<CategoriesResponse>({
        query: GET_CATEGORIES,
      });

      const data = handleGraphQLError(response);
      if (!data || !data.categories) {
        throw new Error('GraphQL Error: No categories data returned');
      }
      return data.categories.edges.map(edge => normalizeCategory(edge.node));
    } catch (error) {
      console.error('GraphQL getCategories error:', error);
      throw error;
    }
  },

  getCategory: async (slug: string): Promise<WordPressCategory> => {
    try {
      const response = await graphqlClient.query<CategoryResponse>({
        query: GET_CATEGORY_BY_SLUG,
        variables: { slug },
      });

      const data = handleGraphQLError(response);
      if (!data || !data.category) {
        throw new Error('GraphQL Error: No category data returned');
      }
      return normalizeCategory(data.category);
    } catch (error) {
      console.error('GraphQL getCategory error:', error);
      throw error;
    }
  },

  // Tags
  getTags: async (): Promise<WordPressTag[]> => {
    try {
      const response = await graphqlClient.query<TagsResponse>({
        query: GET_TAGS,
      });

      const data = handleGraphQLError(response);
      if (!data || !data.tags) {
        throw new Error('GraphQL Error: No tags data returned');
      }
      return data.tags.edges.map(edge => normalizeTag(edge.node));
    } catch (error) {
      console.error('GraphQL getTags error:', error);
      throw error;
    }
  },

  getTag: async (slug: string): Promise<WordPressTag> => {
    try {
      const response = await graphqlClient.query<TagResponse>({
        query: GET_TAG_BY_SLUG,
        variables: { slug },
      });

      const data = handleGraphQLError(response);
      if (!data || !data.tag) {
        throw new Error('GraphQL Error: No tag data returned');
      }
      return normalizeTag(data.tag);
    } catch (error) {
      console.error('GraphQL getTag error:', error);
      throw error;
    }
  },

  // Media
  getMedia: async (id: number): Promise<WordPressMedia> => {
    try {
      const response = await graphqlClient.query<MediaResponse>({
        query: GET_MEDIA_BY_ID,
        variables: { id: id.toString() },
      });

      const data = handleGraphQLError(response);
      if (!data || !data.mediaItem) {
        throw new Error('GraphQL Error: No media data returned');
      }
      return normalizeMedia(data.mediaItem);
    } catch (error) {
      console.error('GraphQL getMedia error:', error);
      throw error;
    }
  },

  // Authors
  getAuthor: async (id: number): Promise<WordPressAuthor> => {
    try {
      const response = await graphqlClient.query<AuthorResponse>({
        query: GET_AUTHOR_BY_ID,
        variables: { id: id.toString() },
      });

      const data = handleGraphQLError(response);
      if (!data || !data.user) {
        throw new Error('GraphQL Error: No user data returned');
      }
      return normalizeAuthor(data.user);
    } catch (error) {
      console.error('GraphQL getAuthor error:', error);
      throw error;
    }
  },

  // Search
  search: async (query: string): Promise<WordPressPost[]> => {
    try {
      const response = await graphqlClient.query<SearchResponse>({
        query: SEARCH_POSTS,
        variables: { search: query },
      });

      const data = handleGraphQLError(response);
      if (!data || !data.posts) {
        throw new Error('GraphQL Error: No search results data returned');
      }
      return data.posts.edges.map(edge => normalizePost(edge.node));
    } catch (error) {
      console.error('GraphQL search error:', error);
      throw error;
    }
  },

  // Menu and Settings (for theme integration)
  getMenu: async (location: string): Promise<any> => {
    try {
      const response = await graphqlClient.query<any>({
        query: GET_MENU_DATA,
        variables: { location },
      });

      const data = handleGraphQLError(response);
      if (!data || !data.menuItems) {
        throw new Error('GraphQL Error: No menu data returned');
      }
      return data.menuItems;
    } catch (error) {
      console.error('GraphQL getMenu error:', error);
      throw error;
    }
  },

  getGeneralSettings: async (): Promise<any> => {
    try {
      const response = await graphqlClient.query<any>({
        query: GET_GENERAL_SETTINGS,
      });

      const data = handleGraphQLError(response);
      if (!data || !data.generalSettings) {
        throw new Error('GraphQL Error: No settings data returned');
      }
      return data.generalSettings;
    } catch (error) {
      console.error('GraphQL getGeneralSettings error:', error);
      throw error;
    }
  },
};

export default graphqlAPI;