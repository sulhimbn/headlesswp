'use client'

import { useState, useCallback } from 'react'
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts'
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal'

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode
  searchInputRef?: React.RefObject<HTMLInputElement | null>
}

export default function KeyboardShortcutsProvider({
  children,
  searchInputRef,
}: KeyboardShortcutsProviderProps) {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)

  const handleOpenHelp = useCallback(() => {
    setIsHelpModalOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsHelpModalOpen(false)
  }, [])

  useKeyboardShortcuts({
    onOpenHelp: handleOpenHelp,
    onClose: handleClose,
    searchInputRef,
    enabled: true,
  })

  return (
    <>
      {children}
      <KeyboardShortcutsModal
        isOpen={isHelpModalOpen}
        onClose={handleClose}
      />
    </>
  )
}
