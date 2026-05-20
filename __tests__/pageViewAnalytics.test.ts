import { PageViewAnalytics, pageViewAnalytics, PageViewEvent } from '@/lib/analytics/pageViewAnalytics'

describe('PageViewAnalytics', () => {
  let analytics: PageViewAnalytics

  beforeEach(() => {
    analytics = new PageViewAnalytics({ enabled: true, maxEvents: 1000 })
  })

  afterEach(() => {
    analytics.clear()
  })

  describe('trackPageView', () => {
    it('should track a page view event', () => {
      const event = analytics.trackPageView({
        path: '/berita/test-article',
        referrer: 'https://google.com'
      })

      expect(event).toBeDefined()
      expect(event.id).toMatch(/^pv_/)
      expect(event.path).toBe('/berita/test-article')
      expect(event.referrer).toBe('https://google.com')
      expect(event.timestamp).toBeDefined()
    })

    it('should track with session ID', () => {
      const event = analytics.trackPageView({
        path: '/',
        sessionId: 'session_123'
      })

      expect(event.sessionId).toBe('session_123')
    })

    it('should parse user agent for browser and device', () => {
      const event = analytics.trackPageView({
        path: '/',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      })

      expect(event.browser).toBeDefined()
      expect(event.device).toBe('Mobile')
    })

    it('should default referrer to direct', () => {
      const event = analytics.trackPageView({ path: '/' })

      expect(event.referrer).toBe('direct')
    })

    it('should calculate time on page', async () => {
      const event1 = analytics.trackPageView({ path: '/page1' })
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const event2 = analytics.trackPageView({ path: '/page2' })

      expect(event2.timeOnPage).toBeDefined()
    })

    it('should throw when disabled', () => {
      const disabledAnalytics = new PageViewAnalytics({ enabled: false })

      expect(() => {
        disabledAnalytics.trackPageView({ path: '/' })
      }).toThrow('Analytics is disabled')
    })
  })

  describe('getEvents', () => {
    it('should return all tracked events', () => {
      analytics.trackPageView({ path: '/page1' })
      analytics.trackPageView({ path: '/page2' })

      const events = analytics.getEvents()

      expect(events).toHaveLength(2)
    })

    it('should return a copy of events', () => {
      analytics.trackPageView({ path: '/page1' })

      const events1 = analytics.getEvents()
      const events2 = analytics.getEvents()

      expect(events1).toEqual(events2)
      expect(events1).not.toBe(events2)
    })
  })

  describe('getStats', () => {
    it('should calculate total views', () => {
      analytics.trackPageView({ path: '/page1' })
      analytics.trackPageView({ path: '/page1' })
      analytics.trackPageView({ path: '/page2' })

      const stats = analytics.getStats(7)

      expect(stats.totalViews).toBe(3)
    })

    it('should count unique pages', () => {
      analytics.trackPageView({ path: '/page1' })
      analytics.trackPageView({ path: '/page1' })
      analytics.trackPageView({ path: '/page2' })

      const stats = analytics.getStats(7)

      expect(stats.uniquePages).toBe(2)
    })

    it('should count unique sessions', () => {
      analytics.trackPageView({ path: '/page1', sessionId: 'session_1' })
      analytics.trackPageView({ path: '/page2', sessionId: 'session_1' })
      analytics.trackPageView({ path: '/page3', sessionId: 'session_2' })

      const stats = analytics.getStats(7)

      expect(stats.uniqueSessions).toBe(2)
    })

    it('should return top pages sorted by count', () => {
      analytics.trackPageView({ path: '/popular' })
      analytics.trackPageView({ path: '/popular' })
      analytics.trackPageView({ path: '/popular' })
      analytics.trackPageView({ path: '/less' })
      analytics.trackPageView({ path: '/less' })

      const stats = analytics.getStats(7)

      expect(stats.topPages[0].path).toBe('/popular')
      expect(stats.topPages[0].count).toBe(3)
    })

    it('should return top referrers sorted by count', () => {
      analytics.trackPageView({ path: '/', referrer: 'google.com' })
      analytics.trackPageView({ path: '/', referrer: 'google.com' })
      analytics.trackPageView({ path: '/', referrer: 'twitter.com' })

      const stats = analytics.getStats(7)

      expect(stats.topReferrers[0].referrer).toBe('google.com')
      expect(stats.topReferrers[0].count).toBe(2)
    })

    it('should calculate average time on page', () => {
      analytics.trackPageView({ path: '/page1' })
      analytics.trackPageView({ path: '/page2' })

      const stats = analytics.getStats(7)

      expect(stats.averageTimeOnPage).toBeGreaterThanOrEqual(0)
    })

    it('should respect period parameter', () => {
      analytics.trackPageView({ path: '/old' })
      
      const oldEvent = analytics.getEvents()[0]
      const oldDate = new Date(oldEvent.timestamp)
      oldDate.setDate(oldDate.getDate() - 10)
      oldEvent.timestamp = oldDate.toISOString()

      const stats = analytics.getStats(7)

      expect(stats.totalViews).toBe(0)
    })
  })

  describe('getSession', () => {
    it('should return session data', () => {
      const event = analytics.trackPageView({ path: '/' })

      const session = analytics.getSession(event.sessionId)

      expect(session).toBeDefined()
      expect(session?.startTime).toBeDefined()
    })

    it('should return undefined for non-existent session', () => {
      const session = analytics.getSession('nonexistent')

      expect(session).toBeUndefined()
    })
  })

  describe('clear', () => {
    it('should clear all events and sessions', () => {
      analytics.trackPageView({ path: '/page1' })
      analytics.trackPageView({ path: '/page2' })

      analytics.clear()

      expect(analytics.getEvents()).toHaveLength(0)
    })
  })

  describe('session management', () => {
    it('should reuse active sessions', () => {
      const event1 = analytics.trackPageView({ path: '/page1' })
      const event2 = analytics.trackPageView({ path: '/page2' })

      expect(event1.sessionId).toBe(event2.sessionId)
    })

    it('should create new sessions after timeout', () => {
      const shortAnalytics = new PageViewAnalytics({ 
        enabled: true, 
        sessionTimeout: 1 
      })

      const event1 = shortAnalytics.trackPageView({ path: '/page1' })
      
      const oldSession = shortAnalytics.getSession(event1.sessionId)
      expect(oldSession).toBeDefined()
      if (oldSession) {
        oldSession.lastActivity = Date.now() - 10000
      }

      const event2 = shortAnalytics.trackPageView({ path: '/page2' })

      expect(event1.sessionId).not.toBe(event2.sessionId)
    })
  })
})

describe('pageViewAnalytics singleton', () => {
  afterEach(() => {
    pageViewAnalytics.clear()
  })

  it('should be defined', () => {
    expect(pageViewAnalytics).toBeDefined()
  })

  it('should track page views', () => {
    const event = pageViewAnalytics.trackPageView({ path: '/test' })

    expect(event.path).toBe('/test')
  })

  it('should provide stats', () => {
    pageViewAnalytics.trackPageView({ path: '/test' })

    const stats = pageViewAnalytics.getStats()

    expect(stats.totalViews).toBe(1)
  })
})