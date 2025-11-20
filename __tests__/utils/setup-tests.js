import '@testing-library/jest-dom'

// Mock console methods to avoid noise in tests
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

// Global test utilities
global.testUtils = {
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  createMockResponse: (data, status = 200) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {},
  }),
  createMockError: (message, status = 500) => {
    const error = new Error(message)
    error.response = { status }
    return error
  },
}

// Mock environment variables
process.env.NEXT_PUBLIC_WORDPRESS_URL = 'http://localhost:8080'
process.env.NEXT_PUBLIC_WORDPRESS_API_URL = 'http://localhost:8080/wp-json'

// Add custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
})

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
  // Reset DOM
  document.body.innerHTML = ''
  document.head.innerHTML = ''
})

// Global cleanup
afterAll(() => {
  // Restore console
  console.error = originalConsole.error
  console.warn = originalConsole.warn
  console.log = originalConsole.log
})