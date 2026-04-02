# Semantic Search

This document describes the AI-powered semantic search feature implemented in this Next.js headless WordPress news site.

## Overview

The semantic search feature enhances traditional keyword search with intelligent keyword expansion to improve search relevance and recall. It uses a keyword expansion approach to understand query intent and find related content.

## Features

### Keyword Expansion

The semantic search service maintains a mapping of Indonesian and English keywords to their related terms. When a user searches for a term, the service expands the query to include related keywords.

**Example:**
- Search for "teknologi" → expands to include "tech", "digital", "innovation"
- Search for "berita Indonesia" → expands to include "nusantara", "bangsa", "tanah air"

### Fallback Mechanism

If semantic search fails or returns no results, the system automatically falls back to traditional WordPress search.

### Performance Metrics

All search operations are tracked for observability:
- Semantic search duration
- Traditional search duration (fallback)
- Total search duration
- Result count
- Whether keyword expansion was used

## Configuration

The following environment variables can be used to configure the semantic search:

| Variable | Default | Description |
|----------|---------|-------------|
| `SEMANTIC_SEARCH_ENABLED` | `true` | Enable semantic search |
| `SEMANTIC_SEARCH_EXPANSION_ENABLED` | `true` | Enable keyword expansion |
| `SEMANTIC_SEARCH_MAX_KEYWORDS` | `5` | Maximum number of keywords for expansion |
| `SEMANTIC_SEARCH_MIN_QUERY_LENGTH` | `3` | Minimum query length for semantic search |
| `SEMANTIC_SEARCH_FALLBACK` | `true` | Fallback to traditional search if semantic fails |

## Usage

### Using the Service Directly

```typescript
import { semanticSearchService } from '@/lib/services/semanticSearch';

const results = await semanticSearchService.search('berita teknologi', 1, 12);
console.log(results.method); // 'semantic' or 'traditional'
console.log(results.expandedQuery); // expanded query if using semantic
console.log(results.metrics); // performance metrics
```

### Through Enhanced Post Service

The semantic search is integrated into the existing `enhancedPostService`:

```typescript
import { enhancedPostService } from '@/lib/services/enhancedPostService';

const results = await enhancedPostService.searchPosts('berita terkini', 1, 12);
```

## API

### SemanticSearchService

#### `search(query, page, perPage, signal)`

Performs a semantic search with keyword expansion.

**Parameters:**
- `query` (string): The search query
- `page` (number, optional): Page number (default: 1)
- `perPage` (number, optional): Results per page (default: 12)
- `signal` (AbortSignal, optional): Abort signal

**Returns:** `Promise<SemanticSearchResult>`

#### `isEnabled()`

Returns whether semantic search is enabled.

**Returns:** `boolean`

#### `shouldUseSemanticSearch(query)`

Determines if semantic search should be used for a given query.

**Parameters:**
- `query` (string): The search query

**Returns:** `boolean`

#### `getConfig()`

Returns the current configuration.

**Returns:** `SemanticSearchConfig`

#### `addKeywordExpansion(keyword, expansions)`

Adds a custom keyword expansion mapping.

**Parameters:**
- `keyword` (string): The keyword to expand
- `expansions` (string[]): Array of expansion terms

#### `removeKeywordExpansion(keyword)`

Removes a keyword expansion mapping.

**Parameters:**
- `keyword` (string): The keyword to remove

**Returns:** `boolean`

## Metrics

The following metrics are tracked for each search:

- `semanticDuration`: Time spent on semantic search (ms)
- `traditionalDuration`: Time spent on traditional search (ms)
- `totalDuration`: Total search time (ms)
- `resultCount`: Number of results returned
- `usedExpansion`: Whether keyword expansion was used

## Edge Cases

### Empty Queries

Empty queries return zero results with the 'traditional' method.

### Short Queries

Queries shorter than `SEMANTIC_SEARCH_MIN_QUERY_LENGTH` use traditional search.

### No Results

If semantic search returns no results and `SEMANTIC_SEARCH_FALLBACK` is enabled, the system falls back to traditional search.

### API Errors

If the WordPress API fails during semantic search, the system falls back to traditional search and logs a warning.
