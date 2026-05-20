'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts'
import KeyboardShortcutsHelp from '@/components/ui/KeyboardShortcutsHelp'
import type { KeyboardShortcut, KeyboardShortcutsConfig } from '@/lib/constants/keyboardShortcuts'

interface KeyboardShortcutsContextValue {
  isHelpOpen: boolean
  selectedIndex: number
  setPostCount: (count: number) => void
  closeHelp: () => void
  toggleHelp: () => void
  shortcuts: KeyboardShortcut[]
  isEnabled: boolean
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null)

export function useKeyboardShortcutsContext() {
  const context = useContext(KeyboardShortcutsContext)
  if (!context) {
    throw new Error('useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider')
  }
  return context
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode
  config?: Partial<KeyboardShortcutsConfig>
}

export function KeyboardShortcutsProvider({ children, config }: KeyboardShortcutsProviderProps) {
  const {
    isHelpOpen,
    selectedIndex,
    setPostCount,
    closeHelp,
    toggleHelp,
    shortcuts,
    isEnabled,
  } = useKeyboardShortcuts({ config })

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        isHelpOpen,
        selectedIndex,
        setPostCount,
        closeHelp,
        toggleHelp,
        shortcuts,
        isEnabled,
      }}
    >
      {children}
      <KeyboardShortcutsHelp
        isOpen={isHelpOpen}
        onClose={closeHelp}
        shortcuts={shortcuts}
      />
    </KeyboardShortcutsContext.Provider>
  )
}
