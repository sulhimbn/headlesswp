require('@testing-library/jest-dom')
require('jest-axe/extend-expect')

process.env.WORDPRESS_URL = 'http://localhost:8080'
process.env.WORDPRESS_API_URL = 'http://localhost:8080/wp-json'
process.env.NEXT_PUBLIC_WORDPRESS_URL = 'http://localhost:8080'
process.env.NEXT_PUBLIC_WORDPRESS_API_URL = 'http://localhost:8080/wp-json'
process.env.NODE_ENV = 'test'

const originalSetInterval = global.setInterval
global.setInterval = function (...args) {
  const intervalId = originalSetInterval.apply(this, args)
  if (typeof intervalId.unref === 'function') {
    intervalId.unref()
  }
  return intervalId
}

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

// Mock window.matchMedia for dark mode tests
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