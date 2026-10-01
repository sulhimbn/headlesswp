'use client'

import { useKeyboardShortcuts, DEFAULT_SHORTCUTS, KeyboardShortcut } from '@/lib/hooks/useKeyboardShortcuts'
import KeyboardShortcutsHelp from '@/components/ui/KeyboardShortcutsHelp'

const CUSTOM_SHORTCUTS: KeyboardShortcut[] = [
  ...DEFAULT_SHORTCUTS,
]

export default function KeyboardShortcutsProvider() {
  useKeyboardShortcuts({
    shortcuts: CUSTOM_SHORTCUTS,
    enabled: true,
  })

  return <KeyboardShortcutsHelp shortcuts={CUSTOM_SHORTCUTS} />
}
