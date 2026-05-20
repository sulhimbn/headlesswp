# OG Image Generation

Automated dynamic OG image generation for social sharing in Next.js headless WordPress news site.

## Features

- **Dynamic OG Image Generation**: Creates OG images on-the-fly based on article data
- **Article Data Integration**: Uses article title, featured image, category, author, and date
- **Caching**: Caches generated images for 24 hours to improve performance
- **Metadata Integration**: Automatically integrates with Next.js metadata API

## API Endpoint

### GET /api/og-image

Generates an OG image with the specified parameters.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Article title (max 80 chars displayed) |
| postId | string | No | Post ID for caching |
| image | string | No | Featured image URL |
| category | string | No | Article category |
| author | string | No | Author name |
| date | string | No | Publication date |

**Response:** PNG image (1200x630)

**Caching:** Images are cached for 24 hours using the application's cache manager.

## Usage

### Automatic (Recommended)

OG images are automatically generated when viewing article pages. The metadata API integrates with the OG image endpoint.

```typescript
// Automatically used in article pages via generateMetadata
const ogImageUrl = getOGImageUrl(baseUrl, post)
```

### Manual

You can also directly query the OG image API:

```
/api/og-image?title=Article%20Title&category=News&author=John%20Doe&date=2024-01-01
```

## Configuration

Default configuration in `src/app/api/og-image/route.tsx`:

```typescript
export const OG_IMAGE_CONFIG = {
  width: 1200,
  height: 630,
  siteName: 'Mitra Banten News',
  defaultBg: '#1a1a2e',
  defaultText: '#ffffff',
  accentColor: '#e63946',
}
```

## Dependencies

- `@vercel/og` - Image generation
- Application cache manager - Caching

## Testing

Run tests:

```bash
npm test -- __tests__/ogImage.test.ts
```
