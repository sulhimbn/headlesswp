'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useKeyboardShortcuts, type KeyboardShortcut } from '@/lib/hooks/useKeyboardShortcuts'
import KeyboardShortcutsHelp from '@/components/ui/KeyboardShortcutsHelp'

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode
  postSelector?: string
}

export default function KeyboardShortcutsProvider({
  children,
  postSelector = 'article',
}: KeyboardShortcutsProviderProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const currentPostIndexRef = useRef<number>(-1)

  const openHelp = useCallback(() => setIsHelpOpen(true), [])
  const closeHelp = useCallback(() => setIsHelpOpen(false), [])

  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector<HTMLInputElement>('#search-input')
    if (searchInput) {
      searchInput.focus()
    } else {
      const searchButton = document.querySelector<HTMLButtonElement>('[aria-controls="desktop-search"], [aria-controls="mobile-search"]')
      if (searchButton) {
        (searchButton as HTMLButtonElement).click()
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>('#search-input')
          input?.focus()
        }, 100)
      }
    }
  }, [])

  const navigateToNextPost = useCallback(() => {
    const posts = document.querySelectorAll<HTMLElement>(postSelector)
    if (posts.length === 0) return

    const nextIndex = currentPostIndexRef.current + 1
    if (nextIndex < posts.length) {
      currentPostIndexRef.current = nextIndex
      posts[nextIndex]?.focus()
    }
  }, [postSelector])

  const navigateToPreviousPost = useCallback(() => {
    const posts = document.querySelectorAll<HTMLElement>(postSelector)
    if (posts.length === 0) return

    const prevIndex = currentPostIndexRef.current - 1
    if (prevIndex >= 0) {
      currentPostIndexRef.current = prevIndex
      posts[prevIndex]?.focus()
    } else {
      currentPostIndexRef.current = -1
    }
  }, [postSelector])

  const closeModalsAndMenus = useCallback(() => {
    setIsHelpOpen(false)
    
    const closeButtons = document.querySelectorAll('button[aria-expanded="true"]')
    closeButtons.forEach((button) => {
      if (button.getAttribute('aria-controls')?.includes('search')) {
        (button as HTMLButtonElement).click()
      }
    })

    const menuButton = document.querySelector<HTMLButtonElement>('[aria-controls="mobile-menu"]')
    if (menuButton?.getAttribute('aria-expanded') === 'true') {
      menuButton.click()
    }
  }, [])

  const shortcuts = useMemo<KeyboardShortcut[]>(
    () => [
      {
        key: '/',
        description: 'Focus search',
        action: focusSearch,
      },
      {
        key: '?',
        description: 'Show help',
        action: openHelp,
      },
      {
        key: 'j',
        description: 'Next post',
        action: navigateToNextPost,
      },
      {
        key: 'k',
        description: 'Previous post',
        action: navigateToPreviousPost,
      },
      {
        key: 'Escape',
        description: 'Close modals/menus',
        action: closeModalsAndMenus,
      },
    ],
    [focusSearch, openHelp, navigateToNextPost, navigateToPreviousPost, closeModalsAndMenus]
  )

  useKeyboardShortcuts({
    enabled: true,
    shortcuts,
  })

  useEffect(() => {
    const handlePostFocus = () => {
      const posts = document.querySelectorAll<HTMLElement>(postSelector)
      const focusedElement = document.activeElement
      if (focusedElement && focusedElement.matches(postSelector)) {
        Array.from(posts).forEach((post, index) => {
          if (post === focusedElement) {
            currentPostIndexRef.current = index
          }
        })
      }
    }

    document.addEventListener('focusin', handlePostFocus)
    return () => {
      document.removeEventListener('focusin', handlePostFocus)
    }
  }, [postSelector])

  return (
    <>
      {children}
      <KeyboardShortcutsHelp isOpen={isHelpOpen} onClose={closeHelp} />
    </>
  )
}
