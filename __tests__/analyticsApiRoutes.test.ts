import { NextRequest } from 'next/server'
import { pageViewAnalytics } from '@/lib/analytics/pageViewAnalytics'

const createMockRequest = (body: unknown, method: string = 'POST'): NextRequest => {
  return {
    json: async () => body,
    headers: new Headers(),
    method,
  } as unknown as NextRequest
}

describe('Analytics API Routes', () => {
  beforeEach(() => {
    pageViewAnalytics.clear()
  })

  afterEach(() => {
    pageViewAnalytics.clear()
  })

  describe('POST /api/analytics/track', () => {
    it('should track a valid page view', async () => {
      const event = pageViewAnalytics.trackPageView({
        path: '/berita/test-article',
        referrer: 'https://google.com'
      })

      expect(event.id).toMatch(/^pv_/)
      expect(event.path).toBe('/berita/test-article')
    })

    it('should track page view with minimal data', () => {
      const event = pageViewAnalytics.trackPageView({
        path: '/'
      })

      expect(event.path).toBe('/')
      expect(event.referrer).toBe('direct')
    })

    it('should include session tracking', () => {
      const event1 = pageViewAnalytics.trackPageView({ path: '/page1' })
      const event2 = pageViewAnalytics.trackPageView({ path: '/page2' })

      expect(event1.sessionId).toBe(event2.sessionId)
    })
  })

  describe('GET /api/analytics/page-views', () => {
    it('should return stats for tracked page views', () => {
      pageViewAnalytics.trackPageView({ path: '/page1' })
      pageViewAnalytics.trackPageView({ path: '/page2' })
      pageViewAnalytics.trackPageView({ path: '/page1' })

      const stats = pageViewAnalytics.getStats(7)

      expect(stats.totalViews).toBe(3)
      expect(stats.uniquePages).toBe(2)
      expect(stats.topPages).toHaveLength(2)
      expect(stats.topPages[0].path).toBe('/page1')
      expect(stats.topPages[0].count).toBe(2)
    })

    it('should respect period parameter', () => {
      const oldEvent = pageViewAnalytics.trackPageView({ path: '/old' })
      const events = pageViewAnalytics.getEvents()
      const oldDate = new Date(events[0].timestamp)
      oldDate.setDate(oldDate.getDate() - 10)
      events[0].timestamp = oldDate.toISOString()

      const stats = pageViewAnalytics.getStats(7)

      expect(stats.totalViews).toBe(0)
    })

    it('should return top referrers', () => {
      pageViewAnalytics.trackPageView({ path: '/', referrer: 'google.com' })
      pageViewAnalytics.trackPageView({ path: '/', referrer: 'google.com' })
      pageViewAnalytics.trackPageView({ path: '/', referrer: 'twitter.com' })

      const stats = pageViewAnalytics.getStats(7)

      expect(stats.topReferrers[0].referrer).toBe('google.com')
      expect(stats.topReferrers[0].count).toBe(2)
    })

    it('should return views by date', () => {
      pageViewAnalytics.trackPageView({ path: '/' })

      const stats = pageViewAnalytics.getStats(7)

      expect(stats.viewsByDate).toBeDefined()
      expect(stats.viewsByDate.length).toBeGreaterThan(0)
    })
  })
})