'use client'

import { useEffect, useCallback, useRef } from 'react'

interface KeyboardShortcutsOptions {
  onOpenSearch?: () => void
  onOpenHelp?: () => void
  onClose?: () => void
  searchInputRef?: React.RefObject<HTMLInputElement | null>
  enabled?: boolean
}

export function useKeyboardShortcuts({
  onOpenSearch,
  onOpenHelp,
  onClose,
  searchInputRef,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const onCloseRef = useRef(onClose)
  const onOpenHelpRef = useRef(onOpenHelp)
  const onOpenSearchRef = useRef(onOpenSearch)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    onOpenHelpRef.current = onOpenHelp
  }, [onOpenHelp])

  useEffect(() => {
    onOpenSearchRef.current = onOpenSearch
  }, [onOpenSearch])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    const target = event.target as HTMLElement
    const isInputFocused = 
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable

    if (event.key === '/' && !isInputFocused) {
      event.preventDefault()
      if (searchInputRef?.current) {
        searchInputRef.current.focus()
      } else {
        onOpenSearchRef.current?.()
      }
      return
    }

    if (event.key === '?' && !isInputFocused) {
      event.preventDefault()
      onOpenHelpRef.current?.()
      return
    }

    if (event.key === 'Escape') {
      onCloseRef.current?.()
      return
    }
  }, [enabled, searchInputRef])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}
