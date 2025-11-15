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