import { apolloClient } from './apollo';
import {
  GET_POSTS,
  GET_POST_BY_SLUG,
  GET_POST_BY_ID,
  GET_CATEGORIES,
  GET_CATEGORY_BY_SLUG,
  GET_TAGS,
  GET_TAG_BY_SLUG,
  GET_MEDIA_ITEM,
  GET_AUTHOR,
  SEARCH_POSTS,
} from './graphql/queries';
import {
  GetPostsResponse,
  GetPostBySlugResponse,
  GetPostByIdResponse,
  GetCategoriesResponse,
  GetCategoryBySlugResponse,
  GetTagsResponse,
  GetTagBySlugResponse,
  GetMediaItemResponse,
  GetAuthorResponse,
  SearchPostsResponse,
  GetPostsVariables,
  GetPostBySlugVariables,
  GetPostByIdVariables,
  GetCategoriesVariables,
  GetCategoryBySlugVariables,
  GetTagsVariables,
  GetTagBySlugVariables,
  GetMediaItemVariables,
  GetAuthorVariables,
  SearchPostsVariables,
  Post,
  Category,
  Tag,
  MediaItem,
  User,
} from './graphql/types';
import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';

// Convert GraphQL types to match existing WordPress types for compatibility
const convertPost = (post: Post): WordPressPost => ({
  id: post.databaseId,
  slug: post.slug,
  title: {
    rendered: post.title,
  },
  content: {
    rendered: post.content,
  },
  excerpt: {
    rendered: post.excerpt,
  },
  date: post.date,
  modified: post.modified,
  status: post.status,
  featured_media: post.featuredImage?.node.databaseId || 0,
  author: post.author.node.databaseId,
  categories: post.categories.nodes.map(cat => cat.databaseId),
  tags: post.tags.nodes.map(tag => tag.databaseId),
  type: 'post',
  link: `${process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://mitrabantennews.com'}/${post.slug}`,
});

const convertCategory = (category: Category): WordPressCategory => ({
  id: category.databaseId,
  slug: category.slug,
  name: category.name,
  description: category.description || '',
  count: category.count,
  parent: 0,
  link: `${process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://mitrabantennews.com'}/category/${category.slug}`,
});

const convertTag = (tag: Tag): WordPressTag => ({
  id: tag.databaseId,
  slug: tag.slug,
  name: tag.name,
  description: tag.description || '',
  count: tag.count,
  link: `${process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://mitrabantennews.com'}/tag/${tag.slug}`,
});

const convertMediaItem = (media: MediaItem): WordPressMedia => ({
  id: media.databaseId,
  source_url: media.sourceUrl,
  title: {
    rendered: media.altText || '',
  },
  alt_text: media.altText || '',
  media_type: media.mediaType,
  mime_type: media.mimeType,
});

const convertUser = (user: User): WordPressAuthor => ({
  id: user.databaseId,
  slug: user.slug,
  name: user.name,
  description: user.description || '',
  avatar_urls: {
    '24': user.avatar.url,
    '48': user.avatar.url,
    '96': user.avatar.url,
  },
  link: `${process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://mitrabantennews.com'}/author/${user.slug}`,
});

export const graphqlAPI = {
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
      where: {},
    };

    if (params?.page && params.page > 1) {
      variables.after = btoa(`arrayconnection:${(params.page - 1) * (params.per_page || 10)}`);
    }

    if (params?.category) {
      variables.where!.categoryIn = [params.category];
    }

    if (params?.tag) {
      variables.where!.tagIn = [params.tag];
    }

    if (params?.search) {
      variables.where!.search = params.search;
    }

    const response = await apolloClient.query<GetPostsResponse>({
      query: GET_POSTS,
      variables,
    });

    if (!response.data?.posts) {
      throw new Error('Failed to fetch posts');
    }

    return response.data.posts.edges.map(edge => convertPost(edge.node));
  },

  getPost: async (slug: string): Promise<WordPressPost> => {
    const response = await apolloClient.query<GetPostBySlugResponse>({
      query: GET_POST_BY_SLUG,
      variables: { slug },
    });

    if (!response.data?.post) {
      throw new Error(`Post with slug "${slug}" not found`);
    }

    return convertPost(response.data.post);
  },

  getPostById: async (id: number): Promise<WordPressPost> => {
    const response = await apolloClient.query<GetPostByIdResponse>({
      query: GET_POST_BY_ID,
      variables: { id },
    });

    if (!response.data?.post) {
      throw new Error(`Post with ID "${id}" not found`);
    }

    return convertPost(response.data.post);
  },

  // Categories
  getCategories: async (): Promise<WordPressCategory[]> => {
    const response = await apolloClient.query<GetCategoriesResponse>({
      query: GET_CATEGORIES,
      variables: { first: 100 },
    });

    if (!response.data?.categories) {
      throw new Error('Failed to fetch categories');
    }

    return response.data.categories.edges.map(edge => convertCategory(edge.node));
  },

  getCategory: async (slug: string): Promise<WordPressCategory> => {
    const response = await apolloClient.query<GetCategoryBySlugResponse>({
      query: GET_CATEGORY_BY_SLUG,
      variables: { slug },
    });

    if (!response.data?.category) {
      throw new Error(`Category with slug "${slug}" not found`);
    }

    return convertCategory(response.data.category);
  },

  // Tags
  getTags: async (): Promise<WordPressTag[]> => {
    const response = await apolloClient.query<GetTagsResponse>({
      query: GET_TAGS,
      variables: { first: 100 },
    });

    if (!response.data?.tags) {
      throw new Error('Failed to fetch tags');
    }

    return response.data.tags.edges.map(edge => convertTag(edge.node));
  },

  getTag: async (slug: string): Promise<WordPressTag> => {
    const response = await apolloClient.query<GetTagBySlugResponse>({
      query: GET_TAG_BY_SLUG,
      variables: { slug },
    });

    if (!response.data?.tag) {
      throw new Error(`Tag with slug "${slug}" not found`);
    }

    return convertTag(response.data.tag);
  },

  // Media
  getMedia: async (id: number): Promise<WordPressMedia> => {
    const response = await apolloClient.query<GetMediaItemResponse>({
      query: GET_MEDIA_ITEM,
      variables: { id },
    });

    if (!response.data?.mediaItem) {
      throw new Error(`Media item with ID "${id}" not found`);
    }

    return convertMediaItem(response.data.mediaItem);
  },

  // Authors
  getAuthor: async (id: number): Promise<WordPressAuthor> => {
    const response = await apolloClient.query<GetAuthorResponse>({
      query: GET_AUTHOR,
      variables: { id },
    });

    if (!response.data?.user) {
      throw new Error(`Author with ID "${id}" not found`);
    }

    return convertUser(response.data.user);
  },

  // Search
  search: async (query: string): Promise<WordPressPost[]> => {
    const response = await apolloClient.query<SearchPostsResponse>({
      query: SEARCH_POSTS,
      variables: { search: query },
    });

    if (!response.data?.posts) {
      throw new Error('Failed to search posts');
    }

    return response.data.posts.edges.map(edge => convertPost(edge.node));
  },
};

export default graphqlAPI;