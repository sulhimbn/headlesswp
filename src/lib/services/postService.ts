import { wordpressAPI } from '@/lib/wordpress'
import { WordPressPost } from '@/types/wordpress'

function createFallbackPost(id: string, title: string): WordPressPost {
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
  }
}

export const postService = {
  getLatestPosts: async (): Promise<WordPressPost[]> => {
    try {
      return await wordpressAPI.getPosts({ per_page: 6 })
    } catch (error) {
      console.warn('Failed to fetch latest posts during build:', error)
      return [
        createFallbackPost('1', 'Berita Utama 1'),
        createFallbackPost('2', 'Berita Utama 2'),
        createFallbackPost('3', 'Berita Utama 3')
      ]
    }
  },

  getCategoryPosts: async (): Promise<WordPressPost[]> => {
    try {
      return await wordpressAPI.getPosts({ per_page: 3 })
    } catch (error) {
      console.warn('Failed to fetch category posts during build:', error)
      return [
        createFallbackPost('cat-1', 'Berita Kategori 1'),
        createFallbackPost('cat-2', 'Berita Kategori 2'),
        createFallbackPost('cat-3', 'Berita Kategori 3')
      ]
    }
  },

  getPostBySlug: async (slug: string): Promise<WordPressPost | null> => {
    try {
      const post = await wordpressAPI.getPost(slug)
      return post || null
    } catch (error) {
      console.error(`Error fetching post with slug ${slug}:`, error)
      return null
    }
  }
}

export default postService
