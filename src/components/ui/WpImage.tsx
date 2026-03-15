import Image, { ImageProps } from 'next/image'
import { forwardRef, memo, useMemo } from 'react'

interface WpImageProps extends Omit<ImageProps, 'src'> {
  src: string
  wpUrl?: string
}

const WpImageComponent = forwardRef<HTMLImageElement, WpImageProps>(
  (
    {
      src,
      alt = '',
      loading = 'lazy',
      placeholder = 'blur',
      blurDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==',
      sizes,
      ...props
    },
    ref
  ) => {
    const sizesValue = useMemo(() => {
      if (sizes) return sizes
      if (props.priority) return '100vw'
      return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
    }, [sizes, props.priority])

    const loadingValue = useMemo(() => {
      if (props.priority) return 'eager'
      return loading
    }, [props.priority, loading])

    return (
      <Image
        ref={ref}
        src={src}
        alt={alt}
        loading={loadingValue}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        sizes={sizesValue}
        {...props}
      />
    )
  }
)

WpImageComponent.displayName = 'WpImage'

const WpImage = memo(WpImageComponent)
WpImage.displayName = 'WpImage'

export default WpImage