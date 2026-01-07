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

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomBytes: jest.fn(() => ({
      toString: jest.fn(() => 'mock-nonce-123')
    }))
  }
})