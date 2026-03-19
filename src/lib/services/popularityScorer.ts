import { readingPatternTracker } from './readingPatternTracker'

const POPULARITY_STORAGE_KEY = 'content_popularity'
const DECAY_FACTOR = 0.95
const MIN_SCORE = 0.01

export interface ContentScore {
  postId: number
  score: number
  categoryScore: number
  coOccurrenceScore: number
  popularityScore: number
  timestamp: number
}

interface PopularityData {
  postViews: Record<number, number>
  categoryViews: Record<number, number>
  lastUpdated: number
}

interface StoredScores {
  scores: Record<number, ContentScore>
  lastCalculation: number
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

export class PopularityScorer {
  private cachedScores: Map<number, ContentScore> = new Map()
  private popularityData: PopularityData

  constructor() {
    this.popularityData = this.loadPopularityData()
    this.loadCachedScores()
  }

  private loadPopularityData(): PopularityData {
    return getStorageItem<PopularityData>(POPULARITY_STORAGE_KEY, {
      postViews: {},
      categoryViews: {},
      lastUpdated: Date.now(),
    })
  }

  private loadCachedScores(): void {
    const stored = getStorageItem<StoredScores>(`${POPULARITY_STORAGE_KEY}_scores`, {
      scores: {},
      lastCalculation: 0,
    })
    
    Object.entries(stored.scores).forEach(([id, score]) => {
      this.cachedScores.set(Number(id), score)
    })
  }

  private savePopularityData(): void {
    setStorageItem(POPULARITY_STORAGE_KEY, {
      ...this.popularityData,
      lastUpdated: Date.now(),
    })
  }

  private saveCachedScores(): void {
    const scoresObj: Record<number, ContentScore> = {}
    this.cachedScores.forEach((score, id) => {
      scoresObj[id] = score
    })
    setStorageItem(`${POPULARITY_STORAGE_KEY}_scores`, {
      scores: scoresObj,
      lastCalculation: Date.now(),
    })
  }

  recordView(postId: number, categoryIds: number[]): void {
    this.popularityData.postViews[postId] = 
      (this.popularityData.postViews[postId] || 0) + 1

    for (const catId of categoryIds) {
      this.popularityData.categoryViews[catId] =
        (this.popularityData.categoryViews[catId] || 0) + 1
    }

    this.savePopularityData()
    this.invalidateCache(postId)
  }

  private invalidateCache(postId: number): void {
    this.cachedScores.delete(postId)
  }

  calculateScore(postId: number, categoryIds: number[]): ContentScore {
    const cached = this.cachedScores.get(postId)
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached
    }

    const categoryScore = this.calculateCategoryScore(categoryIds)
    const coOccurrenceScore = this.calculateCoOccurrenceScore(postId, categoryIds)
    const popularityScore = this.calculatePopularityScore(postId)
    
    const weights = {
      category: 0.3,
      coOccurrence: 0.4,
      popularity: 0.3,
    }

    const combinedScore = Math.min(1, 
      weights.category * categoryScore +
      weights.coOccurrence * coOccurrenceScore +
      weights.popularity * popularityScore
    )

    const contentScore: ContentScore = {
      postId,
      score: combinedScore,
      categoryScore,
      coOccurrenceScore,
      popularityScore,
      timestamp: Date.now(),
    }

    this.cachedScores.set(postId, contentScore)
    this.saveCachedScores()

    return contentScore
  }

  private calculateCategoryScore(categoryIds: number[]): number {
    if (categoryIds.length === 0) return MIN_SCORE

    const totalViews = Object.values(this.popularityData.categoryViews)
      .reduce((sum, v) => sum + v, 0)

    if (totalViews === 0) return 0.5

    const categoryScores = categoryIds.map(catId => {
      const views = this.popularityData.categoryViews[catId] || 0
      return views / totalViews
    })

    return Math.max(MIN_SCORE, Math.min(1, 
      categoryScores.reduce((sum, s) => sum + s, 0) / categoryScores.length
    ))
  }

  private calculateCoOccurrenceScore(postId: number, categoryIds: number[]): number {
    const coOccurring = readingPatternTracker.getCoOccurringPosts(postId)
    
    if (coOccurring.length === 0) {
      return categoryIds.length > 0 ? 0.3 : MIN_SCORE
    }

    const maxCoOccurrence = Math.max(...coOccurring.map(c => c.score))
    const avgCoOccurrence = coOccurring.reduce((sum, c) => sum + c.score, 0) / coOccurring.length

    const normalizedScore = maxCoOccurrence > 0 
      ? avgCoOccurrence / maxCoOccurrence 
      : 0

    return Math.max(MIN_SCORE, Math.min(1, normalizedScore))
  }

  private calculatePopularityScore(postId: number): number {
    const views = this.popularityData.postViews[postId] || 0
    
    if (views === 0) return MIN_SCORE

    const allViews = Object.values(this.popularityData.postViews)
    const maxViews = Math.max(...allViews, 1)
    const avgViews = allViews.reduce((sum, v) => sum + v, 0) / allViews.length

    const normalizedScore = views / maxViews
    const avgNormalizedScore = views / avgViews

    const decayFactor = Math.pow(DECAY_FACTOR, Math.floor(Date.now() / 86400000))

    return Math.max(MIN_SCORE, Math.min(1, 
      (normalizedScore * 0.7 + avgNormalizedScore * 0.3) * decayFactor
    ))
  }

  predictNextPosts(currentPostId: number, categoryIds: number[], limit: number = 5): number[] {
    const coOccurring = readingPatternTracker.getCoOccurringPosts(currentPostId)
    const predicted: { postId: number; score: number }[] = []

    for (const co of coOccurring) {
      const score = this.calculateScore(co.postId, categoryIds)
      predicted.push({
        postId: co.postId,
        score: co.score * score.score * 2,
      })
    }

    const categoryTransitions = categoryIds.flatMap(catId => {
      const transitions: { postId: number; score: number }[] = []
      const popularInCategory = this.getPopularPostsByCategory(catId, 10)
      
      for (const post of popularInCategory) {
        if (post !== currentPostId) {
          transitions.push({
            postId: post,
            score: this.getCategoryTransitionWeight(catId) * 0.5,
          })
        }
      }
      
      return transitions
    })

    const allPredictions = [...predicted, ...categoryTransitions]
    
    const scoreMap = new Map<number, number>()
    for (const pred of allPredictions) {
      const current = scoreMap.get(pred.postId) || 0
      scoreMap.set(pred.postId, current + pred.score)
    }

    return Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([postId]) => postId)
  }

  private getPopularPostsByCategory(categoryId: number, limit: number): number[] {
    const views = this.popularityData.postViews
    return Object.entries(views)
      .map(([postId, count]) => ({ postId: Number(postId), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(p => p.postId)
  }

  private getCategoryTransitionWeight(categoryId: number): number {
    const total = Object.values(this.popularityData.categoryViews)
      .reduce((sum, v) => sum + v, 0)
    return total > 0 
      ? (this.popularityData.categoryViews[categoryId] || 0) / total 
      : 0
  }

  getScore(postId: number): ContentScore | undefined {
    return this.cachedScores.get(postId)
  }

  clearScores(): void {
    this.cachedScores.clear()
    setStorageItem(`${POPULARITY_STORAGE_KEY}_scores`, {
      scores: {},
      lastCalculation: 0,
    })
  }
}

export const popularityScorer = new PopularityScorer()
export default popularityScorer
