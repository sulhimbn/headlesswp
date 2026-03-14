import Image, { ImageProps } from 'next/image'
import { memo } from 'react'
import { createArePropsEqual } from '@/lib/utils/memoization'

type WordPressImageSource = string | {
  source_url: string;
  alt_text?: string;
  media_details?: {
    width: number;
    height: number;
    sizes?: {
      medium?: { source_url: string; width: number; height: number };
      medium_large?: { source_url: string; width: number; height: number };
      large?: { source_url: string; width: number; height: number };
      thumbnail?: { source_url: string; width: number; height: number };
      full?: { source_url: string; width: number; height: number };
    };
  };
  title?: { rendered: string };
}

interface WordPressImageProps extends Omit<ImageProps, 'src' | 'alt' | 'width' | 'height'> {
  media: WordPressImageSource | null | undefined
  alt?: string
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
}

const WORDPRESSIMAGE_PROPS: (keyof WordPressImageProps)[] = [
  'media',
  'alt',
  'priority',
  'fill',
  'width',
  'height',
  'sizes',
  'className',
  'style',
]

const arePropsEqual = createArePropsEqual<WordPressImageProps>(WORDPRESSIMAGE_PROPS)

function getMediaUrl(media: WordPressImageSource): string {
  if (typeof media === 'string') {
    return media
  }
  return media.source_url || ''
}

function getMediaDimensions(media: WordPressImageSource): { width?: number; height?: number } {
  if (typeof media === 'string') {
    return {}
  }
  
  if (media.media_details?.width && media.media_details?.height) {
    return {
      width: media.media_details.width,
      height: media.media_details.height,
    }
  }
  
  return {}
}

function getMediaAlt(media: WordPressImageSource, fallbackAlt?: string): string {
  if (typeof media === 'string') {
    return fallbackAlt || ''
  }
  
  return media.alt_text || media.title?.rendered || fallbackAlt || ''
}

function WordPressImageComponent({
  media,
  alt,
  priority = false,
  fill = false,
  width,
  height,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  className,
  style,
  ...props
}: WordPressImageProps) {
  if (!media) {
    return null
  }

  const src = getMediaUrl(media)
  
  if (!src) {
    return null
  }

  const dimensions = getMediaDimensions(media)
  const resolvedAlt = getMediaAlt(media, alt)
  
  const resolvedWidth = width || dimensions.width
  const resolvedHeight = height || dimensions.height

  const imageProps: ImageProps = fill
    ? {
        src,
        alt: resolvedAlt,
        priority,
        sizes,
        className,
        style,
        fill: true,
        ...(dimensions.width && dimensions.height ? { width: dimensions.width, height: dimensions.height } : {}),
        ...props,
      }
    : {
        src,
        alt: resolvedAlt,
        priority,
        sizes,
        className,
        style,
        width: resolvedWidth,
        height: resolvedHeight,
        ...props,
      }

  return <Image {...imageProps} />
}

const WordPressImage = memo(WordPressImageComponent, arePropsEqual)
WordPressImage.displayName = 'WordPressImage'

export default WordPressImage
