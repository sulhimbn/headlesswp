'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView } from '@/lib/utils/analytics'

export default function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    trackPageView(pathname, window.document.referrer)
  }, [pathname])

  return null
}