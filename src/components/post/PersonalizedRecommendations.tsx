"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { sanitizeHTML } from "@/lib/utils/sanitizeHTML";
import {
  getTopCategories,
  getReadingHistory,
  trackRecommendationClick,
} from "@/lib/utils/readingHistory";
import { FEATURE_FLAGS, RECOMMENDATION_CONFIG } from "@/lib/api/config";
import { UI_TEXT } from "@/lib/constants/uiText";
import type { WordPressPost } from "@/types/wordpress";

interface RecommendationPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  slug: string;
  featured_media: number;
  date: string;
  categories: number[];
  summary?: string;
  summaryGenerated?: boolean;
  mediaUrl?: string | null;
}

interface PersonalizedRecommendationsProps {
  currentPostId: number;
  currentCategoryIds: number[];
}

async function fetchAIRecommendations(
  type: "personalized" | "popular",
  categories: number[],
  postId: number,
): Promise<RecommendationPost[]> {
  try {
    const params = new URLSearchParams({
      post_id: String(postId),
      categories: categories.join(","),
      summary: "true",
    });

    const response = await fetch(`/api/recommendations/${type}?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    return data.recommendations || [];
  } catch {
    return [];
  }
}

async function fetchMediaUrl(mediaId: number): Promise<string | null> {
  try {
    const response = await fetch(`/api/media/${mediaId}`);
    if (!response.ok) return null;
    const media = await response.json();
    return media.source_url || null;
  } catch {
    return null;
  }
}

async function fetchRecommendationsByCategories(
  categoryIds: number[],
  excludeId: number,
): Promise<RecommendationPost[]> {
  if (categoryIds.length === 0) return [];

  try {
    const params = new URLSearchParams({
      categories: categoryIds.join(","),
      per_page: String(RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS + 1),
      _fields: "id,title,excerpt,slug,featured_media,date,categories,tags",
      exclude: String(excludeId),
    });

    const response = await fetch(`/api/posts?${params}`);
    if (!response.ok) return [];

    const posts: WordPressPost[] = await response.json();
    return posts
      .filter((post) => post.id !== excludeId)
      .slice(0, RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS)
      .map((post) => ({ ...post, mediaUrl: null }));
  } catch {
    return [];
  }
}

export default function PersonalizedRecommendations({
  currentPostId,
  currentCategoryIds,
}: PersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationPost[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      if (!FEATURE_FLAGS.PERSONALIZED_RECOMMENDATIONS) {
        setLoading(false);
        return;
      }

      const topCategories = getTopCategories(3);
      const relevantCategories =
        topCategories.length > 0
          ? topCategories
          : currentCategoryIds.slice(0, 2);

      let posts = await fetchAIRecommendations(
        "personalized",
        relevantCategories,
        currentPostId,
      );

      if (posts.length === 0) {
        posts = await fetchRecommendationsByCategories(
          relevantCategories,
          currentPostId,
        );
      }

      const history = getReadingHistory();
      const readPostIds = new Set(history.items.map((item) => item.postId));

      posts = posts.filter(
        (post) => !readPostIds.has(post.id) && post.id !== currentPostId,
      );

      if (
        posts.length < RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS &&
        currentCategoryIds.length > 0
      ) {
        const additionalPosts = await fetchRecommendationsByCategories(
          currentCategoryIds.slice(0, 1),
          currentPostId,
        );
        const existingIds = new Set(posts.map((p) => p.id));
        for (const post of additionalPosts) {
          if (
            !existingIds.has(post.id) &&
            post.id !== currentPostId &&
            !readPostIds.has(post.id)
          ) {
            posts.push(post);
            if (posts.length >= RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS)
              break;
          }
        }
      }

      if (posts.length < RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS) {
        const fallbackPosts = await fetchAIRecommendations(
          "popular",
          [],
          currentPostId,
        );
        const existingIds = new Set(posts.map((p) => p.id));
        for (const post of fallbackPosts) {
          if (
            !existingIds.has(post.id) &&
            post.id !== currentPostId &&
            !readPostIds.has(post.id)
          ) {
            posts.push(post);
            if (posts.length >= RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS)
              break;
          }
        }
      }

      const postsWithMedia = await Promise.all(
        posts
          .slice(0, RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS)
          .map(async (post) => {
            if (post.featured_media > 0 && !post.mediaUrl) {
              const mediaUrl = await fetchMediaUrl(post.featured_media);
              return { ...post, mediaUrl };
            }
            return post;
          }),
      );

      setRecommendations(postsWithMedia);
      setLoading(false);
    }

    loadRecommendations();
  }, [currentPostId, currentCategoryIds.join(",")]);

  const handleRecommendationClick = (postId: number) => {
    if (FEATURE_FLAGS.RECOMMENDATION_ANALYTICS) {
      trackRecommendationClick(postId, "personalized");
    }
  };

  if (!FEATURE_FLAGS.PERSONALIZED_RECOMMENDATIONS) {
    return null;
  }

  if (loading) {
    return (
      <section aria-labelledby="personalized-heading" className="mt-12">
        <h2
          id="personalized-heading"
          className="text-2xl font-bold text-[hsl(var(--color-text-primary))] mb-6"
        >
          {UI_TEXT.homePage.personalizedRecommendations ||
            "Rekomendasi Untuk Anda"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] h-64 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="personalized-heading" className="mt-12">
      <h2
        id="personalized-heading"
        className="text-2xl font-bold text-[hsl(var(--color-text-primary))] mb-6"
      >
        {UI_TEXT.homePage.personalizedRecommendations ||
          "Rekomendasi Untuk Anda"}
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
              {post.summaryGenerated && post.summary && (
                <div className="text-xs text-[hsl(var(--color-primary))] mb-2 font-medium">
                  AI Summary: {post.summary}
                </div>
              )}
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
                dangerouslySetInnerHTML={{
                  __html: sanitizeHTML(post.excerpt.rendered, "excerpt"),
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
