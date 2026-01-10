import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';
import { wordpressAPI } from '../wordpress';
import {
  ApiResult,
  ApiListResult,
  ApiPaginationMetadata,
  createSuccessResult,
  createErrorResult,
  createSuccessListResult
} from './response';
import { createApiError } from './errors';
import { DEFAULT_PER_PAGE } from './config';

function createErrorListResult(
  endpoint: string,
  metadataOptions?: { cacheHit?: boolean },
  paginationOverride?: Partial<ApiPaginationMetadata>,
  caughtError?: unknown
): ApiListResult<never> {
  return {
    data: [],
    error: createApiError(caughtError || new Error('API error'), endpoint),
    metadata: {
      timestamp: new Date().toISOString(),
      endpoint,
      ...metadataOptions
    },
    pagination: {
      page: 1,
      perPage: paginationOverride?.perPage ?? DEFAULT_PER_PAGE,
      total: 0,
      totalPages: 0
    }
  };
}

export interface PostQueryParams {
  page?: number;
  per_page?: number;
  category?: number;
  tag?: number;
  search?: string;
}

export async function getPostById(id: number): Promise<ApiResult<WordPressPost>> {
  try {
    const post = await wordpressAPI.getPostById(id);
    return createSuccessResult(post, { endpoint: `/wp/v2/posts/${id}` });
  } catch (error) {
    const apiError = createApiError(error, `/wp/v2/posts/${id}`);
    return createErrorResult(apiError, { endpoint: `/wp/v2/posts/${id}` });
  }
}

export async function getPostBySlug(slug: string): Promise<ApiResult<WordPressPost>> {
  try {
    const post = await wordpressAPI.getPost(slug);
    if (!post) {
      const notFoundError = createApiError(
        new Error(`Post not found: ${slug}`),
        `/wp/v2/posts?slug=${slug}`
      );
      return createErrorResult(notFoundError, { endpoint: `/wp/v2/posts?slug=${slug}` });
    }
    return createSuccessResult(post, { endpoint: `/wp/v2/posts?slug=${slug}` });
  } catch (error) {
    const apiError = createApiError(error, `/wp/v2/posts?slug=${slug}`);
    return createErrorResult(apiError, { endpoint: `/wp/v2/posts?slug=${slug}` });
  }
}

export async function getAllPosts(
  params?: PostQueryParams
): Promise<ApiListResult<WordPressPost>> {
  try {
    const posts = await wordpressAPI.getPosts(params);
    const pagination: ApiPaginationMetadata = {
      page: params?.page || 1,
      perPage: params?.per_page || DEFAULT_PER_PAGE,
      total: posts.length,
      totalPages: Math.ceil(posts.length / (params?.per_page || DEFAULT_PER_PAGE))
    };
    return createSuccessListResult(
      posts,
      { endpoint: '/wp/v2/posts' },
      pagination
    );
  } catch (error) {
    return createErrorListResult('/wp/v2/posts', undefined, undefined, error);
  }
}

export async function searchPosts(query: string): Promise<ApiListResult<WordPressPost>> {
  try {
    const posts = await wordpressAPI.search(query);
    const pagination: ApiPaginationMetadata = {
      page: 1,
      perPage: posts.length,
      total: posts.length,
      totalPages: 1
    };
    return createSuccessListResult(
      posts,
      { endpoint: '/wp/v2/search', cacheHit: false },
      pagination
    );
  } catch (error) {
    return createErrorListResult('/wp/v2/search', { cacheHit: false }, { perPage: 0 }, error);
  }
}

export async function getCategoryById(id: number): Promise<ApiResult<WordPressCategory>> {
  try {
    const category = await wordpressAPI.getCategory(id.toString());
    if (!category) {
      const notFoundError = createApiError(
        new Error(`Category not found: ${id}`),
        `/wp/v2/categories/${id}`
      );
      return createErrorResult(notFoundError, { endpoint: `/wp/v2/categories/${id}` });
    }
    return createSuccessResult(category, { endpoint: `/wp/v2/categories/${id}` });
  } catch (error) {
    const apiError = createApiError(error, `/wp/v2/categories/${id}`);
    return createErrorResult(apiError, { endpoint: `/wp/v2/categories/${id}` });
  }
}

