# GraphQL Implementation Guide

This document explains the GraphQL implementation for the headless WordPress application.

## Overview

The application has been updated to use GraphQL for data fetching instead of REST API. This provides better performance, type safety, and reduces the number of API calls needed.

## Architecture

### Core Components

1. **Apollo Client** (`src/lib/apollo-client.ts`)
   - Configures GraphQL client with caching and authentication
   - Handles error policies and network status

2. **GraphQL Queries** (`src/lib/graphql-queries.ts`)
   - Defines all GraphQL queries for WordPress data
   - Includes queries for posts, categories, tags, media, and authors

3. **GraphQL WordPress API** (`src/lib/wordpress-graphql.ts`)
   - Provides the same interface as the REST API
   - Converts GraphQL responses to WordPress-compatible types
   - Maintains backward compatibility

4. **GraphQL Types** (`src/types/graphql.ts`)
   - TypeScript definitions for GraphQL schema
   - Conversion functions between GraphQL and WordPress types

## Usage

### Environment Variables

Add these to your `.env` file:

```env
# GraphQL Configuration
NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL=https://your-wordpress-site.com/graphql
WORDPRESS_API_KEY=your_api_key_here
```

### Using the GraphQL API

The GraphQL API maintains the same interface as the REST API:

```typescript
import { graphqlWordPressAPI } from '@/lib/wordpress-graphql';

// Get posts
const posts = await graphqlWordPressAPI.getPosts({ per_page: 10 });

// Get single post
const post = await graphqlWordPressAPI.getPost('post-slug');

// Get categories
const categories = await graphqlWordPressAPI.getCategories();

// Search posts
const searchResults = await graphqlWordPressAPI.search('query');
```

## WordPress Setup

### Required Plugins

1. **WPGraphQL** - Install and activate the WPGraphQL plugin
2. **WPGraphQL CORS** (optional) - For cross-origin requests

### Installation

```bash
# Install WPGraphQL
wp plugin install wp-graphql --activate

# Install WPGraphQL CORS (if needed)
wp plugin install wp-graphql-cors --activate
```

## Benefits

1. **Performance**: Single GraphQL queries instead of multiple REST calls
2. **Type Safety**: Full TypeScript support with generated types
3. **Caching**: Apollo Client provides intelligent caching
4. **Flexibility**: Request only the data you need
5. **Backward Compatibility**: Existing components work without changes

## Migration Notes

- The REST API (`wordpressAPI`) is still available for fallback
- All existing components have been updated to use GraphQL
- Tests cover both REST and GraphQL implementations
- Environment variables allow switching between APIs

## Testing

Run the GraphQL tests:

```bash
npm test -- --testPathPatterns=wordpress-graphql.test.ts
```

## Troubleshooting

### Common Issues

1. **GraphQL endpoint not found**: Ensure WPGraphQL plugin is installed
2. **CORS errors**: Configure CORS settings in WordPress
3. **Authentication errors**: Set up API key authentication if required

### Debug Mode

Enable Apollo Client debugging:

```typescript
// In apollo-client.ts
const client = new ApolloClient({
  // ... other config
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
  },
});
```

## Future Enhancements

1. **Real-time updates** with GraphQL subscriptions
2. **Query batching** for better performance
3. **Persistent queries** for security
4. **GraphQL Code Generator** for automatic type generation