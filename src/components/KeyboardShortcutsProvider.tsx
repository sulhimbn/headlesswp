'use client'

import { useKeyboardShortcuts, DEFAULT_SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts'

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode
}

export default function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  useKeyboardShortcuts({ enabled: true, shortcuts: DEFAULT_SHORTCUTS })

  return (
    <>
      {children}
      <KeyboardShortcutsHelp />
    </>
  )
}

function KeyboardShortcutsHelp() {
  return (
    <dialog
      id="keyboard-shortcuts-help"
      className="backdrop:bg-black/50 bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] p-6 max-w-md w-full shadow-[var(--shadow-xl)]"
    >
      <h2 className="text-xl font-semibold text-[hsl(var(--color-text-primary))] mb-4">
        Pintasan Keyboard
      </h2>
      <ul className="space-y-2 text-[hsl(var(--color-text-secondary))]">
        <li className="flex justify-between">
          <span>Go to home</span>
          <kbd className="px-2 py-1 bg-[hsl(var(--color-secondary))] rounded text-sm font-mono">h</kbd>
        </li>
        <li className="flex justify-between">
          <span>Go to news</span>
          <kbd className="px-2 py-1 bg-[hsl(var(--color-secondary))] rounded text-sm font-mono">b</kbd>
        </li>
        <li className="flex justify-between">
          <span>Focus search</span>
          <kbd className="px-2 py-1 bg-[hsl(var(--color-secondary))] rounded text-sm font-mono">/</kbd>
        </li>
        <li className="flex justify-between">
          <span>Toggle dark mode</span>
          <kbd className="px-2 py-1 bg-[hsl(var(--color-secondary))] rounded text-sm font-mono">Alt+d</kbd>
        </li>
        <li className="flex justify-between">
          <span>Show this help</span>
          <kbd className="px-2 py-1 bg-[hsl(var(--color-secondary))] rounded text-sm font-mono">?</kbd>
        </li>
        <li className="flex justify-between">
          <span>Close dialog</span>
          <kbd className="px-2 py-1 bg-[hsl(var(--color-secondary))] rounded text-sm font-mono">Esc</kbd>
        </li>
      </ul>
      <form method="dialog" className="mt-4">
        <button
          className="px-4 py-2 bg-[hsl(var(--color-primary))] text-white rounded-[var(--radius-md)] hover:bg-[hsl(var(--color-primary-dark))] transition-colors"
        >
          Tutup
        </button>
      </form>
    </dialog>
  )
}