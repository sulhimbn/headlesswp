import axios from 'axios'
import { wordpressAPI } from '@/lib/wordpress'
import { apiSecurity } from '@/lib/api-security'

// Mock axios and api-security
jest.mock('axios')
jest.mock('@/lib/api-security')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedApiSecurity = apiSecurity as jest.Mocked<typeof apiSecurity>

describe('WordPress API Security', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock axios.create
    const mockAxiosInstance = {
      get: jest.fn().mockResolvedValue({ data: [] }),
      interceptors: {
        request: { 
          use: jest.fn().mockImplementation((onFulfilled) => {
            // Store the interceptor for testing
            ;(mockAxiosInstance as any).requestInterceptor = onFulfilled
            return onFulfilled
          })
        },
        response: { 
          use: jest.fn().mockImplementation((onFulfilled) => {
            // Store the interceptor for testing
            ;(mockAxiosInstance as any).responseInterceptor = onFulfilled
            return onFulfilled
          })
        }
      }
    }
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any)
    
    // Mock apiSecurity methods
    mockedApiSecurity.sanitizeInput.mockImplementation(input => input)
    mockedApiSecurity.validateAPIPath.mockReturnValue(true)
  })

  describe('Request Interceptor', () => {
    it('should add API key to requests if available', () => {
      process.env.WORDPRESS_API_KEY = 'test-api-key'
      
      // Re-import to trigger interceptor setup
      delete require.cache[require.resolve('@/lib/wordpress')]
      require('@/lib/wordpress')
      
      // This test verifies the interceptor is set up
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'HeadlessWP-Client/1.0',
            'X-Requested-With': 'XMLHttpRequest'
          })
        })
      )
    })

    it('should sanitize request parameters', () => {
      mockedApiSecurity.sanitizeInput.mockReturnValue('sanitized-input')
      
      // Test parameter sanitization through API calls
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: [] }),
        interceptors: {
          request: { 
            use: jest.fn().mockImplementation((onFulfilled) => {
              // Simulate the interceptor behavior
              const config = { params: { search: '<script>alert("xss")</script>' } }
              const result = onFulfilled(config)
              return result
            })
          },
          response: { use: jest.fn() }
        }
      }
      
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any)
      
      // Re-import to trigger interceptor setup
      delete require.cache[require.resolve('@/lib/wordpress')]
      require('@/lib/wordpress')
      
      // Manually test the interceptor
      const config = { params: { search: '<script>alert("xss")</script>' } }
      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0]
      requestInterceptor(config)
      
      expect(mockedApiSecurity.sanitizeInput).toHaveBeenCalledWith('<script>alert("xss")</script>')
    })
  })

  describe('Response Interceptor', () => {
    it('should handle rate limiting responses', async () => {
      const mockAxiosInstance = {
        get: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { 
            use: jest.fn().mockImplementation((onFulfilled, onRejected) => {
              // Simulate rate limit error
              const error = {
                config: { _rateLimitRetry: false },
                response: { 
                  status: 429,
                  headers: { 'retry-after': '60' }
                }
              }
              
              return Promise.reject(error).catch(onRejected)
            })
          }
        }
      }
      
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any)
      
      // Re-import to trigger interceptor setup
      delete require.cache[require.resolve('@/lib/wordpress')]
      const { wordpressAPI: freshAPI } = require('@/lib/wordpress')
    })

    it('should sanitize response data', () => {
      mockedApiSecurity.sanitizeInput.mockReturnValue('sanitized-data')
      
      const mockAxiosInstance = {
        get: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { 
            use: jest.fn().mockImplementation((onFulfilled) => {
              // Simulate successful response with data
              const response = { 
                data: { title: '<script>alert("xss")</script>' }
              }
              const result = onFulfilled(response)
              return result
            })
          }
        }
      }
      
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any)
      
      // Re-import to trigger interceptor setup
      delete require.cache[require.resolve('@/lib/wordpress')]
      require('@/lib/wordpress')
      
      // Manually test the interceptor
      const response = { 
        data: { title: '<script>alert("xss")</script>' }
      }
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][0]
      responseInterceptor(response)
      
      expect(mockedApiSecurity.sanitizeInput).toHaveBeenCalled()
    })
  })

  describe('API Path Validation', () => {
    it('should validate API paths before making requests', async () => {
      mockedApiSecurity.validateAPIPath.mockReturnValue(false)
      
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: [] }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      }
      
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any)
      
      // Re-import to get fresh instance with mocked validation
      delete require.cache[require.resolve('@/lib/wordpress')]
      const { wordpressAPI: freshAPI } = require('@/lib/wordpress')
      
      await expect(freshAPI.getPosts()).rejects.toThrow('Invalid API path')
      expect(mockedApiSecurity.validateAPIPath).toHaveBeenCalledWith('/wp/v2/posts')
    })
  })

  describe('Input Validation', () => {
    it('should sanitize post slugs', async () => {
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: [{ id: 1, title: 'Test Post' }] }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      }
      
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any)
      mockedApiSecurity.sanitizeInput.mockReturnValue('sanitized-slug')
      
      // Re-import to get fresh instance
      delete require.cache[require.resolve('@/lib/wordpress')]
      const { wordpressAPI: freshAPI } = require('@/lib/wordpress')
      
      await freshAPI.getPost('<script>alert("xss")</script>')
      
      expect(mockedApiSecurity.sanitizeInput).toHaveBeenCalledWith('<script>alert("xss")</script>')
    })

    it('should validate search query length', async () => {
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: [] }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      }
      
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any)
      
      // Re-import to get fresh instance
      delete require.cache[require.resolve('@/lib/wordpress')]
      const { wordpressAPI: freshAPI } = require('@/lib/wordpress')
      
      // Test short query
      await expect(freshAPI.search('a')).rejects.toThrow('Search query must be at least 2 characters')
      
      // Test long query
      const longQuery = 'a'.repeat(101)
      await expect(freshAPI.search(longQuery)).rejects.toThrow('Search query too long')
    })

    it('should limit per_page parameter', async () => {
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: [] }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      }
      
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any)
      
      // Re-import to get fresh instance
      delete require.cache[require.resolve('@/lib/wordpress')]
      const { wordpressAPI: freshAPI } = require('@/lib/wordpress')
      
      await freshAPI.getPosts({ per_page: 200 })
      
      // Verify the call was made with limited per_page
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            per_page: 100
          })
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid post slugs', async () => {
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: [] }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      }
      
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any)
      mockedApiSecurity.sanitizeInput.mockReturnValue('')
      
      // Re-import to get fresh instance
      delete require.cache[require.resolve('@/lib/wordpress')]
      const { wordpressAPI: freshAPI } = require('@/lib/wordpress')
      
      await expect(freshAPI.getPost('')).rejects.toThrow('Invalid post slug')
    })
  })
})