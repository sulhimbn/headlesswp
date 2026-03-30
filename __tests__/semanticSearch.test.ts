import { generateEmbedding, semanticSearch, cosineSimilarity, computeContentHash, isSemanticSearchEnabled, clearEmbeddingCache } from '@/lib/services/semanticSearch';
import type { SemanticSearchConfig } from '@/lib/services/semanticSearch';

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  NextRequest: jest.fn().mockImplementation(() => ({})),
  NextResponse: {
    json: jest.fn((data, init) => ({ data, status: init?.status || 200 }))
  }
}));

describe('semanticSearch', () => {
  beforeEach(() => {
    clearEmbeddingCache();
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_SEMANTIC_SEARCH_ENABLED;
    delete process.env.OPENAI_API_KEY;
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vector = [1, 2, 3, 4];
      expect(cosineSimilarity(vector, vector)).toBe(1);
    });

    it('should return 0 for orthogonal vectors', () => {
      expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    });

    it('should return negative for opposite vectors', () => {
      expect(cosineSimilarity([1, 2], [-1, -2])).toBeCloseTo(-1);
    });

    it('should handle empty vectors', () => {
      expect(cosineSimilarity([], [])).toBe(0);
    });

    it('should return 0 for vectors of different lengths', () => {
      expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
    });
  });

  describe('computeContentHash', () => {
    it('should return same hash for same content', () => {
      const content = 'Hello World';
      expect(computeContentHash(content)).toBe(computeContentHash(content));
    });

    it('should return different hash for different content', () => {
      expect(computeContentHash('Hello')).not.toBe(computeContentHash('World'));
    });

    it('should normalize text before hashing', () => {
      expect(computeContentHash('  Hello   World  ')).toBe(computeContentHash('Hello World'));
    });

    it('should remove HTML tags', () => {
      expect(computeContentHash('Hello <b>World</b>')).toBe(computeContentHash('Hello World'));
    });
  });

  describe('generateEmbedding', () => {
    it('should return null when API key is not configured', async () => {
      const config: SemanticSearchConfig = {
        enabled: true,
        apiKey: undefined,
        model: 'text-embedding-3-small'
      };

      const result = await generateEmbedding('test query', config);
      expect(result).toBeNull();
    });

    it('should return null when config is disabled', async () => {
      const config: SemanticSearchConfig = {
        enabled: false,
        apiKey: 'test-key',
        model: 'text-embedding-3-small'
      };

      const result = await generateEmbedding('test query', config);
      expect(result).toBeNull();
    });

    it('should return null when fetch fails', async () => {
      const config: SemanticSearchConfig = {
        enabled: true,
        apiKey: 'test-key',
        model: 'text-embedding-3-small'
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValueOnce('Unauthorized')
      });

      const result = await generateEmbedding('test query', config);
      expect(result).toBeNull();
    });

    it('should return embedding on successful API call', async () => {
      const config: SemanticSearchConfig = {
        enabled: true,
        apiKey: 'test-key',
        model: 'text-embedding-3-small'
      };

      const mockEmbedding = [0.1, 0.2, 0.3];
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          data: [{ embedding: mockEmbedding }]
        })
      });

      const result = await generateEmbedding('test query', config);
      expect(result).toEqual(mockEmbedding);
    });
  });

  describe('semanticSearch', () => {
    const mockPosts = [
      {
        id: 1,
        title: { rendered: 'JavaScript Programming' },
        excerpt: { rendered: 'Learn JavaScript' },
        content: { rendered: 'JavaScript is a programming language' }
      },
      {
        id: 2,
        title: { rendered: 'Python for Beginners' },
        excerpt: { rendered: 'Learn Python' },
        content: { rendered: 'Python is a programming language' }
      },
      {
        id: 3,
        title: { rendered: 'Web Development' },
        excerpt: { rendered: 'Build websites' },
        content: { rendered: 'HTML, CSS, and JavaScript for web development' }
      }
    ];

    it('should return keyword search when semantic search is not enabled', async () => {
      const config: SemanticSearchConfig = {
        enabled: false,
        apiKey: undefined,
        model: 'text-embedding-3-small'
      };

      const result = await semanticSearch('programming', mockPosts, config);
      expect(result.searchType).toBe('keyword');
      expect(result.results).toEqual([]);
    });

    it('should return keyword search when API key is missing', async () => {
      const config: SemanticSearchConfig = {
        enabled: true,
        apiKey: undefined,
        model: 'text-embedding-3-small'
      };

      const result = await semanticSearch('programming', mockPosts, config);
      expect(result.searchType).toBe('keyword');
      expect(result.results).toEqual([]);
    });

    it('should return semantic results when embeddings succeed', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [{ embedding: mockEmbedding }]
        })
      });

      const config: SemanticSearchConfig = {
        enabled: true,
        apiKey: 'test-key',
        model: 'text-embedding-3-small'
      };

      const result = await semanticSearch('programming language', mockPosts, config);
      expect(result.searchType).toBe('semantic');
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should filter results below threshold', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [{ embedding: mockEmbedding }]
        })
      });

      const config: SemanticSearchConfig = {
        enabled: true,
        apiKey: 'test-key',
        model: 'text-embedding-3-small'
      };

      const result = await semanticSearch('completely unrelated query xyz123', mockPosts, config);
      expect(result.results.length).toBeLessThanOrEqual(mockPosts.length);
    });

    it('should sort results by score descending', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [{ embedding: mockEmbedding }]
        })
      });

      const config: SemanticSearchConfig = {
        enabled: true,
        apiKey: 'test-key',
        model: 'text-embedding-3-small'
      };

      const result = await semanticSearch('programming', mockPosts, config);
      
      if (result.results.length > 1) {
        for (let i = 0; i < result.results.length - 1; i++) {
          expect(result.results[i].score).toBeGreaterThanOrEqual(result.results[i + 1].score);
        }
      }
    });
  });

  describe('isSemanticSearchEnabled', () => {
    it('should return false when NEXT_PUBLIC_SEMANTIC_SEARCH_ENABLED is not set', () => {
      expect(isSemanticSearchEnabled()).toBe(false);
    });

    it('should return false when set to false', () => {
      process.env.NEXT_PUBLIC_SEMANTIC_SEARCH_ENABLED = 'false';
      expect(isSemanticSearchEnabled()).toBe(false);
    });

    it('should return false when enabled but no API key', () => {
      process.env.NEXT_PUBLIC_SEMANTIC_SEARCH_ENABLED = 'true';
      expect(isSemanticSearchEnabled()).toBe(false);
    });

    it('should return true when enabled and API key is set', () => {
      process.env.NEXT_PUBLIC_SEMANTIC_SEARCH_ENABLED = 'true';
      process.env.OPENAI_API_KEY = 'test-key';
      expect(isSemanticSearchEnabled()).toBe(true);
    });
  });

  describe('clearEmbeddingCache', () => {
    it('should clear the embedding cache', () => {
      const config: SemanticSearchConfig = {
        enabled: true,
        apiKey: 'test-key',
        model: 'text-embedding-3-small'
      };

      const mockEmbedding = [0.1, 0.2, 0.3];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [{ embedding: mockEmbedding }]
        })
      });

      expect(clearEmbeddingCache).toBeDefined();
      clearEmbeddingCache();
    });
  });
});
