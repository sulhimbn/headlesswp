'use client'

import { useEffect, useCallback, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface PageViewTrackerOptions {
  enabled?: boolean
  trackReferrer?: boolean
  trackScreenWidth?: boolean
  apiPath?: string
}

export function usePageViewTracker(options: PageViewTrackerOptions = {}) {
  const {
    enabled = true,
    trackReferrer = true,
    trackScreenWidth = true,
    apiPath = '/api/analytics/track'
  } = options

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const sessionIdRef = useRef<string | null>(null)
  const lastPathRef = useRef<string | null>(null)

  const sendPageView = useCallback(async (path: string) => {
    if (!enabled) return

    try {
      const payload: Record<string, unknown> = {
        path,
        sessionId: sessionIdRef.current || undefined
      }

      if (trackReferrer) {
        payload.referrer = document.referrer || 'direct'
      }

      if (trackScreenWidth) {
        payload.screenWidth = window.screen.width
      }

      payload.language = navigator.language

      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        keepalive: true
      })

      if (response.ok) {
        const data = await response.json()
        if (data.eventId && !sessionIdRef.current) {
          sessionIdRef.current = data.eventId.split('_').slice(0, 2).join('_').replace('pv', 'session')
        }
      }
    } catch (error) {
      console.warn('Failed to track page view:', error)
    }
  }, [enabled, apiPath, trackReferrer, trackScreenWidth])

  useEffect(() => {
    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    
    if (fullPath !== lastPathRef.current) {
      lastPathRef.current = fullPath
      
      if (!sessionIdRef.current) {
        sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      }

      sendPageView(fullPath)
    }
  }, [pathname, searchParams, sendPageView])
}

export function initPageViewTracking(options: PageViewTrackerOptions = {}) {
  const {
    enabled = true,
    trackReferrer = true,
    apiPath = '/api/analytics/track'
  } = options

  if (!enabled || typeof window === 'undefined') return

  let sessionId: string | null = null

  const sendPageView = async (path: string) => {
    try {
      const payload: Record<string, unknown> = {
        path,
        sessionId: sessionId || undefined
      }

      if (trackReferrer) {
        payload.referrer = document.referrer || 'direct'
      }

      payload.language = navigator.language
      payload.screenWidth = window.screen.width

      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        keepalive: true
      })

      if (response.ok) {
        const data = await response.json()
        if (data.eventId && !sessionId) {
          sessionId = data.eventId.split('_').slice(0, 2).join('_').replace('pv', 'session')
        }
      }
    } catch (error) {
      console.warn('Failed to track page view:', error)
    }
  }

  if (typeof window !== 'undefined') {
    sendPageView(window.location.pathname + window.location.search)
  }

  return {
    track: sendPageView,
    cleanup: () => {
      sessionId = null
    }
  }
}