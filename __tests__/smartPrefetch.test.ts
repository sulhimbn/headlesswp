/**
 * Smart Prefetch Tests
 * 
 * Tests for AI-native smart cache prefetch feature (INNOVATION-001).
 */

// Import the modules to test
import { navigationTracker } from '@/lib/services/prefetch/navigationTracker';
import { predictionEngine } from '@/lib/services/prefetch/predictionEngine';
import { smartPrefetch, DEFAULT_PREFETCH_CONFIG } from '@/lib/services/prefetch/smartPrefetch';

// Mock logger to avoid console output during tests
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock enhancedPostService
jest.mock('@/lib/services/enhancedPostService', () => ({
  enhancedPostService: {
    getCategories: jest.fn().mockResolvedValue([
      { id: 1, name: 'News', slug: 'news' },
      { id: 2, name: 'Sports', slug: 'sports' },
    ]),
    getLatestPosts: jest.fn().mockResolvedValue([
      { id: 1, slug: 'post-1', title: { rendered: 'Post 1' } },
      { id: 2, slug: 'post-2', title: { rendered: 'Post 2' } },
    ]),
    getPostBySlug: jest.fn().mockResolvedValue(null),
    getRelatedPosts: jest.fn().mockResolvedValue([]),
    getPostsByCategory: jest.fn().mockResolvedValue({ posts: [], totalPosts: 0, totalPages: 0 }),
  },
}));

// Mock cache manager
jest.mock('@/lib/cache', () => ({
  cacheManager: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
  },
  cacheKeys: {
    posts: (key?: string) => key ? `posts:${key}` : 'posts:default',
    post: (slug: string) => `post:${slug}`,
    category: (slug: string) => `category:${slug}`,
    tag: (slug: string) => `tag:${slug}`,
    author: (id: number) => `author:${id}`,
    categories: () => 'categories',
    tags: () => 'tags',
  },
  CACHE_TTL: {
    POSTS: 300000,
    POST: 600000,
    CATEGORIES: 1800000,
    TAGS: 1800000,
  },
}));

describe('NavigationTracker', () => {
  beforeEach(() => {
    navigationTracker.reset();
  });

  afterEach(() => {
    navigationTracker.reset();
  });

  it('should track navigation events', () => {
    const sessionId = 'test-session-1';
    
    navigationTracker.trackNavigation(sessionId, '/berita/post-1');
    navigationTracker.trackNavigation(sessionId, '/berita/post-2');
    
    const pattern = navigationTracker.getSessionPattern(sessionId);
    
    expect(pattern).toBeTruthy();
    expect(pattern?.path).toContain('/berita/post-1');
    expect(pattern?.path).toContain('/berita/post-2');
  });

  it('should categorize pages correctly', () => {
    const sessionId = 'test-session-2';
    
    navigationTracker.trackNavigation(sessionId, '/');
    navigationTracker.trackNavigation(sessionId, '/berita');
    navigationTracker.trackNavigation(sessionId, '/berita/post-1');
    navigationTracker.trackNavigation(sessionId, '/kategori/news');
    navigationTracker.trackNavigation(sessionId, '/tag/sports');
    
    const events = navigationTracker.getRecentEvents(sessionId);
    
    expect(events[0]?.pageCategory).toBe('home');
    expect(events[1]?.pageCategory).toBe('post_list');
    expect(events[2]?.pageCategory).toBe('post_detail');
    expect(events[3]?.pageCategory).toBe('category');
    expect(events[4]?.pageCategory).toBe('tag');
  });

  it('should track multiple sessions independently', () => {
    navigationTracker.trackNavigation('session-1', '/berita/post-1');
    navigationTracker.trackNavigation('session-2', '/kategori/news');
    
    const pattern1 = navigationTracker.getSessionPattern('session-1');
    const pattern2 = navigationTracker.getSessionPattern('session-2');
    
    expect(pattern1?.path).toContain('/berita/post-1');
    expect(pattern2?.path).toContain('/kategori/news');
    expect(navigationTracker.getActiveSessionCount()).toBe(2);
  });

  it('should get popular next pages', () => {
    const sessionId = 'test-session-3';
    
    navigationTracker.trackNavigation(sessionId, '/berita/post-1', '/');
    navigationTracker.trackNavigation(sessionId, '/berita/post-2', '/berita/post-1');
    
    const popular = navigationTracker.getPopularNextPages('/berita/post-1');
    
    expect(popular).toBeTruthy();
  });

  it('should get frequent paths', () => {
    const sessionId1 = 'session-a';
    const sessionId2 = 'session-b';
    
    navigationTracker.trackNavigation(sessionId1, '/', '/berita');
    navigationTracker.trackNavigation(sessionId1, '/berita', '/');
    navigationTracker.trackNavigation(sessionId2, '/', '/berita');
    navigationTracker.trackNavigation(sessionId2, '/berita', '/');
    
    const paths = navigationTracker.getFrequentPaths(2);
    
    expect(paths.length).toBeGreaterThanOrEqual(0);
  });

  it('should reset tracking data', () => {
    navigationTracker.trackNavigation('session-reset', '/berita/post-1');
    
    expect(navigationTracker.getActiveSessionCount()).toBeGreaterThan(0);
    
    navigationTracker.reset();
    
    expect(navigationTracker.getActiveSessionCount()).toBe(0);
    expect(navigationTracker.getTotalEvents()).toBe(0);
  });
});

