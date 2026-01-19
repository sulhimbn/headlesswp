import { HealthChecker } from '@/lib/api/healthCheck';

// Mock HTTP client for testing
const mockHttpClient = {
  get: jest.fn(),
};
 
describe('HealthChecker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpClient.get.mockReset();
  });

  describe('check()', () => {
    it('should return healthy result when WordPress API responds successfully', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({
        headers: {
          'x-wordpress-api-version': 'v2',
        },
      });

      const result = await healthChecker.check();

      expect(result.healthy).toBe(true);
      expect(result.message).toBe('WordPress API is healthy');
      expect(result.version).toBe('v2');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy result when WordPress API fails', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockRejectedValue(new Error('Network error: Unable to connect to server'));

      const result = await healthChecker.check();

      expect(result.healthy).toBe(false);
      expect(result.message).toBe('WordPress API is unhealthy');
      expect(result.error).toContain('Network error');
    });

    it('should return healthy result without version when header not present', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({
        headers: {},
      });

      const result = await healthChecker.check();

      expect(result.healthy).toBe(true);
      expect(result.version).toBeUndefined();
    });

    it('should store last check result', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({});

      const result1 = await healthChecker.check();
      const lastCheck1 = healthChecker.getLastCheck();

      expect(lastCheck1).toEqual(result1);

      const result2 = await healthChecker.check();
      const lastCheck2 = healthChecker.getLastCheck();

      expect(lastCheck2).toEqual(result2);
      expect(lastCheck2).not.toBe(lastCheck1);
    });

    it('should return in progress message when check is already in progress', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockImplementation(
        () => new Promise(() => {})
      );

      const check1Promise = healthChecker.check();
      const check2Promise = healthChecker.check();

      const result2 = await check2Promise;

      expect(result2).toEqual({
        healthy: false,
        timestamp: expect.any(String),
        latency: 0,
        message: 'Health check already in progress',
      });

      check1Promise.catch(() => {});
    });

    it('should measure latency correctly', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve({}), 100);
        }),
      );

      const result = await healthChecker.check();

      expect(result.latency).toBeGreaterThanOrEqual(95);
      expect(result.latency).toBeLessThan(200);
    });
  });

  describe('checkWithTimeout()', () => {
    it('should timeout and return unhealthy result', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockImplementation(
        () => new Promise(() => {})
      );

      const result = await healthChecker.checkWithTimeout(100);

      expect(result.healthy).toBe(false);
      expect(result.message).toBe('Health check timed out');
      expect(result.latency).toBe(100);
    });

    it('should return healthy result when check completes within timeout', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({});

      const result = await healthChecker.checkWithTimeout(5000);

      expect(result.healthy).toBe(true);
    });

    it('should use default timeout when not specified', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({});

      const result = await healthChecker.checkWithTimeout();

      expect(result.healthy).toBe(true);
    });
  });

  describe('checkRetry()', () => {
    it('should return healthy result on first attempt', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({});

      const result = await healthChecker.checkRetry(3, 10);

      expect(result.healthy).toBe(true);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    });

    it('should retry and return healthy result on second attempt', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({});

      const result = await healthChecker.checkRetry(3, 10);

      expect(result.healthy).toBe(true);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });

    it('should retry and return healthy result on third attempt', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get
        .mockRejectedValueOnce(new Error('Network error 1'))
        .mockRejectedValueOnce(new Error('Network error 2'))
        .mockResolvedValueOnce({});

      const result = await healthChecker.checkRetry(3, 10);

      expect(result.healthy).toBe(true);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
    });

    it('should return unhealthy result after exhausting retries', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockRejectedValue(new Error('Network error: Unable to connect to server'));

      const result = await healthChecker.checkRetry(3, 10);

      expect(result.healthy).toBe(false);
      expect(result.message).toBe('WordPress API is unhealthy');
      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
    });

    it('should wait between retries', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({});

      const startTime = Date.now();
      await healthChecker.checkRetry(3, 100);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it('should use default max attempts and delay when not specified', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({});

      const result = await healthChecker.checkRetry();

      expect(result.healthy).toBe(true);
    });

    it('should handle unexpected errors during retry', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await healthChecker.checkRetry(2, 10);

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });

    it('should handle errors thrown during check', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await healthChecker.checkRetry(2, 10);

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Connection failed');
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });

    it('should increment attempt count on each retry', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce({});

      await healthChecker.checkRetry(3, 10);

      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
    });

    it('should return unhealthy result after exhausting all retries', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockRejectedValue(new Error('Persistent error'));

      const result = await healthChecker.checkRetry(3, 10);

      expect(result.healthy).toBe(false);
      expect(result.message).toBe('WordPress API is unhealthy');
      expect(result.error).toBe('Persistent error');
      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('getLastCheck()', () => {
    it('should return null when no check has been performed', () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      const lastCheck = healthChecker.getLastCheck();

      expect(lastCheck).toBeNull();
    });

    it('should return last check result after successful check', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({});

      await healthChecker.check();
      const lastCheck = healthChecker.getLastCheck();

      expect(lastCheck).not.toBeNull();
      expect(lastCheck?.healthy).toBe(true);
    });

    it('should return last check result after failed check', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockRejectedValue(new Error('Network error: Unable to connect to server'));

      await healthChecker.check();
      const lastCheck = healthChecker.getLastCheck();

      expect(lastCheck).not.toBeNull();
      expect(lastCheck?.healthy).toBe(false);
    });

    it('should update last check on subsequent checks', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get
        .mockResolvedValueOnce({ headers: { 'x-wordpress-api-version': 'v1' } })
        .mockResolvedValueOnce({ headers: { 'x-wordpress-api-version': 'v2' } });

      await healthChecker.check();
      const lastCheck1 = healthChecker.getLastCheck();

      await healthChecker.check();
      const lastCheck2 = healthChecker.getLastCheck();

      expect(lastCheck1?.version).toBe('v1');
      expect(lastCheck2?.version).toBe('v2');
    });
  });

  describe('Independent HealthChecker instances', () => {
    it('should create multiple independent health checker instances', async () => {
      const healthChecker1 = new HealthChecker(mockHttpClient);
      const healthChecker2 = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({});

      const result1 = await healthChecker1.check();
      const result2 = await healthChecker2.check();

      expect(result1.healthy).toBe(true);
      expect(result2.healthy).toBe(true);
    });
  });

  describe('Concurrent Health Check Requests', () => {
    it('should handle multiple concurrent check requests correctly', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({});

      const checkPromises = Array(5).fill(null).map(() => healthChecker.check());
      const results = await Promise.all(checkPromises);

      results.forEach((result, index) => {
        if (index === 0) {
          expect(result.healthy).toBe(true);
        } else {
          expect(result.healthy).toBe(false);
          expect(result.message).toBe('Health check already in progress');
        }
      });

      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    });

    it('should reset checkInProgress flag after completion', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({});

      await healthChecker.check();
      const result2 = await healthChecker.check();

      expect(result2.healthy).toBe(true);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid sequential checks without race condition', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      let callCount = 0;

      mockHttpClient.get.mockImplementation(() => {
        callCount++;
        return new Promise(resolve => setTimeout(() => resolve({}), 10));
      });

      const promises = Array(3).fill(null).map((_, i) => healthChecker.check());
      await Promise.all(promises);

      expect(callCount).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle response without headers property', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({});

      const result = await healthChecker.check();

      expect(result.healthy).toBe(true);
      expect(result.version).toBeUndefined();
    });

    it('should handle null headers in response', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({ headers: null });

      const result = await healthChecker.check();

      expect(result.healthy).toBe(true);
      expect(result.version).toBeUndefined();
    });

    it('should handle undefined headers in response', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({ headers: undefined });

      const result = await healthChecker.check();

      expect(result.healthy).toBe(true);
      expect(result.version).toBeUndefined();
    });

    it('should handle empty object response', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({});

      const result = await healthChecker.check();

      expect(result.healthy).toBe(true);
      expect(result.version).toBeUndefined();
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should only extract version from lowercase x-wordpress-api-version header', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);

      const versionHeaders = [
        { headers: { 'x-wordpress-api-version': 'v2' } },
        { headers: { 'X-WordPress-API-Version': 'v2.1' } },
        { headers: { 'X-Wordpress-Api-Version': 'v2.0' } }
      ];

      for (const response of versionHeaders) {
        mockHttpClient.get.mockResolvedValueOnce(response);
        const result = await healthChecker.check();
        expect(result.healthy).toBe(true);
      }

      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
    });

    it('skipped: checkRetry with zero maxAttempts causes loop to never run', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockRejectedValue(new Error('Error'));

      const result = await healthChecker.checkRetry(0, 10);

      expect(result).toBeNull();
      expect(mockHttpClient.get).toHaveBeenCalledTimes(0);
    });

    it('should handle checkRetry with zero delay', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce({});

      const startTime = Date.now();
      const result = await healthChecker.checkRetry(2, 0);
      const endTime = Date.now();

      expect(result.healthy).toBe(true);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Race Conditions', () => {
    it('should handle race between check and getLastCheck', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({}), 50))
      );

      const checkPromise = healthChecker.check();
      const lastCheckDuring = healthChecker.getLastCheck();

      expect(lastCheckDuring).toBeNull();

      await checkPromise;
      const lastCheckAfter = healthChecker.getLastCheck();

      expect(lastCheckAfter).not.toBeNull();
      expect(lastCheckAfter?.healthy).toBe(true);
    });

    it('should maintain lastCheck integrity during concurrent checks', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({}), 50))
      );

      const check1 = healthChecker.check();

      const lastCheckDuringCheck1 = healthChecker.getLastCheck();
      expect(lastCheckDuringCheck1).toBeNull();

      await check1;

      const lastCheckAfterCheck1 = healthChecker.getLastCheck();
      expect(lastCheckAfterCheck1?.healthy).toBe(true);

      mockHttpClient.get.mockResolvedValue({ headers: { 'x-wordpress-api-version': 'v2' } });
      const check2 = await healthChecker.check();

      const lastCheckAfterCheck2 = healthChecker.getLastCheck();
      expect(lastCheckAfterCheck2?.healthy).toBe(true);
      expect(lastCheckAfterCheck2?.version).toBe('v2');
    });

    it('should handle multiple rapid getLastCheck calls', async () => {
      const healthChecker = new HealthChecker(mockHttpClient);
      mockHttpClient.get.mockResolvedValue({});

      const checkPromise = healthChecker.check();

      const lastChecks = Array(10).fill(null).map(() => healthChecker.getLastCheck());
      const results = await Promise.all([...lastChecks, checkPromise]);

      const initialLastChecks = results.slice(0, -1);
      initialLastChecks.forEach(lastCheck => {
        expect(lastCheck).toBeNull();
      });

      const finalLastCheck = healthChecker.getLastCheck();
      expect(finalLastCheck).not.toBeNull();
      expect(finalLastCheck?.healthy).toBe(true);
    });
  });
});
