'use client'

import { ReactNode } from 'react'
import KeyboardShortcutsProvider from './KeyboardShortcutsProvider'

interface ClientProvidersProps {
  children: ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <KeyboardShortcutsProvider>
      {children}
    </KeyboardShortcutsProvider>
  )
}
