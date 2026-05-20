'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface KeyboardShortcutHandlers {
  onShowHelp?: () => void
  onHideHelp?: () => void
  onFocusSearch?: () => void
  onCloseModal?: () => void
  onNextItem?: () => void
  onPrevItem?: () => void
  onSelectItem?: () => void
}

interface UseKeyboardShortcutsOptions {
  handlers?: KeyboardShortcutHandlers
  enabled?: boolean
}

function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false
  const tagName = element.tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    element.isContentEditable
  )
}

export function useKeyboardShortcuts({
  handlers = {},
  enabled = true
}: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const helpModalOpenRef = useRef(false)
  const searchFocusedRef = useRef(false)

  const {
    onShowHelp,
    onHideHelp,
    onFocusSearch,
    onCloseModal,
    onNextItem,
    onPrevItem,
    onSelectItem
  } = handlers

  const goToHome = useCallback(() => {
    router.push('/')
  }, [router])

  const goToBerita = useCallback(() => {
    router.push('/berita')
  }, [router])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputElement(e.target)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement)?.blur()
          onCloseModal?.()
        }
        return
      }

      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        if (helpModalOpenRef.current) {
          onHideHelp?.()
        } else {
          onShowHelp?.()
        }
        helpModalOpenRef.current = !helpModalOpenRef.current
        return
      }

      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        onFocusSearch?.()
        searchFocusedRef.current = true
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseModal?.()
        helpModalOpenRef.current = false
        onHideHelp?.()
        return
      }

      if (e.key === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        goToHome()
        return
      }

      if (e.key === 'b' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        goToBerita()
        return
      }

      if (e.key === 'j' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        onNextItem?.()
        return
      }

      if (e.key === 'k' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        onPrevItem?.()
        return
      }

      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        onSelectItem?.()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    enabled,
    router,
    pathname,
    onShowHelp,
    onHideHelp,
    onFocusSearch,
    onCloseModal,
    onNextItem,
    onPrevItem,
    onSelectItem,
    goToHome,
    goToBerita
  ])

  return {
    helpModalOpenRef,
    searchFocusedRef
  }
}