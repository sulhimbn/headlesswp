'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  handler: () => void
  description: string
  category: 'navigation' | 'search' | 'accessibility'
}

interface UseKeyboardShortcutsOptions {
  shortcuts?: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({
  shortcuts = [],
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    const target = event.target as HTMLElement
    const isInputFocused = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable

    for (const shortcut of shortcuts) {
      if (event.key === shortcut.key) {
        if (isInputFocused && shortcut.category !== 'search') {
          continue
        }
        
        event.preventDefault()
        shortcut.handler()
        break
      }
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: '/',
    handler: () => {
      const searchInput = document.querySelector('#search-input') as HTMLInputElement
      searchInput?.focus()
    },
    description: 'Focus search bar',
    category: 'search',
  },
  {
    key: '?',
    handler: () => {
      const event = new CustomEvent('toggleKeyboardHelp')
      window.dispatchEvent(event)
    },
    description: 'Show keyboard shortcuts',
    category: 'accessibility',
  },
]

export type { KeyboardShortcut }
