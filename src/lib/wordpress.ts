import axios from 'axios';
import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';

// API Strategy: REST API
// This application uses WordPress REST API v2 for all data fetching.
// Decision made in issue #34: REST API provides simplicity, performance, and WordPress core compatibility.
const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://localhost:8080/wp-json';

// Simple in-memory cache for API responses
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key: string, data: any, ttl: number = 300000) => { // 5 minutes default TTL
  cache.set(key, { data, timestamp: Date.now(), ttl });
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
    const cacheKey = `posts_${JSON.stringify(params || {})}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    
    const response = await api.get(getApiUrl('/wp/v2/posts'), { params });
    setCachedData(cacheKey, response.data, 300000); // 5 minutes cache
    return response.data;
  },

  getPost: async (slug: string): Promise<WordPressPost> => {
    const cacheKey = `post_${slug}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    
    const response = await api.get(getApiUrl('/wp/v2/posts'), { params: { slug } });
    const post = response.data[0];
    setCachedData(cacheKey, post, 600000); // 10 minutes cache
    return post;
  },

  getPostById: async (id: number): Promise<WordPressPost> => {
    const cacheKey = `post_by_id_${id}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    
    const response = await api.get(getApiUrl(`/wp/v2/posts/${id}`));
    setCachedData(cacheKey, response.data, 600000); // 10 minutes cache
    return response.data;
  },

  // Categories
  getCategories: async (): Promise<WordPressCategory[]> => {
    const cacheKey = 'categories';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    
    const response = await api.get(getApiUrl('/wp/v2/categories'));
    setCachedData(cacheKey, response.data, 1800000); // 30 minutes cache
    return response.data;
  },

  getCategory: async (slug: string): Promise<WordPressCategory> => {
    const cacheKey = `category_${slug}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    
    const response = await api.get(getApiUrl('/wp/v2/categories'), { params: { slug } });
    const category = response.data[0];
    setCachedData(cacheKey, category, 1800000); // 30 minutes cache
    return category;
  },

  // Tags
  getTags: async (): Promise<WordPressTag[]> => {
    const cacheKey = 'tags';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    
    const response = await api.get(getApiUrl('/wp/v2/tags'));
    setCachedData(cacheKey, response.data, 1800000); // 30 minutes cache
    return response.data;
  },

  getTag: async (slug: string): Promise<WordPressTag> => {
    const cacheKey = `tag_${slug}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    
    const response = await api.get(getApiUrl('/wp/v2/tags'), { params: { slug } });
    const tag = response.data[0];
    setCachedData(cacheKey, tag, 1800000); // 30 minutes cache
    return tag;
  },

  // Media
  getMedia: async (id: number): Promise<WordPressMedia> => {
    const response = await api.get(getApiUrl(`/wp/v2/media/${id}`));
    return response.data;
  },

  // Authors
  getAuthor: async (id: number): Promise<WordPressAuthor> => {
    const response = await api.get(getApiUrl(`/wp/v2/users/${id}`));
    return response.data;
  },

  // Search
  search: async (query: string): Promise<WordPressPost[]> => {
    const cacheKey = `search_${query}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    
    const response = await api.get(getApiUrl('/wp/v2/search'), { params: { search: query } });
    setCachedData(cacheKey, response.data, 120000); // 2 minutes cache for search
    return response.data;
  },

  // Cache management
  clearCache: (pattern?: string) => {
    if (pattern) {
      const keys = Array.from(cache.keys());
      for (const key of keys) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  },

  // Cache statistics
  getCacheStats: () => {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
    };
  },
};

export default wordpressAPI;