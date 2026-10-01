'use client'

import { forwardRef, useState, useEffect, useCallback, type ReactEventHandler } from 'react'
import Image from 'next/image'
import { trackImageLoad, getMediaSizes } from '@/lib/utils/mediaOptimizer'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  context?: 'thumbnail' | 'card' | 'hero' | 'content'
  sizes?: string
  quality?: number
  className?: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoadComplete?: () => void
  onError?: ReactEventHandler<HTMLImageElement>
}

const observerOptions: IntersectionObserverInit = {
  rootMargin: '50px 0px',
  threshold: 0.01,
}

const OptimizedImageComponent = forwardRef<HTMLDivElement, OptimizedImageProps>(function OptimizedImageComponent(
  {
    src,
    alt,
    width,
    height,
    fill = false,
    priority = false,
    context = 'card',
    sizes,
    quality,
    className = '',
    placeholder = 'empty',
    blurDataURL,
    onLoadComplete,
    onError,
  },
  ref
) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const [startTime, setStartTime] = useState<number>(0)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (priority || typeof window === 'undefined') {
      setIsInView(true)
      return
    }

    if (!containerRef) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      })
    }, observerOptions)

    observer.observe(containerRef)

    return () => observer.disconnect()
  }, [priority, containerRef])

  const handleLoad = useCallback(() => {
    const loadTime = performance.now() - startTime
    setIsLoaded(true)
    
    if (onLoadComplete) {
      onLoadComplete()
    }

    trackImageLoad(src, {
      loadTime,
      size: 0,
    })
  }, [src, startTime, onLoadComplete])

  useEffect(() => {
    if (isInView && src) {
      setStartTime(performance.now())
    }
  }, [isInView, src])

  useEffect(() => {
    if (ref && containerRef) {
      if (typeof ref === 'function') {
        ref(containerRef)
      } else {
        ref.current = containerRef
      }
    }
  }, [ref, containerRef])

  if (!isInView) {
    return (
      <div
        ref={setContainerRef}
        className={`${className} bg-[hsl(var(--color-surface))] animate-pulse`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
        }}
        aria-hidden="true"
      />
    )
  }

  const imageSizes = sizes || getMediaSizes(context)
  const blurPlaceholder: string | undefined = placeholder === 'blur' 
    ? blurDataURL || 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC9A//2Q=='
    : undefined

  return (
    <div
      ref={setContainerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: fill ? '100%' : width,
        height: fill ? '100%' : height,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        sizes={imageSizes}
        quality={quality || 75}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurPlaceholder}
        onLoad={handleLoad}
        onError={onError}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </div>
  )
})

export default OptimizedImageComponent
