# Mock WordPress API Server

This document describes how to use the MSW (Mock Service Worker) setup for frontend development without a running WordPress backend.

## Overview

The project includes a mock WordPress API server using MSW that intercepts API calls and returns mock data. This allows frontend developers to work without a running WordPress instance.

## Enabling Mock Mode

### Development Environment

To enable mock mode in development, set the environment variable:

```bash
NEXT_PUBLIC_USE_MOCK=true npm run dev
```

Or add to your `.env.local`:

```
NEXT_PUBLIC_USE_MOCK=true
```

When enabled, MSW will intercept all WordPress API calls (`/wp-json/wp/v2/*`) and return mock data instead of making real requests.

### Disabling Mock Mode

Simply remove or set to `false`:

```bash
NEXT_PUBLIC_USE_MOCK=false npm run dev
```

## Mock Data

The mock server provides data for:

- **Posts** (`/wp-json/wp/v2/posts`): 3 sample posts with pagination support
- **Categories** (`/wp-json/wp/v2/categories`): 4 categories (Politik, Budaya, Ekonomi, Pendidikan)
- **Tags** (`/wp-json/wp/v2/tags`): 4 tags (Festival, Budaya, Infrastruktur, Pendidikan)
- **Media** (`/wp-json/wp/v2/media`): 3 sample images (using picsum.photos)
- **Authors** (`/wp-json/wp/v2/users`): 2 sample authors

## Testing with Mock Server

The mock server can also be used in tests. Import the server setup:

```typescript
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Customizing Mock Data

To customize mock data, edit `src/mocks/data/wordpress.ts`. The data structure follows the WordPress REST API format.

## Files

- `src/mocks/index.ts` - Main exports
- `src/mocks/data/wordpress.ts` - Mock data
- `src/mocks/handlers/wordpress.ts` - MSW handlers
- `src/mocks/browser.ts` - Browser worker setup
- `src/mocks/server.ts` - Node/server setup for testing
- `public/mockServiceWorker.js` - MSW service worker

## Troubleshooting

If requests are not being intercepted:
1. Verify `NEXT_PUBLIC_USE_MOCK=true` is set
2. Check browser console for MSW initialization messages
3. Ensure requests are going to `/wp-json/wp/v2/*` endpoints