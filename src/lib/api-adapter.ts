import { WordPressPost } from '@/types/wordpress'

export interface GraphQLPost {
  id: string
  title: string
  slug: string
  date: string
  excerpt: string
  content: string
  author?: {
    node: {
      name: string
      slug: string
    }
  }
  featuredImage?: {
    node: {
      sourceUrl: string
      altText: string
    }
  }
  categories?: {
    nodes: Array<{
      id: string
      name: string
      slug: string
    }>
  }
  tags?: {
    nodes: Array<{
      id: string
      name: string
      slug: string
    }>
  }
}

// Convert WordPress REST API post to GraphQL format
export function convertRestToGraphQL(post: WordPressPost): GraphQLPost {
  return {
    id: post.id.toString(),
    title: post.title.rendered,
    slug: post.slug,
    date: post.date,
    excerpt: post.excerpt.rendered,
    content: post.content.rendered,
    author: post.author ? {
      node: {
        name: `Author ${post.author}`, // REST API doesn't include author name in basic response
        slug: `author-${post.author}`
      }
    } : undefined,
    featuredImage: post.featured_media ? {
      node: {
        sourceUrl: '', // Would need additional API call to get media details
        altText: ''
      }
    } : undefined,
    categories: {
      nodes: post.categories.map(catId => ({
        id: catId.toString(),
        name: `Category ${catId}`, // Would need additional API call to get category details
        slug: `category-${catId}`
      }))
    },
    tags: {
      nodes: post.tags.map(tagId => ({
        id: tagId.toString(),
        name: `Tag ${tagId}`, // Would need additional API call to get tag details
        slug: `tag-${tagId}`
      }))
    }
  }
}

// Fallback post for when API fails
export function createFallbackPost(slug: string): GraphQLPost {
  return {
    id: 'fallback',
    title: 'Artikel Tidak Tersedia',
    slug: slug,
    date: new Date().toISOString(),
    excerpt: 'Maaf, artikel tidak dapat dimuat saat ini. Silakan coba lagi nanti.',
    content: '<p>Maaf, artikel tidak dapat dimuat saat ini. Silakan coba lagi nanti.</p>',
    categories: { nodes: [] },
    tags: { nodes: [] }
  }
}