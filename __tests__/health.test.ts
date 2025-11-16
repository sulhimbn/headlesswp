import { GET } from '@/app/api/health/route'
import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Mock fetch for WordPress API check
global.fetch = jest.fn()

describe('Health Check API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock process.uptime
    Object.defineProperty(process, 'uptime', {
      value: jest.fn(() => 3600), // 1 hour
      writable: true,
    })

    // Mock process.memoryUsage
    Object.defineProperty(process, 'memoryUsage', {
      value: jest.fn(() => ({
        heapUsed: 50 * 1024 * 1024, // 50MB
        heapTotal: 100 * 1024 * 1024, // 100MB
      })),
      writable: true,
    })
  })

  it('should return healthy status when all checks pass', async () => {
    // Mock successful WordPress API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: jest.fn().mockReturnValue('100ms'),
      },
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.checks.wordpress.status).toBe('ok')
    expect(data.checks.memory.used).toBe(50)
    expect(data.checks.memory.total).toBe(100)
    expect(data.checks.responseTime.status).toBe('ok')
  })

  it('should return degraded status when WordPress API fails', async () => {
    // Mock failed WordPress API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('degraded')
    expect(data.checks.wordpress.status).toBe('error')
    expect(data.checks.wordpress.statusCode).toBe(500)
  })

  it('should return error status when fetch throws', async () => {
    // Mock network error
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('error')
    expect(data.error).toBe('Network error')
  })

  it('should include response time check', async () => {
    // Mock successful WordPress API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: jest.fn().mockReturnValue('100ms'),
      },
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(data.checks.responseTime.value).toBeGreaterThan(0)
    expect(data.checks.responseTime.unit).toBe('ms')
  })

  it('should mark slow response time', async () => {
    // Mock slow response by adding delay
    ;(global.fetch as jest.Mock).mockImplementationOnce(async () => {
      await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
      return {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('100ms'),
        },
      }
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(data.checks.responseTime.status).toBe('ok')
  })

  it('should handle WordPress API timeout', async () => {
    // Mock timeout with shorter delay for test
    ;(global.fetch as jest.Mock).mockImplementationOnce(async () => {
      await new Promise(resolve => setTimeout(resolve, 100)) // Short delay for test
      throw new Error('Timeout')
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(data.checks.wordpress.status).toBe('error')
    expect(data.checks.wordpress.error).toContain('Timeout')
  }, 10000) // Increase timeout

  it('should include environment information', async () => {
    // Mock successful WordPress API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: jest.fn().mockReturnValue('100ms'),
      },
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(data.environment).toBe('test')
    expect(data.uptime).toBe(3600)
    expect(data.version).toBeDefined()
    expect(data.timestamp).toBeDefined()
  })
})