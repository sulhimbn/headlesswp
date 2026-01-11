require('@testing-library/jest-dom')

process.env.WORDPRESS_URL = 'http://localhost:8080'
process.env.WORDPRESS_API_URL = 'http://localhost:8080/wp-json'
process.env.NEXT_PUBLIC_WORDPRESS_URL = 'http://localhost:8080'
process.env.NEXT_PUBLIC_WORDPRESS_API_URL = 'http://localhost:8080/wp-json'

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
    }))
  }
}))

// Mock Next.js app router hooks
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockBack = jest.fn()
const mockForward = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    forward: mockForward,
  })),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}))

// Use Node.js webcrypto for getRandomValues API (same as browser)
const nodeCrypto = require('crypto')

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: nodeCrypto.webcrypto.getRandomValues.bind(nodeCrypto.webcrypto),
    randomBytes: nodeCrypto.randomBytes.bind(nodeCrypto)
  },
  configurable: true,
  writable: true
})