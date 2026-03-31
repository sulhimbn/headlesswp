const ANALYTICS_KEY = 'dx_page_analytics'

export interface PageView {
  path: string
  timestamp: number
  referrer: string
}

export interface AnalyticsData {
  pageViews: PageView[]
  totalViews: number
  uniquePaths: string[]
}

export function trackPageView(path: string, referrer: string = ''): void {
  if (typeof window === 'undefined') return

  const pageView: PageView = {
    path,
    timestamp: Date.now(),
    referrer: referrer || document.referrer || '',
  }

  const existing = getAnalyticsData()
  const updated = [...existing.pageViews, pageView]

  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(updated))
  } catch {
    console.warn('Failed to save analytics to localStorage')
  }
}

export function getAnalyticsData(): AnalyticsData {
  if (typeof window === 'undefined') {
    return { pageViews: [], totalViews: 0, uniquePaths: [] }
  }

  try {
    const stored = localStorage.getItem(ANALYTICS_KEY)
    const pageViews: PageView[] = stored ? JSON.parse(stored) : []
    const uniquePaths = [...new Set(pageViews.map((pv) => pv.path))]

    return {
      pageViews,
      totalViews: pageViews.length,
      uniquePaths,
    }
  } catch {
    return { pageViews: [], totalViews: 0, uniquePaths: [] }
  }
}

export function clearAnalyticsData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ANALYTICS_KEY)
}