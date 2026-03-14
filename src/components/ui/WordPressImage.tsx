'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image, { ImageProps } from 'next/image'
import { WORDPRESS_SITE_URL } from '@/lib/api/config'

type BlurPlaceholder = 'blur' | 'empty' | 'data-uri'

interface WordPressImageProps extends Omit<ImageProps, 'onLoad'> {
  priority?: boolean
  blurPlaceholder?: BlurPlaceholder
  sizes?: string
  useV2?: boolean
}

const tinyPlaceholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

const generateBlurDataUrl = (width: number): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.round(width * 0.75)}"><rect fill="#f3f4f6" width="${width}" height="${Math.round(width * 0.75)}"/></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

function WordPressImageComponent({
  src,
  alt,
  priority = false,
  blurPlaceholder = 'blur',
  sizes = '100vw',
  useV2 = false,
  className = '',
  ...props
}: WordPressImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(priority)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (priority || isVisible) return

    const currentRef = imgRef.current
    if (!currentRef) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            setIsInView(true)
            observerRef.current?.disconnect()
          }
        })
      },
      {
        rootMargin: '200px',
        threshold: 0.01,
      }
    )

    observerRef.current.observe(currentRef)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [priority, isVisible])

  useEffect(() => {
    if (!isInView || priority || isVisible) return

    const currentRef = imgRef.current
    if (!currentRef) return

    const preloadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            preloadObserver.disconnect()
          }
        })
      },
      {
        rootMargin: '100px',
        threshold: 0,
      }
    )

    preloadObserver.observe(currentRef)

    return () => {
      preloadObserver.disconnect()
    }
  }, [isInView, priority, isVisible])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const blurDataUrl = blurPlaceholder === 'blur' ? generateBlurDataUrl(800) : tinyPlaceholder

  const imageSrc = useV2 && typeof src === 'string' && src.includes(WORDPRESS_SITE_URL) 
    ? src.replace(WORDPRESS_SITE_URL, `${WORDPRESS_SITE_URL}`) 
    : src

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: !isLoaded && blurPlaceholder !== 'empty' ? `url(${blurDataUrl})` : 'transparent',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder={blurPlaceholder === 'blur' ? 'blur' : 'empty'}
        blurDataURL={blurPlaceholder === 'blur' ? blurDataUrl : undefined}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={handleLoad}
        {...props}
      />
    </div>
  )
}

export default function WordPressImage(props: WordPressImageProps) {
  return <WordPressImageComponent {...props} />
}

export const createWordPressImageProps = (
  mediaUrl: string | null | undefined,
  altText: string,
  options: {
    priority?: boolean
    sizes?: string
    useV2?: boolean
  } = {}
): WordPressImageProps | null => {
  if (!mediaUrl) return null

  return {
    src: mediaUrl,
    alt: altText,
    priority: options.priority ?? false,
    sizes: options.sizes ?? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    useV2: options.useV2 ?? false,
  }
}