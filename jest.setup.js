import '@testing-library/jest-dom'

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockRequest {
    constructor(url) {
      this.url = url
    }
  },
  NextResponse: {
    next: jest.fn(() => ({
      headers: {
        get: jest.fn(),
        set: jest.fn()
      }
    })),
    rewrite: jest.fn(),
    redirect: jest.fn(),
  }
}))

// Mock Next.js client components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))



// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((html) => {
    if (!html) return ''
    if (html === null || html === undefined) return ''
    
    // Basic sanitization for testing
    let sanitized = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/<iframe[^>]*data:text\/html[^>]*>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
    
    // Remove href attributes with javascript: content
    sanitized = sanitized.replace(/href="javascript:[^"]*"/gi, 'href=""')
    sanitized = sanitized.replace(/href='javascript:[^']*'/gi, 'href=""')
    
    // Remove dangerous iframe elements
    if (sanitized.includes('<iframe') && sanitized.includes('data:text/html')) {
      sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    }
    
    return sanitized
  }),
}))

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomBytes: jest.fn(() => ({
      toString: jest.fn(() => 'mock-nonce-123')
    }))
  }
})

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      response: {
        use: jest.fn(),
      },
    },
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    response: {
      use: jest.fn(),
    },
  },
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Suppress console warnings in tests
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps')
    ) {
      return
    }
    originalWarn(...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
})