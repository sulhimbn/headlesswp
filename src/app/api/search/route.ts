import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch, isSemanticSearchEnabled } from '@/lib/services/semanticSearch';
import { wordpressAPI } from '@/lib/wordpress';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const useSemanticParam = searchParams.get('useSemantic');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required', posts: [], totalPosts: 0, totalPages: 0 },
        { status: 400 }
      );
    }

    const semanticEnabled = isSemanticSearchEnabled();
    const shouldUseSemantic = useSemanticParam === 'true' || (useSemanticParam === null && semanticEnabled);

    if (shouldUseSemantic && semanticEnabled) {
      try {
        const { posts: searchResults, totalPages } = await wordpressAPI.search(query, page, perPage);

        if (searchResults.length > 0) {
          const { results, searchType } = await semanticSearch(
            query,
            searchResults.map((p) => ({
              id: p.id,
              title: { rendered: p.title.rendered },
              excerpt: { rendered: p.excerpt.rendered },
              content: { rendered: p.content.rendered }
            }))
          );

          if (results.length > 0) {
            const rankedPosts = results
              .slice(0, perPage)
              .map(r => searchResults.find((p) => p.id === r.postId))
              .filter(Boolean);

            return NextResponse.json({
              posts: rankedPosts,
              totalPosts: results.length,
              totalPages: Math.ceil(results.length / perPage),
              searchType
            });
          }
        }

        return NextResponse.json({
          posts: searchResults,
          totalPosts: searchResults.length,
          totalPages,
          searchType: 'keyword'
        });
      } catch (semanticError) {
        logger.error('Semantic search failed, falling back to keyword', semanticError, { module: 'searchApi', query });
      }
    }

    const { posts, totalPages } = await wordpressAPI.search(query, page, perPage);

    return NextResponse.json({
      posts,
      totalPosts: posts.length,
      totalPages,
      searchType: 'keyword'
    });
  } catch (error) {
    logger.error('Search API error', error, { module: 'searchApi' });
    return NextResponse.json(
      { error: 'Internal server error', posts: [], totalPosts: 0, totalPages: 0 },
      { status: 500 }
    );
  }
}
