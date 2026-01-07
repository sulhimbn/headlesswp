export const FALLBACK_POSTS = {
  LATEST: [
    { id: '1', title: 'Berita Utama 1' },
    { id: '2', title: 'Berita Utama 2' },
    { id: '3', title: 'Berita Utama 3' }
  ],
  CATEGORY: [
    { id: 'cat-1', title: 'Berita Kategori 1' },
    { id: 'cat-2', title: 'Berita Kategori 2' },
    { id: 'cat-3', title: 'Berita Kategori 3' }
  ]
} as const;

export type FallbackPostType = keyof typeof FALLBACK_POSTS;

export function getFallbackPosts(type: FallbackPostType): Array<{ id: string; title: string }> {
  return [...FALLBACK_POSTS[type]];
}
