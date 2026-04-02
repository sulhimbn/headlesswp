export interface PageViewEvent {
  id: string
  timestamp: string
  path: string
  referrer: string
  userAgent: string
  sessionId: string
  browser?: string
  device?: string
  country?: string
  screenWidth?: number
  language?: string
  timeOnPage?: number
}

export interface PageViewStats {
  totalViews: number
  uniquePages: number
  uniqueSessions: number
  topPages: { path: string; count: number }[]
  topReferrers: { referrer: string; count: number }[]
  averageTimeOnPage: number
  viewsByDate: { date: string; count: number }[]
}

export interface AnalyticsConfig {
  enabled: boolean
  sessionTimeout?: number
  maxEvents?: number
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: process.env.ANALYTICS_ENABLED !== 'false',
  sessionTimeout: 30 * 60 * 1000,
  maxEvents: 10000
}

export class PageViewAnalytics {
  private events: PageViewEvent[] = []
  private sessions: Map<string, { startTime: number; lastActivity: number; pageViews: string[] }> = new Map()
  private pageTimers: Map<string, { startTime: number; sessionId: string }> = new Map()
  private config: AnalyticsConfig
  private sessionCounter = 0

  constructor(config: AnalyticsConfig = DEFAULT_CONFIG) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    }
  }

  private generateSessionId(): string {
    const timestamp = Date.now()
    this.sessionCounter++
    return `session_${timestamp}_${this.sessionCounter}`
  }

  private generateEventId(): string {
    return `pv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  private parseUserAgent(userAgent: string): { browser?: string; device?: string } {
    const browser = /Chrome|Firefox|Safari|Edge|Opera/i.test(userAgent) 
      ? userAgent.match(/Chrome|Firefox|Safari|Edge|Opera/i)?.[0]
      : 'Other'
    
    const device = /Mobile|Android|iPhone|iPad/i.test(userAgent)
      ? /iPad|Tablet/i.test(userAgent) ? 'Tablet' : 'Mobile'
      : 'Desktop'
    
    return { browser, device }
  }

  trackPageView(data: {
    path: string
    referrer?: string
    userAgent?: string
    sessionId?: string
    language?: string
    screenWidth?: number
    country?: string
  }): PageViewEvent {
    if (!this.config.enabled) {
      throw new Error('Analytics is disabled')
    }

    const sessionId = data.sessionId || this.getOrCreateSession(data.userAgent || '')
    const startTime = Date.now()
    
    const previousPage = this.pageTimers.get(sessionId)
    let timeOnPage: number | undefined
    
    if (previousPage) {
      timeOnPage = startTime - previousPage.startTime
      this.updateSessionTime(sessionId, startTime)
    }

    this.pageTimers.set(sessionId, { startTime, sessionId })

    const userAgent = data.userAgent || ''
    const { browser, device } = this.parseUserAgent(userAgent)

    const event: PageViewEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      path: data.path,
      referrer: data.referrer || 'direct',
      userAgent,
      sessionId,
      browser,
      device,
      country: data.country,
      screenWidth: data.screenWidth,
      language: data.language,
      timeOnPage
    }

    this.events.push(event)

    if (this.events.length > (this.config.maxEvents ?? 10000)) {
      this.events = this.events.slice(-Math.floor((this.config.maxEvents ?? 10000) / 2))
    }

    return event
  }

  private getOrCreateSession(_userAgent: string): string {
    let activeSession: string | null = null

    for (const [sessionId, session] of this.sessions) {
      if (Date.now() - session.lastActivity < (this.config.sessionTimeout ?? 30 * 60 * 1000)) {
        activeSession = sessionId
        break
      }
    }

    if (activeSession) {
      this.sessions.set(activeSession, {
        ...this.sessions.get(activeSession)!,
        lastActivity: Date.now()
      })
      return activeSession
    }

    const newSessionId = this.generateSessionId()
    this.sessions.set(newSessionId, {
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: []
    })
    return newSessionId
  }

  private updateSessionTime(sessionId: string, timestamp: number): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.lastActivity = timestamp
      this.sessions.set(sessionId, session)
    }
  }

  getEvents(): PageViewEvent[] {
    return [...this.events]
  }

  getSession(sessionId: string): { startTime: number; lastActivity: number; pageViews: string[] } | undefined {
    return this.sessions.get(sessionId)
  }

  getStats(periodDays: number = 7): PageViewStats {
    const now = Date.now()
    const periodStart = now - periodDays * 24 * 60 * 60 * 1000
    
    const recentEvents = this.events.filter(e => new Date(e.timestamp).getTime() >= periodStart)
    
    const pageCounts = new Map<string, number>()
    const referrerCounts = new Map<string, number>()
    const uniquePages = new Set<string>()
    const uniqueSessions = new Set<string>()
    let totalTimeOnPage = 0
    let timeOnPageCount = 0
    const dateCounts = new Map<string, number>()

    for (const event of recentEvents) {
      uniquePages.add(event.path)
      uniqueSessions.add(event.sessionId)
      
      pageCounts.set(event.path, (pageCounts.get(event.path) || 0) + 1)
      referrerCounts.set(event.referrer, (referrerCounts.get(event.referrer) || 0) + 1)
      
      if (event.timeOnPage) {
        totalTimeOnPage += event.timeOnPage
        timeOnPageCount++
      }

      const date = event.timestamp.split('T')[0]
      dateCounts.set(date, (dateCounts.get(date) || 0) + 1)
    }

    const topPages = Array.from(pageCounts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const topReferrers = Array.from(referrerCounts.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const viewsByDate = Array.from(dateCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalViews: recentEvents.length,
      uniquePages: uniquePages.size,
      uniqueSessions: uniqueSessions.size,
      topPages,
      topReferrers,
      averageTimeOnPage: timeOnPageCount > 0 ? Math.round(totalTimeOnPage / timeOnPageCount) : 0,
      viewsByDate
    }
  }

  clear(): void {
    this.events = []
    this.sessions.clear()
    this.pageTimers.clear()
  }
}

export const pageViewAnalytics = new PageViewAnalytics()