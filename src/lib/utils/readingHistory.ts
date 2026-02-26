import { RECOMMENDATION_CONFIG } from '@/lib/api/config'

const READING_HISTORY_KEY = 'reading_history'
const RECOMMENDATION_CLICKS_KEY = 'recommendation_clicks'

export interface ReadingHistoryItem {
  postId: number
  slug: string
  title: string
  categoryIds: number[]
  tagIds: number[]
  timestamp: number
}

export interface ReadingHistory {
  items: ReadingHistoryItem[]
  categoryPreferences: Map<number, number>
  tagPreferences: Map<number, number>
}

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function addToReadingHistory(
  postId: number,
  slug: string,
  title: string,
  categoryIds: number[],
  tagIds: number[]
): void {
  const history = getReadingHistory()
  
  const existingIndex = history.items.findIndex(item => item.postId === postId)
  if (existingIndex !== -1) {
    history.items.splice(existingIndex, 1)
  }
  
  history.items.unshift({
    postId,
    slug,
    title,
    categoryIds,
    tagIds,
    timestamp: Date.now(),
  })
  
  if (history.items.length > RECOMMENDATION_CONFIG.MAX_HISTORY_ITEMS) {
    history.items = history.items.slice(0, RECOMMENDATION_CONFIG.MAX_HISTORY_ITEMS)
  }
  
  categoryIds.forEach(catId => {
    const count = history.categoryPreferences.get(catId) || 0
    history.categoryPreferences.set(catId, count + 1)
  })
  
  tagIds.forEach(tagId => {
    const count = history.tagPreferences.get(tagId) || 0
    history.tagPreferences.set(tagId, count + 1)
  })
  
  setStorageItem(READING_HISTORY_KEY, {
    items: history.items,
    categoryPreferences: Object.fromEntries(history.categoryPreferences),
    tagPreferences: Object.fromEntries(history.tagPreferences),
  })
}

export function getReadingHistory(): ReadingHistory {
  const stored = getStorageItem<{
    items: ReadingHistoryItem[]
    categoryPreferences: Record<number, number>
    tagPreferences: Record<number, number>
  }>(READING_HISTORY_KEY, {
    items: [],
    categoryPreferences: {},
    tagPreferences: {},
  })
  
  return {
    items: stored.items,
    categoryPreferences: new Map(Object.entries(stored.categoryPreferences).map(([k, v]) => [Number(k), v])),
    tagPreferences: new Map(Object.entries(stored.tagPreferences).map(([k, v]) => [Number(k), v])),
  }
}

export function getTopCategories(limit: number = 3): number[] {
  const history = getReadingHistory()
  return Array.from(history.categoryPreferences.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([catId]) => catId)
}

export function getTopTags(limit: number = 5): number[] {
  const history = getReadingHistory()
  return Array.from(history.tagPreferences.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tagId]) => tagId)
}

export function hasReadPost(postId: number): boolean {
  const history = getReadingHistory()
  return history.items.some(item => item.postId === postId)
}

export function trackRecommendationClick(recommendedPostId: number, source: string): void {
  const clicks = getStorageItem<{ postId: number; source: string; timestamp: number }[]>(RECOMMENDATION_CLICKS_KEY, [])
  clicks.push({
    postId: recommendedPostId,
    source,
    timestamp: Date.now(),
  })
  setStorageItem(RECOMMENDATION_CLICKS_KEY, clicks)
}

export function getRecommendationClicks(): { postId: number; source: string; timestamp: number }[] {
  return getStorageItem(RECOMMENDATION_CLICKS_KEY, [])
}
