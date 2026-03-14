'use client'

import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  isGlobal?: boolean
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  shortcuts: KeyboardShortcut[]
  ignoreTags?: string[]
}

const DEFAULT_IGNORE_TAGS = ['INPUT', 'TEXTAREA', 'SELECT']

export function useKeyboardShortcuts({
  enabled = true,
  shortcuts,
  ignoreTags = DEFAULT_IGNORE_TAGS,
}: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const target = event.target as HTMLElement
      const tagName = target.tagName

      if (ignoreTags.includes(tagName)) {
        return
      }

      const activeElement = document.activeElement
      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('contenteditable') === 'true'

      if (isInputFocused && event.key !== 'Escape') {
        return
      }

      const matchingShortcut = shortcutsRef.current.find((shortcut) => {
        if (shortcut.key === '/') {
          return event.key === '/' && !isInputFocused
        }
        if (shortcut.key === '?') {
          return event.key === '?'
        }
        if (shortcut.key === 'j') {
          return event.key === 'j' || event.key === 'J'
        }
        if (shortcut.key === 'k') {
          return event.key === 'k' || event.key === 'K'
        }
        if (shortcut.key === 'Escape') {
          return event.key === 'Escape'
        }
        return false
      })

      if (matchingShortcut) {
        event.preventDefault()
        matchingShortcut.action()
      }
    },
    [enabled, ignoreTags]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

export function getShortcutKeyDisplay(key: string): string {
  switch (key) {
    case 'Escape':
      return 'Esc'
    case ' ':
      return 'Space'
    default:
      return key.toUpperCase()
  }
}
