'use client'

import { useState, useRef, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'

type WordPressImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  src: string | null | undefined
  alt: string
  fallbackSrc?: string
}

const BLUR_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC9A//2Q=='

function WordPressImageComponent({
  src,
  alt,
  fallbackSrc = '/placeholder-image.jpg',
  priority = false,
  loading,
  className,
  ...props
}: WordPressImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackSrc)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!src) {
      setCurrentSrc(fallbackSrc)
      return
    }
    setCurrentSrc(src)
  }, [src, fallbackSrc])

  useEffect(() => {
    if (priority) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '200px',
        threshold: 0,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
    }
  }

  return (
    <div ref={imgRef} className={`relative ${className || ''}`}>
      <Image
        src={currentSrc}
        alt={alt}
        priority={priority}
        loading={priority ? 'eager' : (loading || (isInView ? 'lazy' : 'lazy'))}
        placeholder={priority ? 'blur' : 'empty'}
        blurDataURL={priority ? BLUR_BASE64 : undefined}
        className={`${className || ''} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  )
}

export default function WordPressImage(props: WordPressImageProps) {
  return <WordPressImageComponent {...props} />
}
