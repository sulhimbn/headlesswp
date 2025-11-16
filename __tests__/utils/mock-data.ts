import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress'

/**
 * Mock data factory for WordPress entities
 * Provides consistent test data across all test files
 */

export const createMockPost = (overrides: Partial<WordPressPost> = {}): WordPressPost => ({
  id: 1,
  title: { rendered: 'Test Post' },
  content: { rendered: '<p>Test content</p>' },
  excerpt: { rendered: '<p>Test excerpt</p>' },
  slug: 'test-post',
  date: '2024-01-01T00:00:00Z',
  modified: '2024-01-01T00:00:00Z',
  author: 1,
  featured_media: 1,
  categories: [1, 2],
  tags: [10, 20],
  status: 'publish',
  type: 'post',
  link: 'https://example.com/test-post',
  ...overrides
})

export const createMockCategory = (overrides: Partial<WordPressCategory> = {}): WordPressCategory => ({
  id: 1,
  name: 'Test Category',
  slug: 'test-category',
  description: 'Test category description',
  parent: 0,
  count: 5,
  ...overrides
})

export const createMockTag = (overrides: Partial<WordPressTag> = {}): WordPressTag => ({
  id: 10,
  name: 'Test Tag',
  slug: 'test-tag',
  description: 'Test tag description',
  count: 3,
  ...overrides
})

export const createMockMedia = (overrides: Partial<WordPressMedia> = {}): WordPressMedia => ({
  id: 1,
  title: { rendered: 'Test Media' },
  slug: 'test-media',
  source_url: 'https://example.com/image.jpg',
  media_type: 'image',
  mime_type: 'image/jpeg',
  ...overrides
})

export const createMockAuthor = (overrides: Partial<WordPressAuthor> = {}): WordPressAuthor => ({
  id: 1,
  name: 'Test Author',
  slug: 'test-author',
  description: 'Test author description',
  avatar_urls: { '24': 'https://example.com/avatar.jpg' },
  ...overrides
})

/**
 * Create multiple mock posts
 */
export const createMockPosts = (count: number, baseOverrides: Partial<WordPressPost> = {}): WordPressPost[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockPost({
      id: index + 1,
      title: { rendered: `Test Post ${index + 1}` },
      slug: `test-post-${index + 1}`,
      ...baseOverrides
    })
  )
}

/**
 * Create multiple mock categories
 */
export const createMockCategories = (count: number, baseOverrides: Partial<WordPressCategory> = {}): WordPressCategory[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockCategory({
      id: index + 1,
      name: `Test Category ${index + 1}`,
      slug: `test-category-${index + 1}`,
      ...baseOverrides
    })
  )
}

/**
 * Create multiple mock tags
 */
export const createMockTags = (count: number, baseOverrides: Partial<WordPressTag> = {}): WordPressTag[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockTag({
      id: index + 10,
      name: `Test Tag ${index + 1}`,
      slug: `test-tag-${index + 1}`,
      ...baseOverrides
    })
  )
}

/**
 * Specialized mock data for specific test scenarios
 */

export const createMockPostWithSpecialChars = (): WordPressPost => 
  createMockPost({
    title: { rendered: 'Post & "Special" <Characters>' },
    content: { rendered: '<p>Content with émojis 🎉 and unicode</p>' },
    excerpt: { rendered: '<p>Excerpt with "quotes" and \'apostrophes\'</p>' },
    slug: 'post-with-special-chars'
  })

export const createMockPostWithoutMedia = (): WordPressPost => 
  createMockPost({
    featured_media: 0
  })

export const createMockPostWithoutCategories = (): WordPressPost => 
  createMockPost({
    categories: []
  })

export const createMockPostWithoutTags = (): WordPressPost => 
  createMockPost({
    tags: []
  })

export const createMockPostWithLongContent = (): WordPressPost => 
  createMockPost({
    content: { 
      rendered: '<p>' + 'This is a long content. '.repeat(100) + '</p>' 
    },
    excerpt: { 
      rendered: '<p>' + 'This is a long excerpt. '.repeat(20) + '</p>' 
    }
  })

export const createMockPostWithHTMLContent = (): WordPressPost => 
  createMockPost({
    content: { 
      rendered: `
        <h2>Heading</h2>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
        <blockquote>Quote text</blockquote>
        <code>Inline code</code>
        <pre>Code block</pre>
      `
    }
  })

/**
 * Mock data for error scenarios
 */

export const createMockPostMissingFields = (): Partial<WordPressPost> => ({
  id: 1,
  title: { rendered: '' },
  content: { rendered: '' }
})

export const createMockPostWithMalformedHTML = (): WordPressPost => 
  createMockPost({
    content: { rendered: '<p>Unclosed paragraph<div>Nested div' },
    excerpt: { rendered: '<strong>Unclosed strong' }
  })