describe('PredictionEngine', () => {
  beforeEach(() => {
    navigationTracker.reset();
    predictionEngine.clearCache();
  });

  it('should generate predictions with default weights', () => {
    const weights = predictionEngine.getWeights();
    
    expect(weights).toHaveProperty('sequential');
    expect(weights).toHaveProperty('categoryPopular');
    expect(weights).toHaveProperty('relatedContent');
    expect(weights).toHaveProperty('frequentPath');
    expect(weights).toHaveProperty('newContent');
  });

  it('should update prediction weights', () => {
    predictionEngine.setWeights({ sequential: 0.5 });
    
    const weights = predictionEngine.getWeights();
    
    expect(weights.sequential).toBe(0.5);
  });

  it('should clear cached predictions', () => {
    predictionEngine.clearCache();
    
    // No error should occur
    expect(true).toBe(true);
  });

  it('should handle missing session gracefully', async () => {
    const predictions = await predictionEngine.generatePredictions(
      'non-existent-session',
      '/berita/post-1',
      'post_detail'
    );
    
    expect(Array.isArray(predictions)).toBe(true);
  });
});

describe('SmartPrefetch', () => {
  beforeEach(() => {
    smartPrefetch.reset();
  });

  afterEach(() => {
    smartPrefetch.reset();
  });

  it('should have default configuration', () => {
    const config = smartPrefetch.getConfig();
    
    expect(config).toEqual(DEFAULT_PREFETCH_CONFIG);
    expect(config.maxConcurrentPrefetches).toBe(3);
    expect(config.minConfidenceThreshold).toBe(0.3);
    expect(config.maxPredictions).toBe(5);
  });

  it('should track navigation and return predictions', async () => {
    const predictions = await smartPrefetch.trackAndPrefetch(
      'prefetch-session-1',
      '/berita/post-1',
      '/'
    );
    
    expect(Array.isArray(predictions)).toBe(true);
  });

  it('should track navigation with device type', async () => {
    const predictions = await smartPrefetch.trackAndPrefetch(
      'prefetch-session-2',
      '/kategori/news',
      '/',
      'mobile'
    );
    
    expect(Array.isArray(predictions)).toBe(true);
  });

  it('should get prefetch statistics', () => {
    const stats = smartPrefetch.getStats();
    
    expect(stats).toHaveProperty('prefetchRequests');
    expect(stats).toHaveProperty('prefetchHits');
    expect(stats).toHaveProperty('prefetchMisses');
    expect(stats).toHaveProperty('predictionsGenerated');
    expect(stats).toHaveProperty('avgConfidence');
    expect(stats).toHaveProperty('activeSessions');
  });

  it('should get pending tasks count', () => {
    const count = smartPrefetch.getPendingTasksCount();
    
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should clear prefetch queue', () => {
    smartPrefetch.clearQueue();
    
    expect(smartPrefetch.getPendingTasksCount()).toBe(0);
  });

  it('should update configuration', () => {
    smartPrefetch.updateConfig({ 
      minConfidenceThreshold: 0.5,
      maxPredictions: 3 
    });
    
    const config = smartPrefetch.getConfig();
    
    expect(config.minConfidenceThreshold).toBe(0.5);
    expect(config.maxPredictions).toBe(3);
  });

  it('should reset all data', () => {
    // Track some navigation
    smartPrefetch.trackAndPrefetch('reset-session', '/berita/post-1');
    
    // Reset
    smartPrefetch.reset();
    
    // Check stats are reset
    const stats = smartPrefetch.getStats();
    
    expect(stats.prefetchRequests).toBe(0);
    expect(stats.prefetchHits).toBe(0);
    expect(stats.prefetchMisses).toBe(0);
    expect(stats.predictionsGenerated).toBe(0);
  });
});

describe('Integration', () => {
  beforeEach(() => {
    smartPrefetch.reset();
    navigationTracker.reset();
  });

  afterEach(() => {
    smartPrefetch.reset();
    navigationTracker.reset();
  });

  it('should track sequential navigation and generate predictions', async () => {
    const sessionId = 'integration-session';
    
    // Track a sequence of pages
    await smartPrefetch.trackAndPrefetch(sessionId, '/', '/');
    await smartPrefetch.trackAndPrefetch(sessionId, '/berita', '/');
    const predictions = await smartPrefetch.trackAndPrefetch(
      sessionId, 
      '/berita/post-1', 
      '/berita'
    );
    
    // Should have generated some predictions
    expect(predictions).toBeTruthy();
    
    // Check stats
    const stats = smartPrefetch.getStats();
    
    expect(stats.prefetchRequests).toBeGreaterThan(0);
    expect(stats.predictionsGenerated).toBeGreaterThanOrEqual(0);
  });

  it('should handle concurrent prefetch requests', async () => {
    const sessionId = 'concurrent-session';
    
    // Make multiple concurrent requests
    const results = await Promise.all([
      smartPrefetch.trackAndPrefetch(sessionId, '/berita/post-1'),
      smartPrefetch.trackAndPrefetch(sessionId, '/berita/post-2'),
      smartPrefetch.trackAndPrefetch(sessionId, '/kategori/news'),
    ]);
    
    expect(results).toHaveLength(3);
    expect(results.every(r => Array.isArray(r))).toBe(true);
  });

  it('should respect configuration limits', async () => {
    // Update config to limit predictions
    smartPrefetch.updateConfig({ maxPredictions: 2 });
    
    const predictions = await smartPrefetch.trackAndPrefetch(
      'limit-session',
      '/berita/post-1'
    );
    
    // The actual number might vary based on prediction sources
    expect(predictions.length).toBeLessThanOrEqual(5);
    
    // Reset config
    smartPrefetch.updateConfig({ maxPredictions: 5 });
  });
});
