'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcutsConfig {
  onNextArticle?: () => void
  onPreviousArticle?: () => void
  onToggleSearch: () => void
  onCloseModal: () => void
  onToggleDarkMode: () => void
}

interface ShortcutHint {
  key: string
  description: string
}

export const SHORTCUT_HINTS: ShortcutHint[] = [
  { key: 'j', description: 'Next article' },
  { key: 'k', description: 'Previous article' },
  { key: '/', description: 'Search' },
  { key: 'd', description: 'Dark mode' },
  { key: 'Esc', description: 'Close' },
]

export function useKeyboardShortcuts({
  onNextArticle,
  onPreviousArticle,
  onToggleSearch,
  onCloseModal,
  onToggleDarkMode,
}: KeyboardShortcutsConfig) {
  const router = useRouter()
  const containerRef = useRef<HTMLElement | null>(null)
  const shortcutsEnabledRef = useRef(true)

  const setContainer = useCallback((element: HTMLElement | null) => {
    containerRef.current = element
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!shortcutsEnabledRef.current) return

      const target = e.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable

      if (e.key === '/' && !isInputField) {
        e.preventDefault()
        onToggleSearch()
        return
      }

      if (e.key === 'd' && !isInputField) {
        e.preventDefault()
        onToggleDarkMode()
        return
      }

      if (e.key === 'j' && !isInputField) {
        e.preventDefault()
        if (onNextArticle) {
          onNextArticle()
        } else {
          router.push('/berita?page=next')
        }
        return
      }

      if (e.key === 'k' && !isInputField) {
        e.preventDefault()
        if (onPreviousArticle) {
          onPreviousArticle()
        } else {
          router.push('/berita?page=prev')
        }
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseModal()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNextArticle, onPreviousArticle, onToggleSearch, onCloseModal, onToggleDarkMode, router])

  const disableShortcuts = useCallback(() => {
    shortcutsEnabledRef.current = false
  }, [])

  const enableShortcuts = useCallback(() => {
    shortcutsEnabledRef.current = true
  }, [])

  return {
    setContainer,
    disableShortcuts,
    enableShortcuts,
  }
}
