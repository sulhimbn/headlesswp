'use client'

import { useState, useCallback, memo } from 'react'
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp'

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode
  searchInputRef?: React.RefObject<HTMLInputElement | null>
}

function KeyboardShortcutsProviderComponent({
  children,
  searchInputRef
}: KeyboardShortcutsProviderProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const handleShowHelp = useCallback(() => {
    setIsHelpOpen(true)
  }, [])

  const handleHideHelp = useCallback(() => {
    setIsHelpOpen(false)
  }, [])

  const handleFocusSearch = useCallback(() => {
    if (searchInputRef?.current) {
      searchInputRef.current.focus()
    }
  }, [searchInputRef])

  const handleCloseModal = useCallback(() => {
    setIsHelpOpen(false)
  }, [])

  useKeyboardShortcuts({
    handlers: {
      onShowHelp: handleShowHelp,
      onHideHelp: handleHideHelp,
      onFocusSearch: handleFocusSearch,
      onCloseModal: handleCloseModal
    }
  })

  return (
    <>
      {children}
      <KeyboardShortcutsHelp
        isOpen={isHelpOpen}
        onClose={handleHideHelp}
      />
    </>
  )
}

export default memo(KeyboardShortcutsProviderComponent)