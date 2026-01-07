import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';
import { apiClient, getApiUrl } from './api/client';

export const wordpressAPI = {
  // Posts
  getPosts: async (params?: {
    page?: number;
    per_page?: number;
    category?: number;
    tag?: number;
    search?: string;
  }, signal?: AbortSignal): Promise<WordPressPost[]> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/posts'), { params, signal });
    return response.data;
  },

  getPost: async (slug: string, signal?: AbortSignal): Promise<WordPressPost> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/posts'), { params: { slug }, signal });
    return response.data[0];
  },

  getPostById: async (id: number, signal?: AbortSignal): Promise<WordPressPost> => {
    const response = await apiClient.get(getApiUrl(`/wp/v2/posts/${id}`), { signal });
    return response.data;
  },

  // Categories
  getCategories: async (signal?: AbortSignal): Promise<WordPressCategory[]> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/categories'), { signal });
    return response.data;
  },

  getCategory: async (slug: string, signal?: AbortSignal): Promise<WordPressCategory> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/categories'), { params: { slug }, signal });
    return response.data[0];
  },

  // Tags
  getTags: async (signal?: AbortSignal): Promise<WordPressTag[]> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/tags'), { signal });
    return response.data;
  },

  getTag: async (slug: string, signal?: AbortSignal): Promise<WordPressTag> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/tags'), { params: { slug }, signal });
    return response.data[0];
  },

  // Media
  getMedia: async (id: number, signal?: AbortSignal): Promise<WordPressMedia> => {
    const response = await apiClient.get(getApiUrl(`/wp/v2/media/${id}`), { signal });
    return response.data;
  },

  // Authors
  getAuthor: async (id: number, signal?: AbortSignal): Promise<WordPressAuthor> => {
    const response = await apiClient.get(getApiUrl(`/wp/v2/users/${id}`), { signal });
    return response.data;
  },

  // Search
  search: async (query: string, signal?: AbortSignal): Promise<WordPressPost[]> => {
    const response = await apiClient.get(getApiUrl('/wp/v2/search'), { params: { search: query }, signal });
    return response.data;
  },
};

export default wordpressAPI;