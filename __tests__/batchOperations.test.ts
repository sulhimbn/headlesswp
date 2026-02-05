import { createBatchOperation, type BatchOperationOptions } from '@/lib/api/batchOperations';

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('batchOperations', () => {
  interface TestItem {
    id: number;
    value: string;
  }

  let mockCacheManager: jest.Mocked<{
    get: jest.Mock;
    set: jest.Mock;
  }>;

  beforeEach(() => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn()
    };
  });

  describe('createBatchOperation', () => {
    it('should return cached items without fetching', async () => {
      const cachedItem: TestItem = { id: 1, value: 'cached' };
      mockCacheManager.get.mockReturnValue(cachedItem);

      const result = await createBatchOperation<TestItem>({
        ids: [1],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn: jest.fn(),
        extractIdFn: (item) => item.id
      });

      expect(result.get(1)).toEqual(cachedItem);
      expect(mockCacheManager.get).toHaveBeenCalledWith('test:1');
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should fetch uncached items', async () => {
      mockCacheManager.get.mockReturnValue(null);
      const fetchedItem: TestItem = { id: 1, value: 'fetched' };
      const fetchFn = jest.fn().mockResolvedValue([fetchedItem]);

      const result = await createBatchOperation<TestItem>({
        ids: [1],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn,
        extractIdFn: (item) => item.id
      });

      expect(result.get(1)).toEqual(fetchedItem);
      expect(fetchFn).toHaveBeenCalledWith([1], undefined);
      expect(mockCacheManager.set).toHaveBeenCalledWith('test:1', fetchedItem, 300);
    });

    it('should handle mixed cached and uncached items', async () => {
      const cachedItem: TestItem = { id: 1, value: 'cached' };
      const fetchedItem: TestItem = { id: 2, value: 'fetched' };
      mockCacheManager.get.mockImplementation((key) => {
        if (key === 'test:1') return cachedItem;
        return null;
      });

      const fetchFn = jest.fn().mockResolvedValue([fetchedItem]);

      const result = await createBatchOperation<TestItem>({
        ids: [1, 2],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn,
        extractIdFn: (item) => item.id
      });

      expect(result.get(1)).toEqual(cachedItem);
      expect(result.get(2)).toEqual(fetchedItem);
      expect(fetchFn).toHaveBeenCalledWith([2], undefined);
    });

    it('should skip IDs === 0 when skipZero is true', async () => {
      const item: TestItem = { id: 1, value: 'test' };
      mockCacheManager.get.mockReturnValue(null);
      const fetchFn = jest.fn().mockResolvedValue([item]);

      const result = await createBatchOperation<TestItem>({
        ids: [0, 1],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn,
        extractIdFn: (item) => item.id,
        skipZero: true
      });

      expect(result.has(0)).toBe(false);
      expect(result.get(1)).toEqual(item);
      expect(fetchFn).toHaveBeenCalledWith([1], undefined);
    });

    it('should set IDs === 0 to null when skipZero is false', async () => {
      const item: TestItem = { id: 1, value: 'test' };
      mockCacheManager.get.mockReturnValue(null);
      const fetchFn = jest.fn().mockResolvedValue([item]);

      const result = await createBatchOperation<TestItem>({
        ids: [0, 1],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn,
        extractIdFn: (item) => item.id,
        skipZero: false
      });

      expect(result.get(0)).toBe(null);
      expect(result.get(1)).toEqual(item);
    });

    it('should set missing IDs to null after fetch', async () => {
      mockCacheManager.get.mockReturnValue(null);
      const fetchFn = jest.fn().mockResolvedValue([{ id: 1, value: 'test1' }]);

      const result = await createBatchOperation<TestItem>({
        ids: [1, 2],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn,
        extractIdFn: (item) => item.id
      });

      expect(result.get(1)).toEqual({ id: 1, value: 'test1' });
      expect(result.get(2)).toBe(null);
    });

    it('should not fetch when all items are cached', async () => {
      const cachedItem: TestItem = { id: 1, value: 'cached' };
      mockCacheManager.get.mockReturnValue(cachedItem);
      const fetchFn = jest.fn();

      await createBatchOperation<TestItem>({
        ids: [1],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn,
        extractIdFn: (item) => item.id
      });

      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should return empty result for empty ID list', async () => {
      const fetchFn = jest.fn();

      const result = await createBatchOperation<TestItem>({
        ids: [],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn,
        extractIdFn: (item) => item.id
      });

      expect(result.size).toBe(0);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should call onSuccess callback when provided', async () => {
      const onSuccess = jest.fn();
      const fetchedItem: TestItem = { id: 1, value: 'fetched' };
      mockCacheManager.get.mockReturnValue(null);
      const fetchFn = jest.fn().mockResolvedValue([fetchedItem]);

      await createBatchOperation<TestItem>({
        ids: [1],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn,
        extractIdFn: (item) => item.id,
        onSuccess
      });

      expect(onSuccess).toHaveBeenCalledWith(
        fetchedItem,
        expect.any(Map),
        mockCacheManager,
        expect.any(Function),
        300
      );
    });

    it('should call onError callback and return result when fetch fails', async () => {
      const onError = jest.fn();
      mockCacheManager.get.mockReturnValue(null);
      const fetchFn = jest.fn().mockRejectedValue(new Error('Fetch failed'));

      const result = await createBatchOperation<TestItem>({
        ids: [1, 2],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn,
        extractIdFn: (item) => item.id,
        onError
      });

      expect(result.get(1)).toBe(null);
      expect(result.get(2)).toBe(null);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        [1, 2]
      );
    });

    it('should pass signal to fetch function', async () => {
      const signal = new AbortController().signal;
      const fetchedItem: TestItem = { id: 1, value: 'test' };
      mockCacheManager.get.mockReturnValue(null);
      const fetchFn = jest.fn().mockResolvedValue([fetchedItem]);

      await createBatchOperation<TestItem>({
        ids: [1],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn,
        extractIdFn: (item) => item.id,
        signal
      });

      expect(fetchFn).toHaveBeenCalledWith([1], signal);
    });

    it('should throw error when fetch fails without onError callback', async () => {
      mockCacheManager.get.mockReturnValue(null);
      const fetchFn = jest.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(createBatchOperation<TestItem>({
        ids: [1],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn,
        extractIdFn: (item) => item.id
      })).rejects.toThrow('Fetch failed');
    });

    it('should handle large batch of IDs efficiently', async () => {
      const ids = Array.from({ length: 100 }, (_, i) => i + 1);
      mockCacheManager.get.mockReturnValue(null);
      const fetchFn = jest.fn().mockResolvedValue(ids.map(id => ({ id, value: `test${id}` })));

      const result = await createBatchOperation<TestItem>({
        ids,
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn,
        extractIdFn: (item) => item.id
      });

      expect(result.size).toBe(100);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(fetchFn).toHaveBeenCalledWith(ids, undefined);
    });

    it('should handle duplicate IDs in input', async () => {
      mockCacheManager.get.mockReturnValue(null);
      const fetchedItem: TestItem = { id: 1, value: 'test' };
      const fetchFn = jest.fn().mockResolvedValue([fetchedItem]);

      const result = await createBatchOperation<TestItem>({
        ids: [1, 1, 1],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 300,
        fetchFn,
        extractIdFn: (item) => item.id
      });

      expect(result.get(1)).toEqual(fetchedItem);
      expect(fetchFn).toHaveBeenCalledWith([1], undefined);
    });

    it('should cache fetched items with correct TTL', async () => {
      const fetchedItem: TestItem = { id: 1, value: 'test' };
      mockCacheManager.get.mockReturnValue(null);
      const fetchFn = jest.fn().mockResolvedValue([fetchedItem]);

      await createBatchOperation<TestItem>({
        ids: [1],
        cacheKeyFn: (id) => `test:${id}`,
        cacheManager: mockCacheManager as any,
        cacheTtl: 600,
        fetchFn,
        extractIdFn: (item) => item.id
      });

      expect(mockCacheManager.set).toHaveBeenCalledWith('test:1', fetchedItem, 600);
    });
  });
});
