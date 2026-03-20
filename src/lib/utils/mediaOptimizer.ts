import type { WordPressMedia } from '@/types/wordpress';

const blurCache = new Map<string, string>();

const DEFAULT_BLUR_PLACEHOLDER = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC9A//2Q==';

export interface MediaOptimizationOptions {
  priority?: boolean;
  sizes?: string;
  quality?: number;
  formats?: Array<'webp' | 'avif'>;
  generateBlur?: boolean;
}

export interface OptimizedMediaResult {
  url: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
  srcSet?: string;
  sizes?: string;
}

export function getWordPressImageUrl(
  baseUrl: string,
  width?: number,
  height?: number
): string {
  if (!baseUrl) return '';

  const url = new URL(baseUrl);
  
  if (width) {
    url.searchParams.set('w', String(width));
  }
  if (height) {
    url.searchParams.set('h', String(height));
  }
  
  return url.toString();
}

export function generateResponsiveSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  if (!baseUrl) return '';

  return widths
    .map(w => `${getWordPressImageUrl(baseUrl, w)} ${w}w`)
    .join(', ');
}

export function generateBlurDataURL(mediaUrl: string): string {
  const cached = blurCache.get(mediaUrl);
  if (cached) return cached;

  return DEFAULT_BLUR_PLACEHOLDER;
}

export async function fetchWordPressMedia(mediaId: number): Promise<WordPressMedia | null> {
  try {
    const response = await fetch(`/api/media/${mediaId}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export function getMediaSizes(context: 'thumbnail' | 'card' | 'hero' | 'content'): string {
  const sizesMap: Record<string, string> = {
    thumbnail: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    hero: '100vw',
    content: '(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw',
  };
  
  return sizesMap[context] || sizesMap.card;
}

export async function optimizeMedia(
  media: WordPressMedia | null,
  options: MediaOptimizationOptions = {}
): Promise<OptimizedMediaResult | null> {
  if (!media?.source_url) {
    return null;
  }

  const {
    priority = false,
    sizes,
    generateBlur = true,
  } = options;

  const result: OptimizedMediaResult = {
    url: media.source_url,
    alt: media.alt_text || media.title?.rendered || '',
    width: 0,
    height: 0,
  };

  if (sizes) {
    result.sizes = sizes;
  }

  if (priority && generateBlur) {
    result.blurDataURL = generateBlurDataURL(media.source_url);
  }

  return result;
}

export function preloadImage(imageUrl: string, as: 'image' = 'image'): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = imageUrl;
  document.head.appendChild(link);
}

interface ImageLoadMetrics {
  loadTime: number;
  size: number;
  format: string;
}

const metricsCache = new Map<string, ImageLoadMetrics>();

export function trackImageLoad(
  imageUrl: string,
  metrics: Omit<ImageLoadMetrics, 'format'>
): void {
  const format = imageUrl.split('.').pop()?.split('?')[0] || 'unknown';
  
  metricsCache.set(imageUrl, {
    ...metrics,
    format,
  });

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[ImageMetrics] ${imageUrl}: ${metrics.loadTime}ms, ${metrics.size}bytes`);
  }
}

export function getImageLoadMetrics(imageUrl: string): ImageLoadMetrics | undefined {
  return metricsCache.get(imageUrl);
}

export function clearMetricsCache(): void {
  metricsCache.clear();
}
