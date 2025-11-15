import axios from 'axios';
import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://localhost:8080/wp-json';

// Simple in-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCacheKey = (url: string, params?: any): string => {
  return `${url}?${JSON.stringify(params || {})}`;
};

const getCachedData = (key: string): any | null => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  if (cached) {
    apiCache.delete(key);
  }
  return null;
};

const setCachedData = (key: string, data: any, ttl: number = 300000): void => {
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

const api = axios.create({
  baseURL: WORDPRESS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add retry logic for failed requests
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Retry on network errors or 5xx errors
    if (!config._retry && (!error.response || error.response.status >= 500)) {
      config._retry = true;
      config._retryCount = (config._retryCount || 0) + 1;
      
      if (config._retryCount <= 3) {
        // Exponential backoff
        const delay = Math.pow(2, config._retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(config);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to use index.php fallback for REST API
const getApiUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost:8080';
  return `${baseUrl}/index.php?rest_route=${path}`;
};

export const wordpressAPI = {
  // Posts
  getPosts: async (params?: {
    page?: number;
    per_page?: number;
    category?: number;
    tag?: number;
    search?: string;
  }): Promise<WordPressPost[]> => {
    const cacheKey = getCacheKey('/wp/v2/posts', params);
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await api.get(getApiUrl('/wp/v2/posts'), { params });
    const data = response.data;
    setCachedData(cacheKey, data, 300000); // 5 minutes cache
    return data;
  },

  getPost: async (slug: string): Promise<WordPressPost> => {
    const cacheKey = getCacheKey('/wp/v2/posts', { slug });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await api.get(getApiUrl('/wp/v2/posts'), { params: { slug } });
    const data = response.data[0];
    setCachedData(cacheKey, data, 600000); // 10 minutes cache
    return data;
  },

  getPostById: async (id: number): Promise<WordPressPost> => {
    const cacheKey = getCacheKey(`/wp/v2/posts/${id}`);
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await api.get(getApiUrl(`/wp/v2/posts/${id}`));
    const data = response.data;
    setCachedData(cacheKey, data, 600000); // 10 minutes cache
    return data;
  },

  // Categories
  getCategories: async (): Promise<WordPressCategory[]> => {
    const cacheKey = getCacheKey('/wp/v2/categories');
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await api.get(getApiUrl('/wp/v2/categories'));
    const data = response.data;
    setCachedData(cacheKey, data, 1800000); // 30 minutes cache
    return data;
  },

  getCategory: async (slug: string): Promise<WordPressCategory> => {
    const cacheKey = getCacheKey('/wp/v2/categories', { slug });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await api.get(getApiUrl('/wp/v2/categories'), { params: { slug } });
    const data = response.data[0];
    setCachedData(cacheKey, data, 1800000); // 30 minutes cache
    return data;
  },

  // Tags
  getTags: async (): Promise<WordPressTag[]> => {
    const cacheKey = getCacheKey('/wp/v2/tags');
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await api.get(getApiUrl('/wp/v2/tags'));
    const data = response.data;
    setCachedData(cacheKey, data, 1800000); // 30 minutes cache
    return data;
  },

  getTag: async (slug: string): Promise<WordPressTag> => {
    const cacheKey = getCacheKey('/wp/v2/tags', { slug });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await api.get(getApiUrl('/wp/v2/tags'), { params: { slug } });
    const data = response.data[0];
    setCachedData(cacheKey, data, 1800000); // 30 minutes cache
    return data;
  },

  // Media
  getMedia: async (id: number): Promise<WordPressMedia> => {
    const cacheKey = getCacheKey(`/wp/v2/media/${id}`);
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await api.get(getApiUrl(`/wp/v2/media/${id}`));
    const data = response.data;
    setCachedData(cacheKey, data, 3600000); // 1 hour cache
    return data;
  },

  // Authors
  getAuthor: async (id: number): Promise<WordPressAuthor> => {
    const cacheKey = getCacheKey(`/wp/v2/users/${id}`);
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await api.get(getApiUrl(`/wp/v2/users/${id}`));
    const data = response.data;
    setCachedData(cacheKey, data, 3600000); // 1 hour cache
    return data;
  },

  // Search
  search: async (query: string): Promise<WordPressPost[]> => {
    const cacheKey = getCacheKey('/wp/v2/search', { search: query });
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await api.get(getApiUrl('/wp/v2/search'), { params: { search: query } });
    const data = response.data;
    setCachedData(cacheKey, data, 120000); // 2 minutes cache for search
    return data;
  },

  // Cache management
  clearCache: (): void => {
    apiCache.clear();
  },

  getCacheSize: (): number => {
    return apiCache.size;
  },
};

export default wordpressAPI;