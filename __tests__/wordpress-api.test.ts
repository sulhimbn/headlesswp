import { wordpressAPI } from '@/lib/wordpress';

describe('WordPress API', () => {
  it('should have wordpressAPI object', () => {
    expect(wordpressAPI).toBeDefined();
  });

  it('should have required methods', () => {
    expect(typeof wordpressAPI.getPosts).toBe('function');
    expect(typeof wordpressAPI.getPost).toBe('function');
    expect(typeof wordpressAPI.getPostById).toBe('function');
  });
});