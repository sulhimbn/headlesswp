'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyboardShortcut, KeyboardShortcutsConfig, DEFAULT_CONFIG } from '@/lib/constants/keyboardShortcuts'

interface UseKeyboardShortcutsOptions {
  config?: Partial<KeyboardShortcutsConfig>
  onNavigate?: (direction: 'next' | 'prev') => void
  onOpenPost?: () => void
  onFocusSearch?: () => void
  onShowHelp?: () => void
  onClose?: () => void
}

export function useKeyboardShortcuts({
  config: userConfig,
  onNavigate,
  onOpenPost,
  onFocusSearch,
  onShowHelp,
  onClose,
}: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter()
  const config: KeyboardShortcutsConfig = { ...DEFAULT_CONFIG, ...userConfig }
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const postCountRef = useRef(0)
  const lastKeyTimeRef = useRef(0)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!config.enabled) return

    const target = e.target as HTMLElement
    const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
    const shortcut = config.shortcuts.find(s => s.key.toLowerCase() === e.key.toLowerCase())

    if (e.key === '?' && !isInputFocused) {
      e.preventDefault()
      setIsHelpOpen(prev => !prev)
      onShowHelp?.()
      return
    }

    if (e.key === '/' && !isInputFocused) {
      e.preventDefault()
      onFocusSearch?.()
      return
    }

    if (e.key === 'Escape') {
      if (isHelpOpen) {
        setIsHelpOpen(false)
        return
      }
      onClose?.()
      return
    }

    if (isInputFocused && !shortcut?.requireInputFocus) return

    const now = Date.now()
    if (now - lastKeyTimeRef.current < 50) return
    lastKeyTimeRef.current = now

    switch (e.key.toLowerCase()) {
      case 'j':
        e.preventDefault()
        setSelectedIndex(prev => {
          const newIndex = prev < postCountRef.current - 1 ? prev + 1 : 0
          onNavigate?.('next')
          return newIndex
        })
        break
      case 'k':
        e.preventDefault()
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : postCountRef.current - 1
          onNavigate?.('prev')
          return newIndex
        })
        break
      case 'Enter':
        if (selectedIndex >= 0 && !isInputFocused) {
          e.preventDefault()
          onOpenPost?.()
        }
        break
      case 'h':
        e.preventDefault()
        router.push('/')
        break
      case 'b':
        e.preventDefault()
        router.push('/berita')
        break
    }
  }, [config, config.enabled, config.shortcuts, onNavigate, onOpenPost, onFocusSearch, onShowHelp, onClose, router])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const setPostCount = useCallback((count: number) => {
    postCountRef.current = count
    if (selectedIndex >= count) {
      setSelectedIndex(count > 0 ? 0 : -1)
    }
  }, [selectedIndex])

  const closeHelp = useCallback(() => setIsHelpOpen(false), [])
  const toggleHelp = useCallback(() => setIsHelpOpen(prev => !prev), [])

  return {
    isHelpOpen,
    selectedIndex,
    setPostCount,
    closeHelp,
    toggleHelp,
    shortcuts: config.shortcuts,
    isEnabled: config.enabled,
  }
}
