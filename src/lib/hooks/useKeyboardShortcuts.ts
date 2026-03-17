'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: () => void
  description: string
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  shortcuts: KeyboardShortcut[]
}

export function useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey)
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const altMatch = shortcut.alt ? event.altKey : !event.altKey

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault()
          shortcut.action()
          break
        }
      }
    },
    [enabled, shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'h',
    action: () => window.location.href = '/',
    description: 'Go to home',
  },
  {
    key: 'b',
    action: () => window.location.href = '/berita',
    description: 'Go to news',
  },
  {
    key: '/',
    action: () => {
      const searchInput = document.querySelector('input[type="search"], input[name="search"]') as HTMLInputElement
      searchInput?.focus()
    },
    description: 'Focus search',
  },
  {
    key: '?',
    action: () => {
      const helpDialog = document.getElementById('keyboard-shortcuts-help') as HTMLDialogElement | null
      if (helpDialog) {
        helpDialog.showModal()
      }
    },
    description: 'Show keyboard shortcuts help',
  },
  {
    key: 'Escape',
    action: () => {
      const helpDialog = document.getElementById('keyboard-shortcuts-help') as HTMLDialogElement
      if (helpDialog?.open) {
        helpDialog.close()
      }
    },
    description: 'Close help dialog',
  },
  {
    key: 'd',
    alt: true,
    action: () => {
      const root = document.documentElement
      const isDark = root.classList.contains('dark')
      root.classList.toggle('dark', !isDark)
      localStorage.setItem('theme', isDark ? 'light' : 'dark')
    },
    description: 'Toggle dark mode',
  },
]