import axios from 'axios';
import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';
import { captureError, addBreadcrumb } from '@/lib/sentry';
import { measureApiCall } from '@/lib/performance';
import { analyticsEvents } from '@/lib/analytics';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://localhost:8080/wp-json';

const api = axios.create({
  baseURL: WORDPRESS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add retry logic for failed requests with error tracking
api.interceptors.response.use(
  (response) => {
    // Add breadcrumb for successful API calls
    addBreadcrumb({
      category: 'api',
      message: `API call successful: ${response.config.url}`,
      level: 'info',
    });
    return response;
  },
  async (error) => {
    const config = error.config;
    const url = typeof config?.url === 'string' ? config.url : 'unknown';
    
    // Track API errors
    captureError('WordPress API call failed', {
      tags: { 
        type: 'api',
        endpoint: url,
        status: error.response?.status || 'network',
      },
      extra: {
        url,
        method: config?.method || 'unknown',
        status: error.response?.status,
        statusText: error.response?.statusText,
        retryCount: config?._retryCount || 0,
      },
    });

    // Track analytics event
    analyticsEvents.apiError(url);
    
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
    return measureApiCall(async () => {
      const response = await api.get(getApiUrl('/wp/v2/posts'), { params });
      return response.data;
    }, 'getPosts');
  },

  getPost: async (slug: string): Promise<WordPressPost> => {
    return measureApiCall(async () => {
      const response = await api.get(getApiUrl('/wp/v2/posts'), { params: { slug } });
      return response.data[0];
    }, 'getPost');
  },

  getPostById: async (id: number): Promise<WordPressPost> => {
    return measureApiCall(async () => {
      const response = await api.get(getApiUrl(`/wp/v2/posts/${id}`));
      return response.data;
    }, 'getPostById');
  },

  // Categories
  getCategories: async (): Promise<WordPressCategory[]> => {
    const response = await api.get(getApiUrl('/wp/v2/categories'));
    return response.data;
  },

  getCategory: async (slug: string): Promise<WordPressCategory> => {
    const response = await api.get(getApiUrl('/wp/v2/categories'), { params: { slug } });
    return response.data[0];
  },

  // Tags
  getTags: async (): Promise<WordPressTag[]> => {
    const response = await api.get(getApiUrl('/wp/v2/tags'));
    return response.data;
  },

  getTag: async (slug: string): Promise<WordPressTag> => {
    const response = await api.get(getApiUrl('/wp/v2/tags'), { params: { slug } });
    return response.data[0];
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
    const response = await api.get(getApiUrl('/wp/v2/search'), { params: { search: query } });
    return response.data;
  },
};

export default wordpressAPI;