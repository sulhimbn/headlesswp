import { CACHE_CONFIG, CACHE_TTL } from '@/lib/cache/cacheConfig';
import { CACHE_TIMES } from '@/lib/api/config';

describe('CACHE_CONFIG', () => {
  describe('TTL values', () => {
    it('should have POSTS TTL as medium-short', () => {
      expect(CACHE_CONFIG.POSTS).toBe(CACHE_TIMES.MEDIUM_SHORT);
    });

    it('should have POST TTL as medium', () => {
      expect(CACHE_CONFIG.POST).toBe(CACHE_TIMES.MEDIUM);
    });

    it('should have CATEGORIES TTL as medium-long', () => {
      expect(CACHE_CONFIG.CATEGORIES).toBe(CACHE_TIMES.MEDIUM_LONG);
    });

    it('should have TAGS TTL as medium-long', () => {
      expect(CACHE_CONFIG.TAGS).toBe(CACHE_TIMES.MEDIUM_LONG);
    });

    it('should have MEDIA TTL as long', () => {
      expect(CACHE_CONFIG.MEDIA).toBe(CACHE_TIMES.LONG);
    });

    it('should have SEARCH TTL as short', () => {
      expect(CACHE_CONFIG.SEARCH).toBe(CACHE_TIMES.SHORT);
    });

    it('should have AUTHOR TTL as medium-long', () => {
      expect(CACHE_CONFIG.AUTHOR).toBe(CACHE_TIMES.MEDIUM_LONG);
    });

    it('should have SITEMAP TTL', () => {
      expect(CACHE_CONFIG.SITEMAP).toBe(CACHE_TIMES.SITEMAP);
    });
  });

  describe('TTL relationships', () => {
    it('should have shorter TTL for SEARCH than POSTS', () => {
      expect(CACHE_CONFIG.SEARCH).toBeLessThan(CACHE_CONFIG.POSTS);
    });

    it('should have shorter TTL for POSTS than POST', () => {
      expect(CACHE_CONFIG.POSTS).toBeLessThan(CACHE_CONFIG.POST);
    });

    it('should have shorter TTL for POST than CATEGORIES', () => {
      expect(CACHE_CONFIG.POST).toBeLessThan(CACHE_CONFIG.CATEGORIES);
    });

    it('should have shorter TTL for CATEGORIES than MEDIA', () => {
      expect(CACHE_CONFIG.CATEGORIES).toBeLessThan(CACHE_CONFIG.MEDIA);
    });
  });

  describe('CACHE_TTL backward compatibility', () => {
    it('should export same values as CACHE_CONFIG', () => {
      expect(CACHE_TTL.POSTS).toBe(CACHE_CONFIG.POSTS);
      expect(CACHE_TTL.POST).toBe(CACHE_CONFIG.POST);
      expect(CACHE_TTL.CATEGORIES).toBe(CACHE_CONFIG.CATEGORIES);
      expect(CACHE_TTL.TAGS).toBe(CACHE_CONFIG.TAGS);
      expect(CACHE_TTL.MEDIA).toBe(CACHE_CONFIG.MEDIA);
      expect(CACHE_TTL.SEARCH).toBe(CACHE_CONFIG.SEARCH);
      expect(CACHE_TTL.AUTHOR).toBe(CACHE_CONFIG.AUTHOR);
      expect(CACHE_TTL.SITEMAP).toBe(CACHE_CONFIG.SITEMAP);
    });
  });

  describe('structure', () => {
    it('should have all expected properties', () => {
      const keys = Object.keys(CACHE_CONFIG);
      expect(keys).toContain('POSTS');
      expect(keys).toContain('POST');
      expect(keys).toContain('CATEGORIES');
      expect(keys).toContain('TAGS');
      expect(keys).toContain('MEDIA');
      expect(keys).toContain('SEARCH');
      expect(keys).toContain('AUTHOR');
      expect(keys).toContain('SITEMAP');
    });

    it('should have all numeric TTL values', () => {
      expect(typeof CACHE_CONFIG.POSTS).toBe('number');
      expect(typeof CACHE_CONFIG.POST).toBe('number');
      expect(typeof CACHE_CONFIG.CATEGORIES).toBe('number');
      expect(typeof CACHE_CONFIG.TAGS).toBe('number');
      expect(typeof CACHE_CONFIG.MEDIA).toBe('number');
      expect(typeof CACHE_CONFIG.SEARCH).toBe('number');
      expect(typeof CACHE_CONFIG.AUTHOR).toBe('number');
      expect(typeof CACHE_CONFIG.SITEMAP).toBe('number');
    });
  });
});