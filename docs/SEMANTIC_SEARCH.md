# Semantic Search Implementation

## Overview

This document describes the AI-powered semantic search implementation for the headless WordPress CMS.

## Problem Statement

The current search implementation uses basic WordPress REST API keyword matching, which has limitations:
- Only matches exact or partial keywords
- No understanding of semantic meaning
- Poor results for natural language queries

## Solution: Hybrid Semantic Search

We implement a **hybrid approach** that:
1. Uses AI embeddings for semantic understanding when available
2. Falls back to traditional keyword search for reliability
3. Provides configuration for cost-effective usage

### Cost-Effective Options Evaluated

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| OpenAI Embeddings API | $0.0004/1K tokens | High quality, reliable | API costs |
| sentence-transformers | Free (local) | No API costs | Slower, resource intensive |
| Hybrid (current) | Minimal | Balances quality/cost | Requires API key |

### Recommended Approach

**Primary**: OpenAI Embeddings API with fallback to keyword search
- Free tier: $5/month credit (sufficient for ~12K searches)
- Easy to disable if not configured

**Fallback**: Traditional WordPress search

## Configuration

Environment variables required:

```env
# Enable semantic search (optional, defaults to false)
NEXT_PUBLIC_SEMANTIC_SEARCH_ENABLED=false

# OpenAI API key for embeddings (optional)
OPENAI_API_KEY=

# Embedding model (optional, defaults to text-embedding-3-small)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

## API Endpoint

```
GET /api/search?q=<query>&page=<page>&useSemantic=<true|false>
```

Response:
```json
{
  "posts": [...],
  "totalPosts": 10,
  "totalPages": 1,
  "searchType": "semantic" | "keyword"
}
```

## Implementation Details

1. **Service Layer**: `src/lib/services/semanticSearch.ts`
   - Generates embeddings for search query
   - Computes similarity scores with post content
   - Falls back gracefully on errors

2. **API Route**: `src/app/api/search/route.ts`
   - Handles search requests
   - Supports optional `useSemantic` parameter
   - Includes rate limiting

3. **Enhanced Post Service Integration**
   - Modified `enhancedPostService.ts` to use semantic search
   - Maintains backward compatibility

## Testing

Tests are located in `__tests__/semanticSearch.test.ts` and cover:
- Semantic search with embeddings
- Fallback to keyword search
- Error handling
- Empty results
- Configuration options
