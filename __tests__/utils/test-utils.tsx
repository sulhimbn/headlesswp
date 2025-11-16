import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock WordPress API responses
export const mockWordPressPosts = [
  {
    id: 1,
    title: { rendered: 'Test Post 1' },
    excerpt: { rendered: '<p>Test excerpt 1</p>' },
    content: { rendered: '<p>Test content 1</p>' },
    slug: 'test-post-1',
    date: '2023-01-01T00:00:00',
    categories: [1],
    tags: [1, 2],
    featured_media: 1,
  },
  {
    id: 2,
    title: { rendered: 'Test Post 2' },
    excerpt: { rendered: '<p>Test excerpt 2</p>' },
    content: { rendered: '<p>Test content 2</p>' },
    slug: 'test-post-2',
    date: '2023-01-02T00:00:00',
    categories: [2],
    tags: [3],
    featured_media: 2,
  },
]

export const mockWordPressCategories = [
  {
    id: 1,
    name: 'Technology',
    slug: 'technology',
    description: 'Technology related posts',
    count: 10,
  },
  {
    id: 2,
    name: 'News',
    slug: 'news',
    description: 'News posts',
    count: 5,
  },
]

export const mockWordPressTags = [
  {
    id: 1,
    name: 'JavaScript',
    slug: 'javascript',
    description: 'JavaScript related posts',
    count: 8,
  },
  {
    id: 2,
    name: 'React',
    slug: 'react',
    description: 'React posts',
    count: 6,
  },
]

export const mockWordPressMedia = [
  {
    id: 1,
    source_url: 'https://example.com/image1.jpg',
    alt_text: 'Test image 1',
    media_details: {
      width: 800,
      height: 600,
      sizes: {
        thumbnail: {
          source_url: 'https://example.com/image1-150x150.jpg',
          width: 150,
          height: 150,
        },
        medium: {
          source_url: 'https://example.com/image1-300x225.jpg',
          width: 300,
          height: 225,
        },
      },
    },
  },
  {
    id: 2,
    source_url: 'https://example.com/image2.jpg',
    alt_text: 'Test image 2',
    media_details: {
      width: 1200,
      height: 800,
      sizes: {
        thumbnail: {
          source_url: 'https://example.com/image2-150x150.jpg',
          width: 150,
          height: 150,
        },
        medium: {
          source_url: 'https://example.com/image2-300x200.jpg',
          width: 300,
          height: 200,
        },
      },
    },
  },
]

// Custom render function with basic wrapper
const customRender = (
  ui: ReactElement,
  options?: RenderOptions
) => {
  return render(ui, options)
}

// Mock handlers for common testing scenarios
export const mockHandlers = {
  // WordPress API handlers
  getPosts: jest.fn(),
  getPostBySlug: jest.fn(),
  getCategories: jest.fn(),
  getTags: jest.fn(),
  getMediaById: jest.fn(),
  
  // Navigation handlers
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  
  // Performance monitoring handlers
  getCLS: jest.fn(),
  getFID: jest.fn(),
  getFCP: jest.fn(),
  getLCP: jest.fn(),
  getTTFB: jest.fn(),
}

// Mock data generators
export const createMockPost = (overrides: Partial<typeof mockWordPressPosts[0]> = {}) => ({
  id: Math.floor(Math.random() * 1000),
  title: { rendered: 'Mock Post Title' },
  excerpt: { rendered: '<p>Mock post excerpt</p>' },
  content: { rendered: '<p>Mock post content</p>' },
  slug: 'mock-post-slug',
  date: new Date().toISOString(),
  categories: [1],
  tags: [1],
  featured_media: 1,
  ...overrides,
})

export const createMockCategory = (overrides: Partial<typeof mockWordPressCategories[0]> = {}) => ({
  id: Math.floor(Math.random() * 100),
  name: 'Mock Category',
  slug: 'mock-category',
  description: 'Mock category description',
  count: 5,
  ...overrides,
})

export const createMockTag = (overrides: Partial<typeof mockWordPressTags[0]> = {}) => ({
  id: Math.floor(Math.random() * 100),
  name: 'Mock Tag',
  slug: 'mock-tag',
  description: 'Mock tag description',
  count: 3,
  ...overrides,
})

// Test utilities
export const waitForLoadingToFinish = () => new Promise(resolve => setTimeout(resolve, 0))

export const createMockEvent = (type: string, properties: Record<string, any> = {}) => {
  const event = new Event(type)
  Object.assign(event, properties)
  return event
}

// Environment helpers
export const setMockEnvironment = (env: 'development' | 'production' | 'test') => {
  const originalEnv = process.env.NODE_ENV
  process.env.NODE_ENV = env
  return originalEnv
}

export const restoreEnvironment = (originalEnv: string | undefined) => {
  process.env.NODE_ENV = originalEnv
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { customRender as render }

// Default export for convenience
export default {
  render: customRender,
  mockWordPressPosts,
  mockWordPressCategories,
  mockWordPressTags,
  mockWordPressMedia,
  mockHandlers,
  createMockPost,
  createMockCategory,
  createMockTag,
  waitForLoadingToFinish,
  createMockEvent,
  setMockEnvironment,
  restoreEnvironment,
}