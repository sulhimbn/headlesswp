import { cacheFetch } from '@/lib/utils/cacheFetch';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');

describe('cacheFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cache hit scenario', () => {
    it('should return cached data when available', async () => {
      const mockCachedData = { id: 1, name: 'Test' };
      (cacheManager.get as jest.Mock).mockReturnValue(mockCachedData);

      const mockFetchFn = jest.fn().mockResolvedValue({ id: 2, name: 'New' });
      
      const result = await cacheFetch(mockFetchFn, {
        key: 'test-key',
        ttl: 60000,
      });

      expect(result).toEqual(mockCachedData);
      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
      expect(mockFetchFn).not.toHaveBeenCalled();
      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('should return null when cached data is null', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const mockFetchFn = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });

      const result = await cacheFetch(mockFetchFn, {
        key: 'test-key',
        ttl: 60000,
      });

      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
      expect(mockFetchFn).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, name: 'Test' });
    });
  });

  describe('cache miss scenario', () => {
    it('should fetch data when cache miss', async () => {
      const mockData = { id: 1, name: 'Test' };
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const mockFetchFn = jest.fn().mockResolvedValue(mockData);
      
      const result = await cacheFetch(mockFetchFn, {
        key: 'test-key',
        ttl: 60000,
      });

      expect(result).toEqual(mockData);
      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
      expect(mockFetchFn).toHaveBeenCalledTimes(1);
      expect(cacheManager.set).toHaveBeenCalledWith('test-key', mockData, 60000, undefined);
    });

    it('should fetch data and apply transform function', async () => {
      const mockData = { id: 1, name: 'Test' };
      const transformedData = { id: 1, name: 'Test', transformed: true };
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const mockFetchFn = jest.fn().mockResolvedValue(mockData);
      const mockTransform = jest.fn().mockReturnValue(transformedData);
      
      const result = await cacheFetch(mockFetchFn, {
        key: 'test-key',
        ttl: 60000,
        transform: mockTransform,
      });

      expect(result).toEqual(transformedData);
      expect(mockFetchFn).toHaveBeenCalledTimes(1);
      expect(mockTransform).toHaveBeenCalledWith(mockData);
      expect(cacheManager.set).toHaveBeenCalledWith('test-key', transformedData, 60000, undefined);
    });

    it('should pass dependencies to cacheManager.set', async () => {
      const mockData = { id: 1, name: 'Test' };
      const dependencies = ['dep1', 'dep2'];
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const mockFetchFn = jest.fn().mockResolvedValue(mockData);
      
      const result = await cacheFetch(mockFetchFn, {
        key: 'test-key',
        ttl: 60000,
        dependencies,
      });

      expect(result).toEqual(mockData);
      expect(cacheManager.set).toHaveBeenCalledWith('test-key', mockData, 60000, dependencies);
    });

    it('should work with different data types', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const stringData = 'test string';
      const arrayData = [1, 2, 3];
      const objectData = { id: 1, name: 'Test' };

      const mockStringFn = jest.fn().mockResolvedValue(stringData);
      const mockArrayFn = jest.fn().mockResolvedValue(arrayData);
      const mockObjectFn = jest.fn().mockResolvedValue(objectData);

      const stringResult = await cacheFetch(mockStringFn, {
        key: 'test-string',
        ttl: 60000,
      });

      const arrayResult = await cacheFetch(mockArrayFn, {
        key: 'test-array',
        ttl: 60000,
      });

      const objectResult = await cacheFetch(mockObjectFn, {
        key: 'test-object',
        ttl: 60000,
      });

      expect(stringResult).toEqual(stringData);
      expect(arrayResult).toEqual(arrayData);
      expect(objectResult).toEqual(objectData);
    });
  });

  describe('error handling', () => {
    it('should return null when fetch function throws error', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const mockError = new Error('Fetch failed');
      const mockFetchFn = jest.fn().mockRejectedValue(mockError);
      
      const result = await cacheFetch(mockFetchFn, {
        key: 'test-key',
        ttl: 60000,
      });

      expect(result).toBeNull();
      expect(mockFetchFn).toHaveBeenCalledTimes(1);
      expect(cacheManager.set).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch data for cache key: test-key',
        mockError,
        { module: 'cacheFetch' }
      );
    });

    it('should handle network errors gracefully', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const networkError = new Error('Network error');
      const mockFetchFn = jest.fn().mockRejectedValue(networkError);
      
      const result = await cacheFetch(mockFetchFn, {
        key: 'test-key',
        ttl: 60000,
      });

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch data for cache key: test-key',
        networkError,
        { module: 'cacheFetch' }
      );
    });

    it('should handle timeout errors gracefully', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const timeoutError = new Error('Timeout');
      const mockFetchFn = jest.fn().mockRejectedValue(timeoutError);
      
      const result = await cacheFetch(mockFetchFn, {
        key: 'test-key',
        ttl: 60000,
      });

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch data for cache key: test-key',
        timeoutError,
        { module: 'cacheFetch' }
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty string data', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const mockFetchFn = jest.fn().mockResolvedValue('');
      
      const result = await cacheFetch(mockFetchFn, {
        key: 'test-key',
        ttl: 60000,
      });

      expect(result).toEqual('');
      expect(cacheManager.set).toHaveBeenCalledWith('test-key', '', 60000, undefined);
    });

    it('should handle null data without transform', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const mockFetchFn = jest.fn().mockResolvedValue(null);
      
      const result = await cacheFetch(mockFetchFn, {
        key: 'test-key',
        ttl: 60000,
      });

      expect(result).toBeNull();
      expect(cacheManager.set).toHaveBeenCalledWith('test-key', null, 60000, undefined);
    });

    it('should handle undefined data with transform', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const mockFetchFn = jest.fn().mockResolvedValue(undefined);
      const mockTransform = jest.fn().mockReturnValue('transformed');
      
      const result = await cacheFetch(mockFetchFn, {
        key: 'test-key',
        ttl: 60000,
        transform: mockTransform,
      });

      expect(result).toEqual('transformed');
      expect(mockTransform).toHaveBeenCalledWith(undefined);
    });

    it('should handle empty dependencies array', async () => {
      const mockData = { id: 1, name: 'Test' };
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const mockFetchFn = jest.fn().mockResolvedValue(mockData);
      
      const result = await cacheFetch(mockFetchFn, {
        key: 'test-key',
        ttl: 60000,
        dependencies: [],
      });

      expect(result).toEqual(mockData);
      expect(cacheManager.set).toHaveBeenCalledWith('test-key', mockData, 60000, []);
    });
  });

  describe('concurrent requests', () => {
    it('should handle multiple concurrent requests to same key', async () => {
      const mockData = { id: 1, name: 'Test' };
      
      let fetchCallCount = 0;
      (cacheManager.get as jest.Mock).mockImplementation(() => {
        if (fetchCallCount === 0) {
          fetchCallCount++;
          return null;
        }
        return mockData;
      });

      const mockFetchFn = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockData;
      });
      
      const results = await Promise.all([
        cacheFetch(mockFetchFn, { key: 'test-key', ttl: 60000 }),
        cacheFetch(mockFetchFn, { key: 'test-key', ttl: 60000 }),
        cacheFetch(mockFetchFn, { key: 'test-key', ttl: 60000 }),
      ]);

      results.forEach(result => {
        expect(result).toEqual(mockData);
      });
    });
  });
});
