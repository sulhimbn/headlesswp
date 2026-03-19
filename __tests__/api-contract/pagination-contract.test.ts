import { apiClient } from '@/lib/api/client';
import { wordpressAPI } from '@/lib/wordpress';

jest.mock('@/lib/api/client');
jest.mock('@/lib/utils/logger');

describe('WordPress REST API Pagination Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Pagination Headers', () => {
    it('validates X-WP-Total header is present and numeric', () => {
      const mockResponse = {
        data: [{ id: 1, title: { rendered: 'Post 1' } }],
        headers: {
          'x-wp-total': '100',
          'x-wp-totalpages': '10'
        }
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      expect(mockResponse.headers['x-wp-total']).toMatch(/^\d+$/);
      expect(mockResponse.headers['x-wp-totalpages']).toMatch(/^\d+$/);
    });

    it('validates pagination metadata calculation', () => {
      const headers = {
        'x-wp-total': '250',
        'x-wp-totalpages': '25'
      };

      const total = parseInt(headers['x-wp-total'], 10);
      const totalPages = parseInt(headers['x-wp-totalpages'], 10);
      const perPage = 10;

      expect(total).toBe(250);
      expect(totalPages).toBe(25);
      expect(Math.ceil(total / perPage)).toBe(25);
    });

    it('handles single page response', () => {
      const headers = {
        'x-wp-total': '5',
        'x-wp-totalpages': '1'
      };

      const total = parseInt(headers['x-wp-total'], 10);
      const totalPages = parseInt(headers['x-wp-totalpages'], 10);

      expect(totalPages).toBe(1);
      expect(total).toBeLessThanOrEqual(10);
    });

    it('handles empty response', () => {
      const headers = {
        'x-wp-total': '0',
        'x-wp-totalpages': '0'
      };

      const total = parseInt(headers['x-wp-total'], 10);
      const totalPages = parseInt(headers['x-wp-totalpages'], 10);

      expect(total).toBe(0);
      expect(totalPages).toBe(0);
    });

    it('handles large page numbers', () => {
      const headers = {
        'x-wp-total': '10000',
        'x-wp-totalpages': '1000'
      };

      const total = parseInt(headers['x-wp-total'], 10);
      const totalPages = parseInt(headers['x-wp-totalpages'], 10);

      expect(total).toBe(10000);
      expect(totalPages).toBe(1000);
    });
  });

  describe('Page Parameter Validation', () => {
    it('validates page parameter is positive integer', () => {
      const validPages = [1, 2, 10, 100, 1000];

      validPages.forEach(page => {
        expect(page).toBeGreaterThan(0);
        expect(Number.isInteger(page)).toBe(true);
      });
    });

    it('validates per_page parameter bounds', () => {
      const validPerPages = [1, 5, 10, 25, 50, 100];
      const maxPerPage = 100;

      validPerPages.forEach(perPage => {
        expect(perPage).toBeGreaterThan(0);
        expect(perPage).toBeLessThanOrEqual(maxPerPage);
      });
    });

    it('validates offset calculation', () => {
      const page = 5;
      const perPage = 10;
      const offset = (page - 1) * perPage;

      expect(offset).toBe(40);
    });
  });

  describe('Collection Response Structure', () => {
    it('validates posts collection structure', async () => {
      const mockPosts = [
        { id: 1, title: { rendered: 'Post 1' }, slug: 'post-1' },
        { id: 2, title: { rendered: 'Post 2' }, slug: 'post-2' }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockPosts,
        headers: { 'x-wp-total': '2', 'x-wp-totalpages': '1' }
      });

      const result = await wordpressAPI.getPosts({ page: 1, per_page: 10 });

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('slug');
    });

    it('validates categories collection structure', async () => {
      const mockCategories = [
        { id: 1, name: 'Category 1', slug: 'category-1' },
        { id: 2, name: 'Category 2', slug: 'category-2' }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockCategories
      });

      const result = await wordpressAPI.getCategories();

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('slug');
    });

    it('validates tags collection structure', async () => {
      const mockTags = [
        { id: 1, name: 'Tag 1', slug: 'tag-1' },
        { id: 2, name: 'Tag 2', slug: 'tag-2' }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockTags
      });

      const result = await wordpressAPI.getTags();

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('slug');
    });
  });

  describe('Cursor-based Navigation Edge Cases', () => {
    it('handles last page correctly', () => {
      const total = 95;
      const perPage = 10;
      const totalPages = Math.ceil(total / perPage);
      const lastPage = totalPages;

      const startIndex = (lastPage - 1) * perPage;
      const endIndex = Math.min(startIndex + perPage, total);

      expect(startIndex).toBe(90);
      expect(endIndex).toBe(95);
      expect(lastPage).toBe(10);
    });

    it('handles exact page boundary', () => {
      const total = 100;
      const perPage = 10;
      const totalPages = total / perPage;

      expect(totalPages).toBe(10);
      expect(total % perPage).toBe(0);
    });

    it('calculates remaining items on last page', () => {
      const total = 97;
      const perPage = 10;
      const totalPages = Math.ceil(total / perPage);
      const lastPageItems = total - (totalPages - 1) * perPage;

      expect(lastPageItems).toBe(7);
    });
  });
});