/**
 * Mock data for different dates
 */

export const createMockPostWithCustomDate = (date: string): WordPressPost => 
  createMockPost({
    date,
    modified: date
  })

export const createMockPostsFromDifferentDates = (): WordPressPost[] => [
  createMockPostWithCustomDate('2024-01-01T00:00:00Z'),
  createMockPostWithCustomDate('2024-02-15T12:30:00Z'),
  createMockPostWithCustomDate('2024-03-30T08:45:00Z')
]

/**
 * Mock data for pagination scenarios
 */

export const createMockPostsForPagination = (page: number, perPage: number = 10): WordPressPost[] => {
  const startIndex = (page - 1) * perPage
  return Array.from({ length: perPage }, (_, index) => 
    createMockPost({
      id: startIndex + index + 1,
      title: { rendered: `Post ${startIndex + index + 1} (Page ${page})` },
      slug: `post-${startIndex + index + 1}-page-${page}`
    })
  )
}

/**
 * Mock data for search scenarios
 */

export const createMockPostsForSearch = (query: string): WordPressPost[] => [
  createMockPost({
    id: 1,
    title: { rendered: `Post about ${query}` },
    content: { rendered: `<p>This post mentions ${query} multiple times. ${query} is important.</p>` },
    slug: `post-about-${query}`
  }),
  createMockPost({
    id: 2,
    title: { rendered: `Another ${query} related post` },
    content: { rendered: `<p>Content related to ${query} search.</p>` },
    slug: `another-${query}-post`
  })
]

/**
 * Mock data for category and tag filtering
 */

export const createMockPostsInCategory = (categoryId: number, count: number = 3): WordPressPost[] => 
  Array.from({ length: count }, (_, index) => 
    createMockPost({
      id: index + 1,
      title: { rendered: `Post ${index + 1} in Category ${categoryId}` },
      slug: `post-${index + 1}-category-${categoryId}`,
      categories: [categoryId]
    })
  )

export const createMockPostsWithTag = (tagId: number, count: number = 3): WordPressPost[] => 
  Array.from({ length: count }, (_, index) => 
    createMockPost({
      id: index + 1,
      title: { rendered: `Post ${index + 1} with Tag ${tagId}` },
      slug: `post-${index + 1}-tag-${tagId}`,
      tags: [tagId]
    })
  )

/**
 * Constants for test data
 */

export const TEST_CONSTANTS = {
  DEFAULT_POST_COUNT: 10,
  DEFAULT_CATEGORY_COUNT: 5,
  DEFAULT_TAG_COUNT: 8,
  PAGINATION_PER_PAGE: 10,
  SEARCH_QUERY: 'test query',
  SPECIAL_CHARACTERS: '&"<>\'',
  UNICODE_EMOJIS: '🎉🔒📊',
  LONG_CONTENT_LENGTH: 1000,
  MAX_RETRY_COUNT: 3
} as const

/**
 * Helper functions for test data validation
 */

export const validateMockPost = (post: WordPressPost): boolean => {
  return !!(
    post.id &&
    post.title?.rendered &&
    post.content?.rendered &&
    post.excerpt?.rendered &&
    post.slug &&
    post.date &&
    post.status &&
    post.type
  )
}

export const validateMockCategory = (category: WordPressCategory): boolean => {
  return !!(
    category.id &&
    category.name &&
    category.slug
  )
}

export const validateMockTag = (tag: WordPressTag): boolean => {
  return !!(
    tag.id &&
    tag.name &&
    tag.slug
  )
}

/**
 * Export all mock data as a single object for easy importing
 */

export const MOCK_DATA = {
  post: createMockPost(),
  category: createMockCategory(),
  tag: createMockTag(),
  media: createMockMedia(),
  author: createMockAuthor(),
  posts: createMockPosts(TEST_CONSTANTS.DEFAULT_POST_COUNT),
  categories: createMockCategories(TEST_CONSTANTS.DEFAULT_CATEGORY_COUNT),
  tags: createMockTags(TEST_CONSTANTS.DEFAULT_TAG_COUNT),
  specialChars: createMockPostWithSpecialChars(),
  withoutMedia: createMockPostWithoutMedia(),
  withoutCategories: createMockPostWithoutCategories(),
  withoutTags: createMockPostWithoutTags(),
  longContent: createMockPostWithLongContent(),
  htmlContent: createMockPostWithHTMLContent(),
  missingFields: createMockPostMissingFields(),
  malformedHTML: createMockPostWithMalformedHTML(),
  differentDates: createMockPostsFromDifferentDates(),
  searchResults: createMockPostsForSearch(TEST_CONSTANTS.SEARCH_QUERY),
  categoryPosts: createMockPostsInCategory(1),
  tagPosts: createMockPostsWithTag(10)
} as const