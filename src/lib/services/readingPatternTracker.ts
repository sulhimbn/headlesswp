const PATTERN_STORAGE_KEY = 'reading_patterns'
const MAX_SEQUENCE_LENGTH = 10

export interface ReadingSequence {
  sourcePostId: number
  targetPostId: number
  categoryOverlap: number
  timestamp: number
  count: number
}

export interface CategoryTransition {
  fromCategory: number
  toCategory: number
  count: number
}

export interface ReadingPattern {
  sequences: ReadingSequence[]
  categoryTransitions: CategoryTransition[]
  coOccurrenceMatrix: Map<string, number>
  totalReads: number
}

interface StoredPatternData {
  sequences: ReadingSequence[]
  categoryTransitions: CategoryTransition[]
  coOccurrenceMatrix: Record<string, number>
  totalReads: number
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

export class ReadingPatternTracker {
  private pattern: ReadingPattern
  private recentReadIds: number[] = []

  constructor() {
    this.pattern = this.loadPattern()
  }

  private loadPattern(): ReadingPattern {
    const stored = getStorageItem<StoredPatternData>(PATTERN_STORAGE_KEY, {
      sequences: [],
      categoryTransitions: [],
      coOccurrenceMatrix: {},
      totalReads: 0,
    })

    return {
      sequences: stored.sequences,
      categoryTransitions: stored.categoryTransitions,
      coOccurrenceMatrix: new Map(Object.entries(stored.coOccurrenceMatrix)),
      totalReads: stored.totalReads,
    }
  }

  private savePattern(): void {
    const stored: StoredPatternData = {
      sequences: this.pattern.sequences.slice(-100),
      categoryTransitions: this.pattern.categoryTransitions.slice(-100),
      coOccurrenceMatrix: Object.fromEntries(this.pattern.coOccurrenceMatrix),
      totalReads: this.pattern.totalReads,
    }
    setStorageItem(PATTERN_STORAGE_KEY, stored)
  }

  trackRead(
    postId: number,
    categoryIds: number[],
    _tagIds: number[]
  ): void {
    this.recentReadIds.unshift(postId)
    if (this.recentReadIds.length > MAX_SEQUENCE_LENGTH) {
      this.recentReadIds = this.recentReadIds.slice(0, MAX_SEQUENCE_LENGTH)
    }

    for (let i = 0; i < this.recentReadIds.length - 1; i++) {
      const sourceId = this.recentReadIds[i + 1]
      const targetId = this.recentReadIds[i]

      if (sourceId !== targetId) {
        this.addSequence(sourceId, targetId, categoryIds)
        this.updateCoOccurrence(postId, this.recentReadIds.slice(1, 4))
      }
    }

    for (let i = 0; i < categoryIds.length - 1; i++) {
      for (let j = i + 1; j < categoryIds.length; j++) {
        this.updateCategoryTransition(categoryIds[i], categoryIds[j])
        this.updateCategoryTransition(categoryIds[j], categoryIds[i])
      }
    }

    this.pattern.totalReads++
    this.savePattern()
  }

  private addSequence(
    sourcePostId: number,
    targetPostId: number,
    categories: number[]
  ): void {
    const existingIndex = this.pattern.sequences.findIndex(
      s => s.sourcePostId === sourcePostId && s.targetPostId === targetPostId
    )

    if (existingIndex !== -1) {
      this.pattern.sequences[existingIndex].count++
    } else {
      this.pattern.sequences.push({
        sourcePostId,
        targetPostId,
        categoryOverlap: categories.length,
        timestamp: Date.now(),
        count: 1,
      })
    }
  }

  private updateCoOccurrence(postId: number, coOccurringIds: number[]): void {
    for (const coPostId of coOccurringIds) {
      if (coPostId !== postId) {
        const key = this.createCoOccurrenceKey(postId, coPostId)
        const current = this.pattern.coOccurrenceMatrix.get(key) || 0
        this.pattern.coOccurrenceMatrix.set(key, current + 1)
      }
    }
  }

  private updateCategoryTransition(fromCategory: number, toCategory: number): void {
    const existing = this.pattern.categoryTransitions.find(
      t => t.fromCategory === fromCategory && t.toCategory === toCategory
    )

    if (existing) {
      existing.count++
    } else {
      this.pattern.categoryTransitions.push({
        fromCategory,
        toCategory,
        count: 1,
      })
    }
  }

  private createCoOccurrenceKey(postId1: number, postId2: number): string {
    const sorted = [postId1, postId2].sort((a, b) => a - b)
    return `${sorted[0]}:${sorted[1]}`
  }

  getSequencesForPost(postId: number): ReadingSequence[] {
    return this.pattern.sequences
      .filter(s => s.sourcePostId === postId)
      .sort((a, b) => b.count - a.count)
  }

  getCoOccurringPosts(postId: number): { postId: number; score: number }[] {
    const results: { postId: number; score: number }[] = []

    this.pattern.coOccurrenceMatrix.forEach((count, key) => {
      const [id1, id2] = key.split(':').map(Number)
      if (id1 === postId) {
        results.push({ postId: id2, score: count })
      } else if (id2 === postId) {
        results.push({ postId: id1, score: count })
      }
    })

    return results.sort((a, b) => b.score - a.score)
  }

  getCategoryTransitionProbability(
    fromCategory: number,
    toCategory: number
  ): number {
    const transitions = this.pattern.categoryTransitions.filter(
      t => t.fromCategory === fromCategory
    )
    const total = transitions.reduce((sum, t) => sum + t.count, 0)
    const specific = transitions.find(t => t.toCategory === toCategory)

    if (total === 0) return 0
    return (specific?.count || 0) / total
  }

  getTotalReads(): number {
    return this.pattern.totalReads
  }

  getSequencesCount(): number {
    return this.pattern.sequences.length
  }

  clearPatterns(): void {
    this.pattern = {
      sequences: [],
      categoryTransitions: [],
      coOccurrenceMatrix: new Map(),
      totalReads: 0,
    }
    this.recentReadIds = []
    setStorageItem(PATTERN_STORAGE_KEY, {
      sequences: [],
      categoryTransitions: [],
      coOccurrenceMatrix: {},
      totalReads: 0,
    })
  }
}

export const readingPatternTracker = new ReadingPatternTracker()
export default readingPatternTracker