export async function getCategoryBySlug(slug: string): Promise<ApiResult<WordPressCategory>> {
  try {
    const category = await wordpressAPI.getCategory(slug);
    if (!category) {
      const notFoundError = createApiError(
        new Error(`Category not found: ${slug}`),
        `/wp/v2/categories?slug=${slug}`
      );
      return createErrorResult(notFoundError, { endpoint: `/wp/v2/categories?slug=${slug}` });
    }
    return createSuccessResult(category, { endpoint: `/wp/v2/categories?slug=${slug}` });
  } catch (error) {
    const apiError = createApiError(error, `/wp/v2/categories?slug=${slug}`);
    return createErrorResult(apiError, { endpoint: `/wp/v2/categories?slug=${slug}` });
  }
}

export async function getAllCategories(): Promise<ApiListResult<WordPressCategory>> {
  try {
    const categories = await wordpressAPI.getCategories();
    const pagination: ApiPaginationMetadata = {
      page: 1,
      perPage: categories.length,
      total: categories.length,
      totalPages: 1
    };
    return createSuccessListResult(
      categories,
      { endpoint: '/wp/v2/categories' },
      pagination
    );
  } catch (error) {
    return createErrorListResult('/wp/v2/categories', undefined, undefined, error);
  }
}

export async function getTagById(id: number): Promise<ApiResult<WordPressTag>> {
  try {
    const tag = await wordpressAPI.getTag(id.toString());
    if (!tag) {
      const notFoundError = createApiError(
        new Error(`Tag not found: ${id}`),
        `/wp/v2/tags/${id}`
      );
      return createErrorResult(notFoundError, { endpoint: `/wp/v2/tags/${id}` });
    }
    return createSuccessResult(tag, { endpoint: `/wp/v2/tags/${id}` });
  } catch (error) {
    const apiError = createApiError(error, `/wp/v2/tags/${id}`);
    return createErrorResult(apiError, { endpoint: `/wp/v2/tags/${id}` });
  }
}

export async function getTagBySlug(slug: string): Promise<ApiResult<WordPressTag>> {
  try {
    const tag = await wordpressAPI.getTag(slug);
    if (!tag) {
      const notFoundError = createApiError(
        new Error(`Tag not found: ${slug}`),
        `/wp/v2/tags?slug=${slug}`
      );
      return createErrorResult(notFoundError, { endpoint: `/wp/v2/tags?slug=${slug}` });
    }
    return createSuccessResult(tag, { endpoint: `/wp/v2/tags?slug=${slug}` });
  } catch (error) {
    const apiError = createApiError(error, `/wp/v2/tags?slug=${slug}`);
    return createErrorResult(apiError, { endpoint: `/wp/v2/tags?slug=${slug}` });
  }
}

export async function getAllTags(): Promise<ApiListResult<WordPressTag>> {
  try {
    const tags = await wordpressAPI.getTags();
    const pagination: ApiPaginationMetadata = {
      page: 1,
      perPage: tags.length,
      total: tags.length,
      totalPages: 1
    };
    return createSuccessListResult(
      tags,
      { endpoint: '/wp/v2/tags' },
      pagination
    );
  } catch (error) {
    return createErrorListResult('/wp/v2/tags', undefined, undefined, error);
  }
}

export async function getMediaById(id: number): Promise<ApiResult<WordPressMedia>> {
  try {
    const media = await wordpressAPI.getMedia(id);
    return createSuccessResult(media, { endpoint: `/wp/v2/media/${id}` });
  } catch (error) {
    const apiError = createApiError(error, `/wp/v2/media/${id}`);
    return createErrorResult(apiError, { endpoint: `/wp/v2/media/${id}` });
  }
}

export async function getAuthorById(id: number): Promise<ApiResult<WordPressAuthor>> {
  try {
    const author = await wordpressAPI.getAuthor(id);
    return createSuccessResult(author, { endpoint: `/wp/v2/users/${id}` });
  } catch (error) {
    const apiError = createApiError(error, `/wp/v2/users/${id}`);
    return createErrorResult(apiError, { endpoint: `/wp/v2/users/${id}` });
  }
}

export const standardizedAPI = {
  getPostById,
  getPostBySlug,
  getAllPosts,
  searchPosts,
  getCategoryById,
  getCategoryBySlug,
  getAllCategories,
  getTagById,
  getTagBySlug,
  getAllTags,
  getMediaById,
  getAuthorById
};
