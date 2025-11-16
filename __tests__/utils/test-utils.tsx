import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import '@testing-library/jest-dom'

/**
 * Custom render function that includes common providers
 * Use this instead of RTL's render for consistent test setup
 */

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add custom options here if needed
}

/**
 * Custom render function with common setup
 */
export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  // Add any global providers here
  // For example: ThemeProvider, RouterProvider, etc.
  
  return render(ui, {
    ...options,
  })
}

/**
 * Mock common Next.js components
 */
export const mockNextComponents = () => {
  jest.mock('next/link', () => {
    return function MockLink({ children, href, ...props }: any) {
      return <a href={href} {...props}>{children}</a>
    }
  })

  jest.mock('next/image', () => {
    return function MockImage({ alt, ...props }: any) {
      return <img alt={alt} {...props} />
    }
  })

  jest.mock('next/router', () => ({
    useRouter: () => ({
      push: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }),
  }))

  jest.mock('next/navigation', () => ({
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
    notFound: jest.fn(),
    redirect: jest.fn(),
  }))
}

/**
 * Mock WordPress API
 */
export const mockWordPressAPI = () => {
  jest.mock('@/lib/wordpress', () => ({
    wordpressAPI: {
      getPosts: jest.fn(),
      getPost: jest.fn(),
      getPostById: jest.fn(),
      getCategories: jest.fn(),
      getCategory: jest.fn(),
      getTags: jest.fn(),
      getTag: jest.fn(),
      getMedia: jest.fn(),
      getAuthor: jest.fn(),
      search: jest.fn(),
    },
  }))
}

/**
 * Mock console methods to avoid noise in tests
 */
export const mockConsole = () => {
  const originalConsole = {
    error: console.error,
    warn: console.warn,
    log: console.log,
  }

  beforeEach(() => {
    console.error = jest.fn()
    console.warn = jest.fn()
    console.log = jest.fn()
  })

  afterEach(() => {
    console.error = originalConsole.error
    console.warn = originalConsole.warn
    console.log = originalConsole.log
  })

  return originalConsole
}

/**
 * Mock IntersectionObserver for components that use it
 */
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
}

/**
 * Mock ResizeObserver for components that use it
 */
export const mockResizeObserver = () => {
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
}

/**
 * Mock window.matchMedia for responsive components
 */
export const mockMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

/**
 * Mock localStorage and sessionStorage
 */
export const mockStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  })
  
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
  })

  return { localStorage: localStorageMock, sessionStorage: sessionStorageMock }
}

/**
 * Setup common mocks for all tests
 */
export const setupCommonMocks = () => {
  mockNextComponents()
  mockWordPressAPI()
  mockIntersectionObserver()
  mockResizeObserver()
  mockMatchMedia()
  mockStorage()
}

/**
 * Wait for a specified amount of time (useful for async operations)
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Helper to test async components
 */
export const renderAsync = async (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const renderResult = customRender(ui, options)
  
  // Wait for any async operations to complete
  await waitFor(0)
  
  return renderResult
}

/**
 * Helper to test error boundaries
 */
export const throwError = (message: string) => {
  throw new Error(message)
}

/**
 * Helper to test loading states
 */
export const createLoadingPromise = <T>(data: T, delay: number = 100): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay)
  })
}

/**
 * Helper to test error scenarios
 */
export const createErrorPromise = (error: Error, delay: number = 100): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(error), delay)
  })
}

/**
 * Helper to mock API responses with delays
 */
export const mockAPIWithDelay = <T>(
  mockFn: jest.MockedFunction<any>,
  data: T,
  delay: number = 100
) => {
  mockFn.mockImplementation(() => createLoadingPromise(data, delay))
}

/**
 * Helper to mock API errors with delays
 */
export const mockAPIErrorWithDelay = (
  mockFn: jest.MockedFunction<any>,
  error: Error,
  delay: number = 100
) => {
  mockFn.mockImplementation(() => createErrorPromise(error, delay))
}

/**
 * Helper to test responsive behavior
 */
export const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })

  // Trigger resize event
  window.dispatchEvent(new Event('resize'))
}

/**
 * Helper to test different screen sizes
 */
export const testResponsive = {
  mobile: () => setViewport(375, 667),
  tablet: () => setViewport(768, 1024),
  desktop: () => setViewport(1024, 768),
  wide: () => setViewport(1920, 1080),
}

/**
 * Helper to test scroll behavior
 */
export const mockScroll = () => {
  Object.defineProperty(window, 'scrollY', {
    writable: true,
    value: 0,
  })
  
  Object.defineProperty(window, 'pageYOffset', {
    writable: true,
    value: 0,
  })

  window.scrollTo = jest.fn()
  window.scrollBy = jest.fn()
}

/**
 * Helper to test focus behavior
 */
export const mockFocus = () => {
  HTMLElement.prototype.focus = jest.fn()
  HTMLElement.prototype.blur = jest.fn()
}

/**
 * Helper to test clipboard API
 */
export const mockClipboard = () => {
  const mockClipboard = {
    writeText: jest.fn(),
    readText: jest.fn(),
  }
  
  Object.defineProperty(navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
  })

  return mockClipboard
}

/**
 * Helper to test geolocation API
 */
export const mockGeolocation = () => {
  const mockGeolocation = {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  }
  
  Object.defineProperty(navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
  })

  return mockGeolocation
}

/**
 * Helper to clean up all mocks
 */
export const cleanupMocks = () => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
}

/**
 * Re-export testing library utilities
 */
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

/**
 * Export custom render as default
 */
export default customRender