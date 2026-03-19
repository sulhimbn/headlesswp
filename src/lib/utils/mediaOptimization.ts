import { WORDPRESS_SITE_URL } from '@/lib/api/config'
import type { ImageProps } from 'next/image'

export interface MediaOptimizationOptions {
  src: string
  alt?: string
  priority?: boolean
  sizes?: string
}

export interface OptimizedImageConfig {
  useNextImage: boolean
  src: string
  priority: boolean
  sizes: string
  placeholder: 'blur' | 'empty'
  blurDataURL?: string
}

const WORDPRESS_PLACEHOLDER = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC9A//2Q=='

export function isWordPressMediaUrl(url: string): boolean {
  if (!url) return false
  
  try {
    const urlObj = new URL(url)
    const wpUrlObj = new URL(WORDPRESS_SITE_URL)
    
    return urlObj.hostname === wpUrlObj.hostname || 
           url.includes('/wp-content/uploads/') ||
           url.includes('/wp-content/plugins/')
  } catch {
    return false
  }
}

export function extractWordPressMediaDomain(): string {
  try {
    const wpUrl = new URL(WORDPRESS_SITE_URL)
    return wpUrl.hostname
  } catch {
    return 'your-domain.com'
  }
}

export function getMediaOptimizationConfig(options: MediaOptimizationOptions): OptimizedImageConfig {
  const { src, priority = false, sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' } = options
  
  const isWpMedia = isWordPressMediaUrl(src)
  const useNextImage = isWpMedia && typeof window === 'undefined'
  
  return {
    useNextImage,
    src: src || '/placeholder-image.jpg',
    priority,
    sizes,
    placeholder: priority ? 'blur' : 'empty',
    blurDataURL: priority ? WORDPRESS_PLACEHOLDER : undefined,
  }
}

export type { ImageProps }

export const DEFAULT_SIZES = {
  thumbnail: '(max-width: 640px) 100vw, 25vw',
  card: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  hero: '100vw',
  content: '(max-width: 768px) 100vw, 700px',
  avatar: '64px',
} as const