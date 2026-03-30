import { GET as AnalyticsGET, POST as AnalyticsPOST, DELETE as AnalyticsDELETE } from '@/app/api/analytics/route'
import { analyticsService } from '@/lib/services/analytics'
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware'

const mockRequest = {
  url: 'http://localhost:3000/api/analytics'
} as any

jest.mock('@/lib/services/analytics')
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: any, init?: any) => {
      const headersMap: Record<string, string> = { ...(init?.headers || {}) }
      return {
        status: init?.status || 200,
        json: () => Promise.resolve(body),
        headers: {
          get: (key: string) => headersMap[key] || null,
          set: (key: string, value: string) => {
            headersMap[key] = value
          }
        }
      }
    })
  }
}))

const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>

describe('Analytics API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetAllRateLimitState()
    analyticsService.clearAnalytics()
  })

  describe('GET /api/analytics', () => {
    it('should return 200 with analytics data', async () => {
      const mockAnalyticsData = {
        totalPageViews: 10,
        uniquePaths: 2,
        pageViews: [
          { path: '/test', views: 8, firstViewed: 1234567890, lastViewed: 1234567899 },
          { path: '/other', views: 2, firstViewed: 1234567890, lastViewed: 1234567899 }
        ],
        recentPageViews: []
      }
      mockAnalyticsService.getAnalytics.mockReturnValue(mockAnalyticsData)

      const response = await AnalyticsGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockAnalyticsData)
    })

    it('should return 500 when analytics fails', async () => {
      mockAnalyticsService.getAnalytics.mockImplementation(() => {
        throw new Error('Analytics error')
      })

      const response = await AnalyticsGET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch analytics')
    })

    it('should filter by path when path parameter is provided', async () => {
      const requestWithPath = {
        url: 'http://localhost:3000/api/analytics?path=/test'
      } as any
      const mockPageViews = {
        path: '/test',
        views: 5,
        pageViews: []
      }
      mockAnalyticsService.getPageViewsByPath.mockReturnValue([])

      const response = await AnalyticsGET(requestWithPath)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.path).toBe('/test')
    })

    it('should respect limit parameter', async () => {
      const requestWithLimit = {
        url: 'http://localhost:3000/api/analytics?limit=10'
      } as any
      mockAnalyticsService.getAnalytics.mockReturnValue({
        totalPageViews: 0,
        uniquePaths: 0,
        pageViews: [],
        recentPageViews: []
      })

      const response = await AnalyticsGET(requestWithLimit)
      
      expect(response.status).toBe(200)
      expect(mockAnalyticsService.getAnalytics).toHaveBeenCalledWith(10)
    })
  })

  describe('POST /api/analytics', () => {
    it('should return 200 when page view is tracked', async () => {
      const trackRequest = {
        json: jest.fn().mockResolvedValue({
          path: '/test',
          referrer: 'http://referrer.com',
          userAgent: 'Mozilla/5.0'
        })
      } as any

      const response = await AnalyticsPOST(trackRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Page view tracked')
    })

    it('should return 400 when path is missing', async () => {
      const trackRequest = {
        json: jest.fn().mockResolvedValue({})
      } as any

      const response = await AnalyticsPOST(trackRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid path parameter')
    })

    it('should return 400 when path is not a string', async () => {
      const trackRequest = {
        json: jest.fn().mockResolvedValue({ path: 123 })
      } as any

      const response = await AnalyticsPOST(trackRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 500 when tracking fails', async () => {
      const trackRequest = {
        json: jest.fn().mockResolvedValue({ path: '/test' })
      } as any
      mockAnalyticsService.trackPageView.mockImplementation(() => {
        throw new Error('Track failed')
      })

      const response = await AnalyticsPOST(trackRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })

  describe('DELETE /api/analytics', () => {
    it('should return 200 when analytics is cleared', async () => {
      const response = await AnalyticsDELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Analytics cleared')
      expect(mockAnalyticsService.clearAnalytics).toHaveBeenCalled()
    })

    it('should return 500 when clearing fails', async () => {
      mockAnalyticsService.clearAnalytics.mockImplementation(() => {
        throw new Error('Clear failed')
      })

      const response = await AnalyticsDELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})
