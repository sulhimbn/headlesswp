'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface NavigationPattern {
  fromPage: string
  toPage: string
  count: number
}

export interface PrefetchMetrics {
  prefetchAttempts: number
  prefetchHits: number
  prefetchMisses: number
  hitRate: number
  averageConfidence: number
}

interface MarkovModel {
  transitions: Map<string, Map<string, number>>
  totalTransitions: number
}

const STORAGE_KEY = 'navigation_patterns'
const METRICS_KEY = 'prefetch_metrics'
const CONFIDENCE_THRESHOLD = 0.7
const MAX_PATTERNS = 1000

function getPageKey(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return 'home'
  if (parts[0] === 'berita' && parts[1]) return `berita:${parts[1]}`
  if (parts[0] === 'kategori' && parts[1]) return `kategori:${parts[1]}`
  if (parts[0] === 'tag' && parts[1]) return `tag:${parts[1]}`
  if (parts[0] === 'author' && parts[1]) return `author:${parts[1]}`
  return parts[0]
}

export function getInitialState(): MarkovModel {
  if (typeof window === 'undefined') {
    return { transitions: new Map(), totalTransitions: 0 }
  }
  
  try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        const transitions = new Map<string, Map<string, number>>()
        for (const [key, value] of Object.entries(data.transitions)) {
          transitions.set(key, new Map(Object.entries(value as Record<string, number>)))
        }
        return {
          transitions,
          totalTransitions: data.totalTransitions || 0
        }
      }
    } catch { /* empty */ }
  
  return { transitions: new Map(), totalTransitions: 0 }
}

function saveState(state: MarkovModel): void {
  if (typeof window === 'undefined') return
  
  try {
    const data = {
      transitions: Object.fromEntries(
        Array.from(state.transitions.entries()).map(([k, v]) => [k, Object.fromEntries(v)])
      ),
      totalTransitions: state.totalTransitions
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* empty */ }
}

export function getMetrics(): PrefetchMetrics {
  if (typeof window === 'undefined') {
    return { prefetchAttempts: 0, prefetchHits: 0, prefetchMisses: 0, hitRate: 0, averageConfidence: 0 }
  }
  
  try {
    const stored = localStorage.getItem(METRICS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch { /* empty */ }
  
  return { prefetchAttempts: 0, prefetchHits: 0, prefetchMisses: 0, hitRate: 0, averageConfidence: 0 }
}

function saveMetrics(metrics: PrefetchMetrics): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics))
  } catch { /* empty */ }
}

export function predictNextPages(currentPage: string, model: MarkovModel, limit = 3): Array<{ path: string; confidence: number }> {
  const predictions: Array<{ path: string; confidence: number }> = []
  
  const currentKey = getPageKey(currentPage)
  const transitions = model.transitions.get(currentKey)
  
  if (!transitions || transitions.size === 0) {
    return predictions
  }
  
  let maxCount = 0
  transitions.forEach(count => {
    if (count > maxCount) maxCount = count
  })
  
  const sortedEntries = Array.from(transitions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
  
  for (const [targetPage, count] of sortedEntries) {
    const confidence = count / Math.max(model.totalTransitions, 1)
    
    if (confidence >= CONFIDENCE_THRESHOLD || count >= 3) {
      predictions.push({ path: targetPage, confidence: Math.min(confidence, 1) })
    }
  }
  
  return predictions
}

function addTransition(fromPage: string, toPage: string, model: MarkovModel): MarkovModel {
  const fromKey = getPageKey(fromPage)
  const toKey = getPageKey(toPage)
  
  const newTransitions = new Map(model.transitions)
  
  let fromTransitions = newTransitions.get(fromKey)
  if (!fromTransitions) {
    fromTransitions = new Map()
    newTransitions.set(fromKey, fromTransitions)
  }
  
  const currentCount = fromTransitions.get(toKey) || 0
  fromTransitions.set(toKey, currentCount + 1)
  
  let totalTransitions = model.totalTransitions + 1
  
  if (totalTransitions > MAX_PATTERNS) {
    const scaleFactor = 0.9
    const scaledTransitions = new Map<string, Map<string, number>>()
    
    newTransitions.forEach((innerMap, key) => {
      const scaledInner = new Map<string, number>()
      innerMap.forEach((count, innerKey) => {
        const scaled = Math.floor(count * scaleFactor)
        if (scaled > 0) {
          scaledInner.set(innerKey, scaled)
        }
      })
      if (scaledInner.size > 0) {
        scaledTransitions.set(key, scaledInner)
      }
    })
    
    totalTransitions = Math.floor(totalTransitions * scaleFactor)
    
    return { transitions: scaledTransitions, totalTransitions }
  }
  
  return { transitions: newTransitions, totalTransitions }
}

export function usePredictivePrefetch() {
  const [model, setModel] = useState<MarkovModel>({ transitions: new Map(), totalTransitions: 0 })
  const [metrics, setMetrics] = useState<PrefetchMetrics>(getMetrics)
  const previousPathRef = useRef<string>('')
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const state = getInitialState()
    setModel(state)
    setMetrics(getMetrics())
    isInitializedRef.current = true
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleRouteChange = () => {
      const currentPath = window.location.pathname
      
      if (previousPathRef.current && previousPathRef.current !== currentPath) {
        const newModel = addTransition(previousPathRef.current, currentPath, model)
        setModel(newModel)
        saveState(newModel)
        
        const isFromPrefetch = document.referrer?.includes(window.location.host)
        
        setMetrics(prev => {
          const newMetrics = {
            ...prev,
            prefetchAttempts: prev.prefetchAttempts + 1,
            prefetchHits: isFromPrefetch ? prev.prefetchHits + 1 : prev.prefetchHits,
            prefetchMisses: !isFromPrefetch ? prev.prefetchMisses + 1 : prev.prefetchMisses,
            hitRate: 0,
            averageConfidence: prev.averageConfidence
          }
          newMetrics.hitRate = newMetrics.prefetchAttempts > 0 
            ? newMetrics.prefetchHits / newMetrics.prefetchAttempts 
            : 0
          saveMetrics(newMetrics)
          return newMetrics
        })
      }
      
      previousPathRef.current = currentPath
    }

    window.addEventListener('popstate', handleRouteChange)
    
    const originalPushState = window.history.pushState
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args)
      setTimeout(handleRouteChange, 100)
    }

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      window.history.pushState = originalPushState
    }
  }, [model])

  const getPredictions = useCallback((currentPath: string) => {
    return predictNextPages(currentPath, model)
  }, [model])

  const prefetchPage = useCallback(async (href: string) => {
    if (typeof window === 'undefined') return
    
    try {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = href
      document.head.appendChild(link)
      
      setMetrics(prev => {
        const newMetrics = {
          ...prev,
          prefetchAttempts: prev.prefetchAttempts + 1
        }
        saveMetrics(newMetrics)
        return newMetrics
      })
    } catch { /* empty */ }
  }, [])

  const getMetricsData = useCallback(() => {
    return metrics
  }, [metrics])

  return { getPredictions, prefetchPage, getMetricsData, model }
}