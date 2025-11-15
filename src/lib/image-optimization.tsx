import React from 'react';
import Image from 'next/image';
import { WordPressMedia } from '@/types/wordpress';

interface OptimizedImageProps {
  media: WordPressMedia | null;
  alt: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
}

export function OptimizedImage({ 
  media, 
  alt, 
  className = '', 
  priority = false,
  fill = false,
  width,
  height,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}: OptimizedImageProps) {
  if (!media || !media.source_url) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500">No image available</span>
      </div>
    );
  }

  const imageProps = {
    src: media.source_url,
    alt: alt || media.alt_text || 'Image',
    className,
    priority,
    sizes,
  };

  if (fill) {
return (
    <Image
      {...imageProps}
      fill
      style={{ objectFit: 'cover' }}
      alt={alt}
    />
  );
  }

  return (
    <Image
      {...imageProps}
      width={width || media.media_details?.width || 800}
      height={height || media.media_details?.height || 600}
      style={{ width: 'auto', height: 'auto' }}
      alt={alt}
    />
  );
}

// Generate responsive image sizes
export function generateImageSizes(media: WordPressMedia) {
  const sizes = media.media_details?.sizes;
  if (!sizes) return {};

  return {
    thumbnail: sizes.thumbnail?.source_url,
    medium: sizes.medium?.source_url,
    medium_large: sizes.medium_large?.source_url,
    large: sizes.large?.source_url,
    full: media.source_url,
  };
}

// Lazy loading wrapper for images
export function LazyImage({ 
  children, 
  fallback = <div className="animate-pulse bg-gray-200" /> 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative">
      {!isLoaded && fallback}
      {isInView && (
        <div onLoad={() => setIsLoaded(true)}>
          {children}
        </div>
      )}
    </div>
  );
}

// Image optimization utilities
export const imageUtils = {
  // Generate WebP URL (if CDN supports it)
  getWebPUrl: (url: string) => {
    // This would depend on your CDN setup
    // Example for Cloudinary: url.replace('/upload/', '/upload/f_webp/')
    return url;
  },

  // Generate AVIF URL (if CDN supports it)
  getAvifUrl: (url: string) => {
    // This would depend on your CDN setup
    // Example for Cloudinary: url.replace('/upload/', '/upload/f_avif/')
    return url;
  },

  // Calculate optimal image size based on container
  calculateOptimalSize: (containerWidth: number, containerHeight: number) => {
    const aspectRatio = containerWidth / containerHeight;
    const maxWidth = 1920; // Max width for web
    const maxHeight = 1080; // Max height for web

    let width = containerWidth;
    let height = containerHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  },
};