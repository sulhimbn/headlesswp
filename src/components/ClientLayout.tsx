'use client'

import { ReactNode } from 'react'
import { KeyboardShortcutsProvider, useKeyboardShortcutsContext } from '@/components/KeyboardShortcutsProvider'

interface KeyboardShortcutsWrapperProps {
  children: ReactNode
}

function KeyboardShortcutsWrapper({ children }: KeyboardShortcutsWrapperProps) {
  useKeyboardShortcutsContext()

  return (
    <>
      {children}
    </>
  )
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <KeyboardShortcutsProvider>
      <KeyboardShortcutsWrapper>
        {children}
      </KeyboardShortcutsWrapper>
    </KeyboardShortcutsProvider>
  )
}
