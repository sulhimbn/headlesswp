import { semanticSearch, fallbackSearch } from '@/lib/services/semanticSearch';
import { wordpressAPI } from '@/lib/wordpress';
import { expandWithSynonyms, getCanonicalForm, findRelatedTerms } from '@/lib/utils/synonyms';

jest.mock('@/lib/wordpress');

describe('synonyms', () => {
  describe('expandWithSynonyms', () => {
    it('should return original words plus synonyms', () => {
      const result = expandWithSynonyms('technology');
      expect(result).toContain('technology');
      expect(result).toContain('tech');
      expect(result).toContain('teknologi');
    });

    it('should handle multiple words', () => {
      const result = expandWithSynonyms('technology news');
      expect(result).toContain('technology');
      expect(result).toContain('news');
    });

    it('should handle unknown words', () => {
      const result = expandWithSynonyms('unknownword123');
      expect(result).toEqual(['unknownword123']);
    });

    it('should not duplicate words', () => {
      const result = expandWithSynonyms('news news');
      const newsCount = result.filter(w => w === 'news').length;
      expect(newsCount).toBe(1);
    });
  });

  describe('getCanonicalForm', () => {
    it('should return canonical form for synonyms', () => {
      expect(getCanonicalForm('tech')).toBe('technology');
    });

    it('should return original word if not a synonym', () => {
      expect(getCanonicalForm('randomword')).toBe('randomword');
    });

    it('should handle case insensitive input', () => {
      expect(getCanonicalForm('TECH')).toBe('technology');
    });
  });

  describe('findRelatedTerms', () => {
    it('should return related terms up to maxTerms', () => {
      const result = findRelatedTerms('technology', 3);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should include original query terms', () => {
      const result = findRelatedTerms('testquery');
      expect(result).toContain('testquery');
    });
  });
});

describe('semanticSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPosts = [
    {
      id: 1,
      title: { rendered: 'Technology News Today' },
      excerpt: { rendered: '<p>Latest technology updates</p>' },
      slug: 'tech-news',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      categories: [1],
      tags: [],
      featured_media: 0,
      status: 'publish',
      type: 'post',
      link: 'https://example.com/tech-news'
    },
    {
      id: 2,
      title: { rendered: 'Sports Update' },
      excerpt: { rendered: '<p>Sports news and scores</p>' },
      slug: 'sports-update',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      categories: [2],
      tags: [],
      featured_media: 0,
      status: 'publish',
      type: 'post',
      link: 'https://example.com/sports-update'
    }
  ];

  it('should perform semantic search and return results', async () => {
    (wordpressAPI.search as jest.Mock).mockResolvedValue({
      posts: mockPosts,
      totalPages: 1
    });

    const result = await semanticSearch('technology', 1, 10);

    expect(result.posts).toBeDefined();
    expect(result.relatedTerms.length).toBeGreaterThan(0);
    expect(wordpressAPI.search).toHaveBeenCalled();
  });

  it('should fallback to keyword search on timeout', async () => {
    let callCount = 0;
    (wordpressAPI.search as jest.Mock).mockImplementation(
      () => {
        callCount++;
        if (callCount === 1) {
          return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 100));
        }
        return Promise.resolve({ posts: [], totalPages: 0 });
      }
    );

    const result = await semanticSearch('test', 1, 10, { timeoutMs: 50 });

    expect(result.usedFallback).toBe(true);
    expect(result.semanticScore).toBe(0);
  }, 200);

  it('should fallback to keyword search on error', async () => {
    let callCount = 0;
    (wordpressAPI.search as jest.Mock).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('API error'));
      }
      return Promise.resolve({ posts: [], totalPages: 0 });
    });

    const result = await semanticSearch('test', 1, 10);

    expect(result.usedFallback).toBe(true);
    expect(result.posts).toEqual([]);
  });

  it('should disable synonym expansion when configured', async () => {
    (wordpressAPI.search as jest.Mock).mockResolvedValue({
      posts: mockPosts,
      totalPages: 1
    });

    const result = await semanticSearch('technology', 1, 10, { 
      enableSynonymExpansion: false 
    });

    expect(result.relatedTerms).toEqual([]);
  });

  it('should disable reranking when configured', async () => {
    (wordpressAPI.search as jest.Mock).mockResolvedValue({
      posts: mockPosts,
      totalPages: 1
    });

    const result = await semanticSearch('technology', 1, 10, { 
      enableReranking: false 
    });

    expect(result.semanticScore).toBe(1);
  });

  it('should respect similarity threshold', async () => {
    (wordpressAPI.search as jest.Mock).mockResolvedValue({
      posts: mockPosts,
      totalPages: 1
    });

    const result = await semanticSearch('xyz123', 1, 10, { 
      similarityThreshold: 0.8 
    });

    expect(result.posts.length).toBeLessThanOrEqual(mockPosts.length);
  });
});

describe('fallbackSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return fallback search results', async () => {
    const mockPosts = [
      {
        id: 1,
        title: { rendered: 'Test Post' },
        excerpt: { rendered: '<p>Test content</p>' },
        slug: 'test-post',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        categories: [],
        tags: [],
        featured_media: 0,
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post'
      }
    ];

    (wordpressAPI.search as jest.Mock).mockResolvedValue({
      posts: mockPosts,
      totalPages: 1
    });

    const result = await fallbackSearch('test', 1, 10);

    expect(result.usedFallback).toBe(true);
    expect(result.semanticScore).toBe(0);
    expect(result.posts).toEqual(mockPosts);
  });
});
