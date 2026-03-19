import Image, { type ImageProps } from 'next/image'
import { getPlaceholderBlur, isPlaceholderUrl } from '@/lib/utils/blurPlaceholder'
import { memo } from 'react'

export type MediaPriority = 'high' | 'low' | 'auto'

interface MediaProps extends Omit<ImageProps, 'src' | 'placeholder' | 'blurDataURL' | 'priority' | 'alt'> {
  src: string | null | undefined
  priority?: MediaPriority
  showBlur?: boolean
  alt?: string
  variant?: 'filled' | 'card' | 'thumbnail'
}

const PRIORITY_MAP: Record<MediaPriority, boolean> = {
  high: true,
  low: false,
  auto: false,
}

const FILLED_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 100vw'
const CARD_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
const THUMBNAIL_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'

export function getOptimizedSizes(variant: 'filled' | 'card' | 'thumbnail'): string {
  switch (variant) {
    case 'filled':
      return FILLED_SIZES
    case 'card':
      return CARD_SIZES
    case 'thumbnail':
      return THUMBNAIL_SIZES
    default:
      return FILLED_SIZES
  }
}

function MediaComponent({
  src,
  priority = 'auto',
  showBlur = true,
  alt = '',
  sizes,
  variant = 'filled',
  className,
  ...props
}: MediaProps) {
  const isPriority = PRIORITY_MAP[priority]
  const resolvedSrc = isPlaceholderUrl(src) ? '/placeholder-image.jpg' : (src || '/placeholder-image.jpg')
  const blurDataURL = getPlaceholderBlur()

  const optimizedSizes = sizes || getOptimizedSizes(variant)

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      placeholder={showBlur && !isPlaceholderUrl(src) ? 'blur' : 'empty'}
      blurDataURL={blurDataURL}
      priority={isPriority}
      sizes={optimizedSizes}
      className={className}
      {...props}
    />
  )
}

export default memo(MediaComponent)
