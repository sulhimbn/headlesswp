'use client'

import { useCallback, useRef, type ReactNode, type ElementType } from 'react'
import Link, { type LinkProps } from 'next/link'
import { usePredictivePrefetch } from '@/lib/hooks/usePredictivePrefetch'

interface SmartLinkProps<T extends ElementType> extends Omit<LinkProps<T>, 'href'> {
  href: string
  children: ReactNode
  className?: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  prefetchEnabled?: boolean
}

const prefetchTimeoutRef = { current: null as NodeJS.Timeout | null }

export default function SmartLink<T extends ElementType = 'a'>({
  href,
  children,
  className,
  onClick,
  prefetchEnabled = true,
  ...props
}: SmartLinkProps<T>) {
  const { getPredictions, prefetchPage } = usePredictivePrefetch()
  const linkRef = useRef<HTMLAnchorElement>(null)

  const handleMouseEnter = useCallback(() => {
    if (!prefetchEnabled || typeof window === 'undefined') return
    
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current)
    }
    
    prefetchTimeoutRef.current = setTimeout(() => {
      const predictions = getPredictions(window.location.pathname)
      
      for (const prediction of predictions) {
        if (prediction.confidence >= 0.7) {
          prefetchPage(prediction.path)
        }
      }
    }, 150)
  }, [getPredictions, prefetchPage, prefetchEnabled])

  const handleMouseLeave = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current)
      prefetchTimeoutRef.current = null
    }
  }, [])

  return (
    <Link
      ref={linkRef}
      href={href}
      className={className}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Link>
  )
}