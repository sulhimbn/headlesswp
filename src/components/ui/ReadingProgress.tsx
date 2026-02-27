'use client'

import { useState, useEffect, useCallback, memo } from 'react'

interface ReadingProgressProps {
  targetId?: string
}

function ReadingProgressComponent({ targetId = 'article-content' }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0)

  const calculateProgress = useCallback(() => {
    const element = document.getElementById(targetId)
    if (!element) return

    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight - windowHeight

    if (documentHeight <= 0) return

    const scrolled = window.scrollY
    const percentage = Math.min(100, Math.max(0, (scrolled / documentHeight) * 100))

    setProgress(percentage)
  }, [targetId])

  useEffect(() => {
    calculateProgress()

    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculateProgress()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', calculateProgress, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', calculateProgress)
    }
  }, [calculateProgress])

  if (progress <= 0) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Kemajuan membaca"
    >
      <div
        className="h-full bg-[hsl(var(--color-primary))] transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export default memo(ReadingProgressComponent)
