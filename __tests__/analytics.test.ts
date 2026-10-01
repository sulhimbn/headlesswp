import { analyticsService, type PageView, type AnalyticsData } from '@/lib/services/analytics'

describe('AnalyticsService', () => {
  beforeEach(() => {
    analyticsService.clearAnalytics()
  })

  describe('trackPageView', () => {
    it('should track a page view', () => {
      analyticsService.trackPageView('/test', 'http://referrer.com', 'Mozilla/5.0')

      const analytics = analyticsService.getAnalytics()
      expect(analytics.totalPageViews).toBe(1)
      expect(analytics.uniquePaths).toBe(1)
      expect(analytics.pageViews[0].path).toBe('/test')
      expect(analytics.pageViews[0].views).toBe(1)
    })

    it('should track multiple page views for same path', () => {
      analyticsService.trackPageView('/test')
      analyticsService.trackPageView('/test')
      analyticsService.trackPageView('/test')

      const analytics = analyticsService.getAnalytics()
      expect(analytics.totalPageViews).toBe(3)
      expect(analytics.pageViews[0].views).toBe(3)
    })

    it('should track different paths separately', () => {
      analyticsService.trackPageView('/page1')
      analyticsService.trackPageView('/page2')
      analyticsService.trackPageView('/page1')

      const analytics = analyticsService.getAnalytics()
      expect(analytics.uniquePaths).toBe(2)
    })

    it('should store referrer and userAgent', () => {
      analyticsService.trackPageView('/test', 'http://google.com', 'Mozilla/5.0')

      const analytics = analyticsService.getAnalytics()
      const recentView = analytics.recentPageViews[0]
      expect(recentView.referrer).toBe('http://google.com')
      expect(recentView.userAgent).toBe('Mozilla/5.0')
    })
  })

  describe('getAnalytics', () => {
    it('should return analytics with correct structure', () => {
      analyticsService.trackPageView('/test')

      const analytics = analyticsService.getAnalytics()
      expect(analytics).toHaveProperty('totalPageViews')
      expect(analytics).toHaveProperty('uniquePaths')
      expect(analytics).toHaveProperty('pageViews')
      expect(analytics).toHaveProperty('recentPageViews')
    })

    it('should return page views sorted by count', () => {
      analyticsService.trackPageView('/popular')
      analyticsService.trackPageView('/popular')
      analyticsService.trackPageView('/popular')
      analyticsService.trackPageView('/less-popular')
      analyticsService.trackPageView('/less-popular')

      const analytics = analyticsService.getAnalytics()
      expect(analytics.pageViews[0].path).toBe('/popular')
      expect(analytics.pageViews[0].views).toBe(3)
      expect(analytics.pageViews[1].path).toBe('/less-popular')
      expect(analytics.pageViews[1].views).toBe(2)
    })

    it('should respect limit parameter', () => {
      for (let i = 0; i < 20; i++) {
        analyticsService.trackPageView(`/page${i}`)
      }

      const analytics = analyticsService.getAnalytics(5)
      expect(analytics.pageViews.length).toBe(5)
    })

    it('should track first and last viewed timestamps', () => {
      analyticsService.trackPageView('/test')
      
      const analytics = analyticsService.getAnalytics()
      expect(analytics.pageViews[0].firstViewed).toBeDefined()
      expect(analytics.pageViews[0].lastViewed).toBeDefined()
    })
  })

  describe('getPageViewsByPath', () => {
    it('should return only page views for specific path', () => {
      analyticsService.trackPageView('/page1')
      analyticsService.trackPageView('/page2')
      analyticsService.trackPageView('/page1')

      const page1Views = analyticsService.getPageViewsByPath('/page1')
      expect(page1Views.length).toBe(2)
    })

    it('should return empty array for non-existent path', () => {
      analyticsService.trackPageView('/page1')

      const page2Views = analyticsService.getPageViewsByPath('/page2')
      expect(page2Views.length).toBe(0)
    })
  })

  describe('clearAnalytics', () => {
    it('should clear all page views', () => {
      analyticsService.trackPageView('/test1')
      analyticsService.trackPageView('/test2')

      analyticsService.clearAnalytics()

      const analytics = analyticsService.getAnalytics()
      expect(analytics.totalPageViews).toBe(0)
      expect(analytics.uniquePaths).toBe(0)
    })
  })
})
