'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getRecommendations, trackImpression, trackClick, type RecommendationItem } from '@/lib/services/recommendationEngine'
import { FEATURE_FLAGS } from '@/lib/api/config'
import { RECOMMENDATION_CONFIG, RECOMMENDATION_ALGORITHM } from '@/lib/api/recommendationConfig'
import { getTopCategories, getTopTags, type ReadingHistoryItem } from '@/lib/utils/readingHistory'
import { UI_TEXT } from '@/lib/constants/uiText'

interface AIRecommendationsProps {
  currentPostId: number
  currentCategoryIds: number[]
  currentTagIds?: number[]
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '').trim()
}

function getExcerptText(excerpt: { rendered: string }): string {
  const text = stripHtml(excerpt.rendered)
  return text.length > 120 ? text.substring(0, 120) + '...' : text
}

async function fetchMediaUrl(mediaId: number): Promise<string | null> {
  try {
    const response = await fetch(`/api/media/${mediaId}`)
    if (!response.ok) return null
    const media = await response.json()
    return media.source_url || null
  } catch {
    return null
  }
}

export default function AIRecommendations({ currentPostId, currentCategoryIds, currentTagIds = [] }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadRecommendations = useCallback(async () => {
    if (!FEATURE_FLAGS.PERSONALIZED_RECOMMENDATIONS) {
      setLoading(false)
      return
    }

    let targetCategories = currentCategoryIds
    let targetTags = currentTagIds

    if (RECOMMENDATION_ALGORITHM.USE_PERSONALIZATION) {
      const topCategories = getTopCategories(3)
      const topTags = getTopTags(5)

      if (topCategories.length > 0) {
        targetCategories = topCategories
      }
      if (topTags.length > 0) {
        targetTags = topTags
      }
    }

    let posts = await getRecommendations({
      currentPostId,
      currentCategoryIds: targetCategories,
      currentTagIds: targetTags,
      limit: RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS
    })

    if (RECOMMENDATION_ALGORITHM.USE_PERSONALIZATION) {
      const readPostIds = new Set(
        JSON.parse(localStorage.getItem('reading_history') || '{"items":[]}')
          .items?.map((item: ReadingHistoryItem) => item.postId) || []
      )
      posts = posts.filter(post => !readPostIds.has(post.id))
    }

    if (posts.length < RECOMMENDATION_CONFIG.MIN_RECOMMENDATIONS && currentCategoryIds.length > 0) {
      const fallbackPosts = await getRecommendations({
        currentPostId,
        currentCategoryIds: currentCategoryIds.slice(0, 1),
        currentTagIds: [],
        limit: RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS
      })
      const existingIds = new Set(posts.map(p => p.id))
      for (const post of fallbackPosts) {
        if (!existingIds.has(post.id)) {
          posts.push(post)
          if (posts.length >= RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS) break
        }
      }
    }

    const postsWithMedia = await Promise.all(
      posts.slice(0, RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS).map(async (post) => {
        if (post.featured_media > 0) {
          const mediaUrl = await fetchMediaUrl(post.featured_media)
          return { ...post, mediaUrl }
        }
        return post
      })
    )

    setRecommendations(postsWithMedia)
    postsWithMedia.forEach(post => trackImpression(post.id))
    setLoading(false)
  }, [currentPostId, currentCategoryIds, currentTagIds])

  useEffect(() => {
    loadRecommendations()
  }, [loadRecommendations])

  const handleRecommendationClick = (postId: number) => {
    if (FEATURE_FLAGS.RECOMMENDATION_ANALYTICS) {
      trackClick(postId)
    }
  }

  if (!FEATURE_FLAGS.PERSONALIZED_RECOMMENDATIONS) {
    return null
  }

  if (loading) {
    return (
      <section aria-labelledby="ai-recommendations-heading" className="mt-12">
        <h2 id="ai-recommendations-heading" className="text-2xl font-bold text-[hsl(var(--color-text-primary))] mb-6">
          {UI_TEXT.homePage.personalizedRecommendations || 'Rekomendasi Untuk Anda'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] h-64 animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="ai-recommendations-heading" className="mt-12">
      <h2 id="ai-recommendations-heading" className="text-2xl font-bold text-[hsl(var(--color-text-primary))] mb-6">
        {UI_TEXT.homePage.personalizedRecommendations || 'Rekomendasi Untuk Anda'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map((post) => (
          <article 
            key={post.id} 
            className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden hover:shadow-[var(--shadow-lg)] transition-all duration-[var(--transition-normal)]"
          >
            {post.featured_media > 0 && post.mediaUrl && (
              <Link 
                href={`/berita/${post.slug}`}
                onClick={() => handleRecommendationClick(post.id)}
                className="relative block h-48 focus:outline-none"
                aria-label={`Baca ${post.title.rendered}`}
              >
                <Image
                  src={post.mediaUrl}
                  alt={post.title.rendered}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </Link>
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                <Link
                  href={`/berita/${post.slug}`}
                  onClick={() => handleRecommendationClick(post.id)}
                  className="text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] transition-colors"
                >
                  {post.title.rendered}
                </Link>
              </h3>
              <p className="text-sm text-[hsl(var(--color-text-secondary))] line-clamp-2">
                {getExcerptText(post.excerpt)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}