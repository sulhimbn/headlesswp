import { tokenize, extractSearchableText, calculateRelevanceScore, rankPostsByRelevance } from '@/lib/search/searchRelevance';
import type { WordPressPost } from '@/types/wordpress';

const createMockPost = (overrides: Partial<WordPressPost> = {}): WordPressPost => ({
  id: 1,
  title: { rendered: '<p>Test Title</p>' },
  content: { rendered: '<p>Test content with keywords here</p>' },
  excerpt: { rendered: '<p>Test excerpt</p>' },
  date: '2024-01-01T00:00:00Z',
  modified: '2024-01-01T00:00:00Z',
  slug: 'test-post',
  type: 'post',
  status: 'publish',
  author: 1,
  categories: [],
  tags: [],
  featured_media: 0,
  link: 'https://example.com/test-post',
  ...overrides,
});

describe('searchRelevance', () => {
  describe('tokenize', () => {
    it('should tokenize simple text', () => {
      expect(tokenize('hello world')).toEqual(['hello', 'world']);
    });

    it('should lowercase text', () => {
      expect(tokenize('Hello World')).toEqual(['hello', 'world']);
    });

    it('should remove punctuation', () => {
      expect(tokenize('hello, world!')).toEqual(['hello', 'world']);
    });

    it('should handle multiple spaces', () => {
      expect(tokenize('hello   world')).toEqual(['hello', 'world']);
    });

    it('should handle empty string', () => {
      expect(tokenize('')).toEqual([]);
    });

    it('should handle unicode characters', () => {
      expect(tokenize('hello مرحبا')).toEqual(['hello', 'مرحبا']);
    });
  });

  describe('extractSearchableText', () => {
    it('should extract text from HTML', () => {
      const post = createMockPost({
        title: { rendered: '<h1>Title</h1>' },
        excerpt: { rendered: '<p>Excerpt</p>' },
        content: { rendered: '<p>Content</p>' },
      });
      const result = extractSearchableText(post);
      expect(result.title).toBe('Title');
      expect(result.excerpt).toBe('Excerpt');
      expect(result.content).toBe('Content');
    });

    it('should handle empty HTML', () => {
      const post = createMockPost({
        title: { rendered: '' },
        excerpt: { rendered: '' },
        content: { rendered: '' },
      });
      const result = extractSearchableText(post);
      expect(result.title).toBe('');
      expect(result.excerpt).toBe('');
      expect(result.content).toBe('');
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should give high score for title matches', () => {
      const post = createMockPost({ title: { rendered: 'React Tutorial' } });
      const score = calculateRelevanceScore(post, 'react');
      expect(score).toBeGreaterThan(0);
    });

    it('should give higher score for exact phrase match', () => {
      const post = createMockPost({ title: { rendered: 'React Tutorial' } });
      const exactScore = calculateRelevanceScore(post, 'react tutorial');
      const partialScore = calculateRelevanceScore(post, 'react');
      expect(exactScore).toBeGreaterThan(partialScore);
    });

    it('should give higher score for excerpt matches than content matches', () => {
      const postEx = createMockPost({ excerpt: { rendered: 'react' } });
      const postContent = createMockPost({ content: { rendered: 'react' } });
      const exScore = calculateRelevanceScore(postEx, 'react');
      const contentScore = calculateRelevanceScore(postContent, 'react');
      expect(exScore).toBeGreaterThan(contentScore);
    });

    it('should return 0 for empty query', () => {
      const post = createMockPost();
      const score = calculateRelevanceScore(post, '');
      expect(score).toBe(0);
    });

    it('should handle multiple query tokens', () => {
      const post = createMockPost({ title: { rendered: 'React Hooks Tutorial' } });
      const score = calculateRelevanceScore(post, 'react hooks');
      expect(score).toBeGreaterThan(0);
    });

    it('should support custom weights', () => {
      const post = createMockPost({ title: { rendered: 'test' } });
      const highWeight = calculateRelevanceScore(post, 'test', { titleWeight: 100, excerptWeight: 1, contentWeight: 1, exactPhraseBonus: 0 });
      const defaultWeight = calculateRelevanceScore(post, 'test');
      expect(highWeight).toBeGreaterThan(defaultWeight);
    });
  });

  describe('rankPostsByRelevance', () => {
    it('should sort posts by relevance score', () => {
      const posts = [
        createMockPost({ id: 1, title: { rendered: 'Random Post' }, content: { rendered: 'some react content' } }),
        createMockPost({ id: 2, title: { rendered: 'React Hooks Tutorial' }, content: { rendered: 'content' } }),
        createMockPost({ id: 3, title: { rendered: 'Vue' }, content: { rendered: 'content' } }),
      ];
      const ranked = rankPostsByRelevance(posts, 'react');
      expect(ranked[0].id).toBe(2);
      expect(ranked[1].id).toBe(1);
      expect(ranked[2].id).toBe(3);
    });

    it('should preserve all posts when query is empty', () => {
      const posts = [
        createMockPost({ id: 1 }),
        createMockPost({ id: 2 }),
      ];
      const ranked = rankPostsByRelevance(posts, '');
      expect(ranked).toHaveLength(2);
    });

    it('should assign zero score to all posts for empty query', () => {
      const posts = [createMockPost({ id: 1 }), createMockPost({ id: 2 })];
      const ranked = rankPostsByRelevance(posts, '');
      expect(ranked.every(p => p.relevanceScore === 0)).toBe(true);
    });

    it('should handle posts with no matching content', () => {
      const posts = [
        createMockPost({ id: 1, title: { rendered: 'React' } }),
        createMockPost({ id: 2, title: { rendered: 'Vue' } }),
      ];
      const ranked = rankPostsByRelevance(posts, 'angular');
      expect(ranked[0].relevanceScore).toBe(0);
      expect(ranked[1].relevanceScore).toBe(0);
    });
  });
});