import type { WordPressPost } from '@/types/wordpress';

export function createFallbackPost(id: string, title: string): WordPressPost {
  return {
    id: parseInt(id),
    title: { rendered: title },
    content: { rendered: '<p>Maaf, artikel tidak dapat dimuat saat ini. Silakan coba lagi nanti.</p>' },
    excerpt: { rendered: 'Maaf, artikel tidak dapat dimuat saat ini. Silakan coba lagi nanti.' },
    slug: `fallback-${id}`,
    date: new Date().toISOString(),
    modified: new Date().toISOString(),
    author: 0,
    featured_media: 0,
    categories: [],
    tags: [],
    status: 'publish',
    type: 'post',
    link: ''
  };
}
