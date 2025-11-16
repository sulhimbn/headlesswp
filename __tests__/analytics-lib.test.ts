import { pageview, event, analyticsEvents, simplePageView } from '@/lib/analytics'

// Mock window.gtag
const mockGtag = jest.fn()
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
})

describe('Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockGtag.mockClear()
  })

  describe('pageview', () => {
    it('should call gtag with correct parameters', () => {
      process.env.NEXT_PUBLIC_GA_ID = 'GA-TEST-123'
      
      pageview('/test-page')

      expect(mockGtag).toHaveBeenCalledWith('config', 'GA-TEST-123', {
        page_path: '/test-page',
      })
    })

    it('should not call gtag when GA_ID is not set', () => {
      process.env.NEXT_PUBLIC_GA_ID = ''
      
      pageview('/test-page')

      expect(mockGtag).not.toHaveBeenCalled()
    })

    it('should include search params in URL', () => {
      process.env.NEXT_PUBLIC_GA_ID = 'GA-TEST-123'
      
      pageview('/test-page?param=value')

      expect(mockGtag).toHaveBeenCalledWith('config', 'GA-TEST-123', {
        page_path: '/test-page?param=value',
      })
    })
  })

  describe('event', () => {
    it('should call gtag with event parameters', () => {
      process.env.NEXT_PUBLIC_GA_ID = 'GA-TEST-123'
      
      event({
        action: 'test_action',
        category: 'test_category',
        label: 'test_label',
        value: 42,
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'test_action', {
        event_category: 'test_category',
        event_label: 'test_label',
        value: 42,
      })
    })

    it('should work without optional parameters', () => {
      process.env.NEXT_PUBLIC_GA_ID = 'GA-TEST-123'
      
      event({
        action: 'test_action',
        category: 'test_category',
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'test_action', {
        event_category: 'test_category',
        event_label: undefined,
        value: undefined,
      })
    })
  })

  describe('analyticsEvents', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_GA_ID = 'GA-TEST-123'
    })

    it('should track article view', () => {
      analyticsEvents.articleView('123', 'Test Article')

      expect(mockGtag).toHaveBeenCalledWith('event', 'view_article', {
        event_category: 'engagement',
        event_label: '123 - Test Article',
      })
    })

    it('should track article share', () => {
      analyticsEvents.articleShare('123', 'twitter')

      expect(mockGtag).toHaveBeenCalledWith('event', 'share_article', {
        event_category: 'engagement',
        event_label: '123 - twitter',
      })
    })

    it('should track menu click', () => {
      analyticsEvents.menuClick('berita')

      expect(mockGtag).toHaveBeenCalledWith('event', 'click_menu', {
        event_category: 'navigation',
        event_label: 'berita',
      })
    })

    it('should track search', () => {
      analyticsEvents.search('test query')

      expect(mockGtag).toHaveBeenCalledWith('event', 'search', {
        event_category: 'navigation',
        event_label: 'test query',
      })
    })

    it('should track slow page load', () => {
      analyticsEvents.slowPageLoad(3500)

      expect(mockGtag).toHaveBeenCalledWith('event', 'slow_page_load', {
        event_category: 'performance',
        value: 3500,
      })
    })

    it('should track API error', () => {
      analyticsEvents.apiError('/wp/v2/posts')

      expect(mockGtag).toHaveBeenCalledWith('event', 'api_error', {
        event_category: 'error',
        event_label: '/wp/v2/posts',
      })
    })

    it('should track newsletter signup', () => {
      analyticsEvents.newsletterSignup()

      expect(mockGtag).toHaveBeenCalledWith('event', 'newsletter_signup', {
        event_category: 'conversion',
        event_label: undefined,
        value: undefined,
      })
    })
  })

  describe('simplePageView', () => {
    it('should log page view in development', () => {
      process.env.NODE_ENV = 'development'
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      simplePageView('/test-page')

      expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Page view: /test-page')
      
      consoleSpy.mockRestore()
    })

    it('should store page view in localStorage', () => {
      process.env.NODE_ENV = 'production'
      
      // Mock document.referrer and navigator.userAgent
      Object.defineProperty(document, 'referrer', {
        value: 'https://example.com',
        writable: true,
      })
      
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Test Browser)',
        writable: true,
      })

      simplePageView('/test-page')

      const views = JSON.parse(localStorage.getItem('page_views') || '[]')
      expect(views).toHaveLength(1)
      expect(views[0]).toMatchObject({
        url: '/test-page',
        referrer: 'https://example.com',
        userAgent: 'Mozilla/5.0 (Test Browser)',
      })
      expect(views[0].timestamp).toBeGreaterThan(0)
    })

    it('should limit stored views to 100', () => {
      // Add 100 existing views
      const existingViews = Array.from({ length: 100 }, (_, i) => ({
        url: `/page-${i}`,
        timestamp: Date.now() - i,
        referrer: '',
        userAgent: '',
      }))
      
      localStorage.setItem('page_views', JSON.stringify(existingViews))

      simplePageView('/new-page')

      const views = JSON.parse(localStorage.getItem('page_views') || '[]')
      expect(views).toHaveLength(100)
      expect(views[99].url).toBe('/new-page')
    })
  })
})