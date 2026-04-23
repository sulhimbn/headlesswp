import { NextRequest, NextResponse } from "next/server";
import { wordpressAPI } from "@/lib/wordpress";
import { summarizePost } from "@/lib/services/summarizer";
import { cacheManager } from "@/lib/cache";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

const CACHE_TTL_RECOMMENDATIONS = 15 * 60 * 1000;

interface RouteParams {
  params: Promise<{ type: string }>;
}

interface RecommendationPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  slug: string;
  featured_media: number;
  date: string;
  categories: number[];
  tags: number[];
  summary?: string;
  summaryGenerated?: boolean;
}

function getCacheKey(type: string, postId?: number): string {
  return `recommendations:${type}${postId ? `:${postId}` : ""}`;
}

async function getPopularPosts(): Promise<RecommendationPost[]> {
  const cacheKey = getCacheKey("popular");
  const cached = cacheManager.get<RecommendationPost[]>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const response = await wordpressAPI.getPosts({
      per_page: 10,
      _fields: "id,title,excerpt,slug,featured_media,date,categories,tags",
      orderby: "date",
      order: "desc",
    });

    const posts: RecommendationPost[] = Array.isArray(response) ? response : [];

    cacheManager.set(cacheKey, posts, CACHE_TTL_RECOMMENDATIONS);

    return posts;
  } catch (error) {
    logger.error("Failed to fetch popular posts", error, {
      module: "recommendations-api",
    });
    return [];
  }
}

async function getPostsByCategories(
  categoryIds: number[],
  excludeId: number,
): Promise<RecommendationPost[]> {
  if (categoryIds.length === 0) return [];

  try {
    const params = {
      categories: categoryIds.join(","),
      per_page: "10",
      exclude: String(excludeId),
      _fields: "id,title,excerpt,slug,featured_media,date,categories,tags",
    };

    const response = await wordpressAPI.getPosts(params);
    const posts: RecommendationPost[] = Array.isArray(response) ? response : [];

    return posts.filter((post) => post.id !== excludeId);
  } catch (error) {
    logger.error("Failed to fetch posts by categories", error, {
      categoryIds,
      module: "recommendations-api",
    });
    return [];
  }
}

async function generateAISummary(
  postId: number,
  content: string,
): Promise<string | undefined> {
  try {
    const result = await summarizePost(postId, content);
    return result.summary;
  } catch (error) {
    logger.error("Failed to generate AI summary for recommendation", error, {
      postId,
      module: "recommendations-api",
    });
    return undefined;
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { type } = await params;
    const { searchParams } = new URL(request.url);
    const postId = parseInt(searchParams.get("post_id") || "0", 10);
    const categories =
      searchParams.get("categories")?.split(",").map(Number).filter(Boolean) ||
      [];
    const includeSummary = searchParams.get("summary") === "true";

    let recommendations: RecommendationPost[] = [];
    let source: string;

    if (type === "personalized" && categories.length > 0) {
      source = "personalized";
      recommendations = await getPostsByCategories(categories, postId);

      if (recommendations.length < 3) {
        const popular = await getPopularPosts();
        const existingIds = new Set(recommendations.map((p) => p.id));
        for (const post of popular) {
          if (!existingIds.has(post.id) && post.id !== postId) {
            recommendations.push(post);
            if (recommendations.length >= 6) break;
          }
        }
      }
    } else {
      source = "popular";
      recommendations = await getPopularPosts();
    }

    const excludeIds = new Set([
      postId,
      ...(searchParams.get("exclude")?.split(",").map(Number).filter(Boolean) ||
        []),
    ]);
    recommendations = recommendations
      .filter((post) => !excludeIds.has(post.id))
      .slice(0, 6);

    if (includeSummary && recommendations.length > 0) {
      const postsWithSummary = await Promise.all(
        recommendations.slice(0, 3).map(async (post) => {
          try {
            const fullPost = await wordpressAPI.getPostById(post.id);
            const summary = await generateAISummary(
              post.id,
              fullPost.content.rendered,
            );
            return {
              ...post,
              summary,
              summaryGenerated: !!summary,
            };
          } catch {
            return post;
          }
        }),
      );

      recommendations = [...postsWithSummary, ...recommendations.slice(3)];
    }

    logger.info("Recommendations API request", {
      type,
      postId,
      categories: categories.join(","),
      count: recommendations.length,
      source,
      includeSummary,
      module: "recommendations-api",
    });

    return NextResponse.json({
      recommendations: recommendations.slice(0, 6),
      source,
      count: recommendations.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Recommendations API error", error, {
      module: "recommendations-api",
    });
    return NextResponse.json(
      { error: "Failed to fetch recommendations", recommendations: [] },
      { status: 500 },
    );
  }
}
