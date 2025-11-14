import axios from 'axios';
import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://www.mitrabantennews.com/wp-json';

const api = axios.create({
  baseURL: WORDPRESS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const wordpressAPI = {
  // Posts
  getPosts: async (params?: {
    page?: number;
    per_page?: number;
    category?: number;
    tag?: number;
    search?: string;
  }): Promise<WordPressPost[]> => {
    const response = await api.get('/wp/v2/posts', { params });
    return response.data;
  },

  getPost: async (slug: string): Promise<WordPressPost> => {
    const response = await api.get(`/wp/v2/posts`, { params: { slug } });
    return response.data[0];
  },

  getPostById: async (id: number): Promise<WordPressPost> => {
    const response = await api.get(`/wp/v2/posts/${id}`);
    return response.data;
  },

  // Categories
  getCategories: async (): Promise<WordPressCategory[]> => {
    const response = await api.get('/wp/v2/categories');
    return response.data;
  },

  getCategory: async (slug: string): Promise<WordPressCategory> => {
    const response = await api.get(`/wp/v2/categories`, { params: { slug } });
    return response.data[0];
  },

  // Tags
  getTags: async (): Promise<WordPressTag[]> => {
    const response = await api.get('/wp/v2/tags');
    return response.data;
  },

  getTag: async (slug: string): Promise<WordPressTag> => {
    const response = await api.get(`/wp/v2/tags`, { params: { slug } });
    return response.data[0];
  },

  // Media
  getMedia: async (id: number): Promise<WordPressMedia> => {
    const response = await api.get(`/wp/v2/media/${id}`);
    return response.data;
  },

  // Authors
  getAuthor: async (id: number): Promise<WordPressAuthor> => {
    const response = await api.get(`/wp/v2/users/${id}`);
    return response.data;
  },

  // Search
  search: async (query: string): Promise<WordPressPost[]> => {
    const response = await api.get('/wp/v2/search', { params: { search: query } });
    return response.data;
  },
};

export default wordpressAPI;