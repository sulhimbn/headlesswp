import { getFallbackPosts, FALLBACK_POSTS, FallbackPostType } from '@/lib/constants/fallbackPosts';

describe('getFallbackPosts', () => {
  it('should return LATEST fallback posts when type is "LATEST"', () => {
    const result = getFallbackPosts('LATEST');

    expect(result).toEqual([
      { id: '1', title: 'Berita Utama 1' },
      { id: '2', title: 'Berita Utama 2' },
      { id: '3', title: 'Berita Utama 3' }
    ]);
  });

  it('should return CATEGORY fallback posts when type is "CATEGORY"', () => {
    const result = getFallbackPosts('CATEGORY');

    expect(result).toEqual([
      { id: 'cat-1', title: 'Berita Kategori 1' },
      { id: 'cat-2', title: 'Berita Kategori 2' },
      { id: 'cat-3', title: 'Berita Kategori 3' }
    ]);
  });

  it('should return a new array instance on each call for LATEST', () => {
    const result1 = getFallbackPosts('LATEST');
    const result2 = getFallbackPosts('LATEST');

    expect(result1).not.toBe(result2);
    expect(result1).toEqual(result2);
  });

  it('should return a new array instance on each call for CATEGORY', () => {
    const result1 = getFallbackPosts('CATEGORY');
    const result2 = getFallbackPosts('CATEGORY');

    expect(result1).not.toBe(result2);
    expect(result1).toEqual(result2);
  });

  it('should preserve original FALLBACK_POSTS constant immutability', () => {
    const result = getFallbackPosts('LATEST');
    result[0] = { id: 'modified', title: 'Modified' };

    const newResult = getFallbackPosts('LATEST');

    expect(newResult[0]).toEqual({ id: '1', title: 'Berita Utama 1' });
    expect(result[0]).toEqual({ id: 'modified', title: 'Modified' });
  });

  it('should have TypeScript type safety for FallbackPostType', () => {
    const type1: FallbackPostType = 'LATEST';
    const type2: FallbackPostType = 'CATEGORY';

    expect(() => getFallbackPosts(type1)).not.toThrow();
    expect(() => getFallbackPosts(type2)).not.toThrow();
  });

  it('should return array with correct structure for LATEST', () => {
    const result = getFallbackPosts('LATEST');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    result.forEach(post => {
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('title');
      expect(typeof post.id).toBe('string');
      expect(typeof post.title).toBe('string');
    });
  });

  it('should return array with correct structure for CATEGORY', () => {
    const result = getFallbackPosts('CATEGORY');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    result.forEach(post => {
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('title');
      expect(typeof post.id).toBe('string');
      expect(typeof post.title).toBe('string');
    });
  });

  it('should have LATEST posts with numbered IDs', () => {
    const result = getFallbackPosts('LATEST');

    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
    expect(result[2].id).toBe('3');
  });

  it('should have CATEGORY posts with prefixed IDs', () => {
    const result = getFallbackPosts('CATEGORY');

    expect(result[0].id).toBe('cat-1');
    expect(result[1].id).toBe('cat-2');
    expect(result[2].id).toBe('cat-3');
  });

  it('should have consistent title format for LATEST posts', () => {
    const result = getFallbackPosts('LATEST');

    expect(result[0].title).toMatch(/^Berita Utama \d+$/);
    expect(result[1].title).toMatch(/^Berita Utama \d+$/);
    expect(result[2].title).toMatch(/^Berita Utama \d+$/);
  });

  it('should have consistent title format for CATEGORY posts', () => {
    const result = getFallbackPosts('CATEGORY');

    expect(result[0].title).toMatch(/^Berita Kategori \d+$/);
    expect(result[1].title).toMatch(/^Berita Kategori \d+$/);
    expect(result[2].title).toMatch(/^Berita Kategori \d+$/);
  });

  it('should match FALLBACK_POSTS constant for LATEST', () => {
    const result = getFallbackPosts('LATEST');

    expect(result).toEqual(FALLBACK_POSTS.LATEST);
    expect(result).not.toBe(FALLBACK_POSTS.LATEST);
  });

  it('should match FALLBACK_POSTS constant for CATEGORY', () => {
    const result = getFallbackPosts('CATEGORY');

    expect(result).toEqual(FALLBACK_POSTS.CATEGORY);
    expect(result).not.toBe(FALLBACK_POSTS.CATEGORY);
  });

  it('should return immutable copy of LATEST fallback posts', () => {
    const result = getFallbackPosts('LATEST');
    result.push({ id: '4', title: 'New Post' });

    const original = FALLBACK_POSTS.LATEST as ReadonlyArray<{ id: string; title: string }>;

    expect(original.length).toBe(3);
    expect(original).not.toContainEqual({ id: '4', title: 'New Post' });
  });

  it('should return immutable copy of CATEGORY fallback posts', () => {
    const result = getFallbackPosts('CATEGORY');
    result.push({ id: 'cat-4', title: 'New Category Post' });

    const original = FALLBACK_POSTS.CATEGORY as ReadonlyArray<{ id: string; title: string }>;

    expect(original.length).toBe(3);
    expect(original).not.toContainEqual({ id: 'cat-4', title: 'New Category Post' });
  });

  it('should handle modification of returned array without affecting original constant', () => {
    const latest1 = getFallbackPosts('LATEST');
    const category1 = getFallbackPosts('CATEGORY');

    latest1[0] = { id: 'changed-1', title: 'Changed' };
    category1[0] = { id: 'changed-cat-1', title: 'Changed Category' };

    const latest2 = getFallbackPosts('LATEST');
    const category2 = getFallbackPosts('CATEGORY');

    expect(latest2[0]).toEqual({ id: '1', title: 'Berita Utama 1' });
    expect(category2[0]).toEqual({ id: 'cat-1', title: 'Berita Kategori 1' });
  });

  it('should have all LATEST post titles in Indonesian', () => {
    const result = getFallbackPosts('LATEST');

    result.forEach(post => {
      expect(post.title).toContain('Berita Utama');
    });
  });

  it('should have all CATEGORY post titles in Indonesian', () => {
    const result = getFallbackPosts('CATEGORY');

    result.forEach(post => {
      expect(post.title).toContain('Berita Kategori');
    });
  });

  it('should use spread operator to create new array', () => {
    const result = getFallbackPosts('LATEST');

    expect(result).toEqual([...FALLBACK_POSTS.LATEST]);
  });

  it('should maintain type compatibility with expected fallback post structure', () => {
    const result = getFallbackPosts('LATEST');

    result.forEach(post => {
      expect(post).toMatchObject({
        id: expect.any(String),
        title: expect.any(String)
      });
    });
  });
});
