/**
 * Responsive image utilities for Next.js Image component
 */

/**
 * Generates responsive sizes attribute based on container width
 * Using standard breakpoints:
 * - Mobile: < 640px (100vw)
 * - Tablet: 640-1024px (90vw)
 * - Desktop: > 1024px (container width or 100vw)
 * 
 * @param containerWidth - Max container width in pixels (default: 1200)
 * @returns sizes attribute string
 */
export function getResponsiveSizes(containerWidth: number = 1200): string {
  if (containerWidth <= 640) {
    return '100vw';
  }
  if (containerWidth <= 1024) {
    return '(max-width: 640px) 100vw, 90vw';
  }
  return `(max-width: 640px) 100vw, (max-width: 1024px) 90vw, ${containerWidth}px`;
}

/**
 * Image sizes for different contexts
 */
export const IMAGE_SIZES = {
  // Featured images in post detail pages (max-w-4xl = 896px)
  postDetail: getResponsiveSizes(896),
  // Post cards in grid views (around 400px for 3-col grid)  
  postCard: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px',
  // Full width hero images
  hero: '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 100vw',
  // Author avatar
  avatar: '48px',
} as const;
