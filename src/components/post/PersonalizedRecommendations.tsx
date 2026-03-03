'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { sanitizeHTML } from '@/lib/utils/sanitizeHTML'
import { getTopCategories, trackRecommendationClick, type ReadingHistoryItem } from '@/lib/utils/readingHistory'
import { FEATURE_FLAGS, RECOMMENDATION_CONFIG } from '@/lib/api/config'
import { UI_TEXT } from '@/lib/constants/uiText'
import type { WordPressPost } from '@/types/wordpress'

interface PersonalizedRecommendation {
  id: number
  title: { rendered: string }
  excerpt: { rendered: string }
  slug: string
  featured_media: number
  date: string
  mediaUrl?: string | null
}

async function fetchRecommendationsByCategories(categoryIds: number[], excludeId: number): Promise<PersonalizedRecommendation[]> {
  if (categoryIds.length === 0) return []

  try {
    const params = new URLSearchParams({
      categories: categoryIds.join(','),
      per_page: String(RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS + 1),
      _fields: 'id,title,excerpt,slug,featured_media,date',
    })

    const response = await fetch(`/api/posts?${params}`)
    if (!response.ok) return []

    const posts: WordPressPost[] = await response.json()
    return posts
      .filter(post => post.id !== excludeId)
      .slice(0, RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS)
      .map(post => ({ ...post, mediaUrl: null }))
  } catch {
    return []
  }
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

interface PersonalizedRecommendationsProps {
  currentPostId: number
  currentCategoryIds: number[]
}

export default function PersonalizedRecommendations({ currentPostId, currentCategoryIds }: PersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRecommendations() {
      if (!FEATURE_FLAGS.PERSONALIZED_RECOMMENDATIONS) {
        setLoading(false)
        return
      }

      const topCategories = getTopCategories(3)
      const relevantCategories = topCategories.length > 0 
        ? topCategories 
        : currentCategoryIds.slice(0, 2)

      let posts = await fetchRecommendationsByCategories(relevantCategories, currentPostId)

      const readPostIds = new Set(
        JSON.parse(localStorage.getItem('reading_history') || '{"items":[]}')
          .items?.map((item: ReadingHistoryItem) => item.postId) || []
      )

      posts = posts.filter(post => !readPostIds.has(post.id) && post.id !== currentPostId)

      if (posts.length < RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS && currentCategoryIds.length > 0) {
        const additionalPosts = await fetchRecommendationsByCategories(
          currentCategoryIds.slice(0, 1),
          currentPostId
        )
        const existingIds = new Set(posts.map(p => p.id))
        for (const post of additionalPosts) {
          if (!existingIds.has(post.id) && post.id !== currentPostId && !readPostIds.has(post.id)) {
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
      setLoading(false)
    }

    loadRecommendations()
  }, [currentPostId, currentCategoryIds.join(',')])

  const handleRecommendationClick = (postId: number) => {
    if (FEATURE_FLAGS.RECOMMENDATION_ANALYTICS) {
      trackRecommendationClick(postId, 'personalized')
    }
  }

  if (!FEATURE_FLAGS.PERSONALIZED_RECOMMENDATIONS) {
    return null
  }

  if (loading) {
    return (
      <section aria-labelledby="personalized-heading" className="mt-12">
        <h2 id="personalized-heading" className="text-2xl font-bold text-[hsl(var(--color-text-primary))] mb-6">
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
    <section aria-labelledby="personalized-heading" className="mt-12">
      <h2 id="personalized-heading" className="text-2xl font-bold text-[hsl(var(--color-text-primary))] mb-6">
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
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC9A//2Q=="
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
              <div
                className="text-sm text-[hsl(var(--color-text-secondary))] line-clamp-2"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.excerpt.rendered, 'excerpt') }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
