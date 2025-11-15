import { apolloClient } from './apollo-client';
import {
  GET_POSTS,
  GET_POST,
  GET_POST_BY_ID,
  GET_CATEGORIES,
  GET_CATEGORY,
  GET_TAGS,
  GET_TAG,
  SEARCH_POSTS,
} from './graphql-queries';
import {
  GraphQLPostsResponse,
  GraphQLPostResponse,
  GraphQLCategoriesResponse,
  GraphQLCategoryResponse,
  GraphQLTagsResponse,
  GraphQLTagResponse,
  GraphQLSearchResponse,
  GetPostsVariables,
  GetPostVariables,
  GetPostByIdVariables,
  GetCategoryVariables,
  GetTagVariables,
  SearchPostsVariables,
  graphQLPostToWordPressPost,
  graphQLCategoryToWordPressCategory,
  graphQLTagToWordPressTag,
  graphQLMediaToWordPressMedia,
  graphQLAuthorToWordPressAuthor,
} from '@/types/graphql';
import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';

export const graphqlWordPressAPI = {
  // Posts
  getPosts: async (params?: {
    page?: number;
    per_page?: number;
    category?: number;
    tag?: number;
    search?: string;
  }): Promise<WordPressPost[]> => {
    const variables: GetPostsVariables = {
      first: params?.per_page || 10,
      category: params?.category,
      tag: params?.tag,
      search: params?.search,
    };

    // Handle pagination
    if (params?.page && params.page > 1) {
      // For simplicity, we'll fetch all posts and paginate on the client
      // In a production app, you'd want to implement proper cursor-based pagination
      variables.first = (params.page || 1) * (params.per_page || 10);
    }

    try {
      const { data } = await apolloClient.query<GraphQLPostsResponse>({
        query: GET_POSTS,
        variables,
      });

      if (!data?.posts?.edges) {
        throw new Error('Invalid response data structure');
      }

      const posts = data.posts.edges.map(edge => graphQLPostToWordPressPost(edge.node));
      
      // Client-side pagination for pages > 1
      if (params?.page && params.page > 1) {
        const startIndex = (params.page - 1) * (params.per_page || 10);
        return posts.slice(startIndex, startIndex + (params.per_page || 10));
      }

      return posts;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  getPost: async (slug: string): Promise<WordPressPost> => {
    try {
      const { data } = await apolloClient.query<GraphQLPostResponse>({
        query: GET_POST,
        variables: { slug },
      });

      if (!data?.post) {
        throw new Error(`Post with slug "${slug}" not found`);
      }

      return graphQLPostToWordPressPost(data.post);
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  getPostById: async (id: number): Promise<WordPressPost> => {
    try {
      const { data } = await apolloClient.query<GraphQLPostResponse>({
        query: GET_POST_BY_ID,
        variables: { id },
      });

      if (!data?.post) {
        throw new Error(`Post with ID "${id}" not found`);
      }

      return graphQLPostToWordPressPost(data.post);
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      throw error;
    }
  },

  // Categories
  getCategories: async (): Promise<WordPressCategory[]> => {
    try {
      const { data } = await apolloClient.query<GraphQLCategoriesResponse>({
        query: GET_CATEGORIES,
      });

      if (!data?.categories?.edges) {
        throw new Error('Invalid categories response data');
      }

      return data.categories.edges.map(edge => graphQLCategoryToWordPressCategory(edge.node));
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  getCategory: async (slug: string): Promise<WordPressCategory> => {
    try {
      const { data } = await apolloClient.query<GraphQLCategoryResponse>({
        query: GET_CATEGORY,
        variables: { slug },
      });

      if (!data?.category) {
        throw new Error(`Category with slug "${slug}" not found`);
      }

      return graphQLCategoryToWordPressCategory(data.category);
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  },

  // Tags
  getTags: async (): Promise<WordPressTag[]> => {
    try {
      const { data } = await apolloClient.query<GraphQLTagsResponse>({
        query: GET_TAGS,
      });

      if (!data?.tags?.edges) {
        throw new Error('Invalid tags response data');
      }

      return data.tags.edges.map(edge => graphQLTagToWordPressTag(edge.node));
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  },

  getTag: async (slug: string): Promise<WordPressTag> => {
    try {
      const { data } = await apolloClient.query<GraphQLTagResponse>({
        query: GET_TAG,
        variables: { slug },
      });

      if (!data?.tag) {
        throw new Error(`Tag with slug "${slug}" not found`);
      }

      return graphQLTagToWordPressTag(data.tag);
    } catch (error) {
      console.error('Error fetching tag:', error);
      throw error;
    }
  },

  // Media
  getMedia: async (id: number): Promise<WordPressMedia> => {
    try {
      // For media, we'll need to fetch it through a post that uses it
      // or create a specific media query. For now, let's create a basic media object.
      // In a real implementation, you'd want a proper media query.
      const { data } = await apolloClient.query<GraphQLPostResponse>({
        query: GET_POST_BY_ID,
        variables: { id },
      });

      if (!data?.post?.featuredImage?.node) {
        throw new Error(`Media with ID "${id}" not found`);
      }

      return graphQLMediaToWordPressMedia(data.post.featuredImage.node);
    } catch (error) {
      console.error('Error fetching media:', error);
      throw error;
    }
  },

  // Authors
  getAuthor: async (id: number): Promise<WordPressAuthor> => {
    try {
      // Similar to media, we'll fetch author through a post
      const { data } = await apolloClient.query<GraphQLPostResponse>({
        query: GET_POST_BY_ID,
        variables: { id },
      });

      if (!data?.post?.author?.node) {
        throw new Error(`Author with ID "${id}" not found`);
      }

      return graphQLAuthorToWordPressAuthor(data.post.author.node);
    } catch (error) {
      console.error('Error fetching author:', error);
      throw error;
    }
  },

  // Search
  search: async (query: string): Promise<WordPressPost[]> => {
    try {
      const { data } = await apolloClient.query<GraphQLSearchResponse>({
        query: SEARCH_POSTS,
        variables: { search: query },
      });

      if (!data?.posts?.edges) {
        throw new Error('Invalid search response data');
      }

      return data.posts.edges.map(edge => graphQLPostToWordPressPost(edge.node));
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  },
};

export default graphqlWordPressAPI;