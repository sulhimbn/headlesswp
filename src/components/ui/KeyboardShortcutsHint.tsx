'use client'

import { SHORTCUT_HINTS } from '@/lib/hooks/useKeyboardShortcuts'

interface KeyboardShortcutsHintProps {
  className?: string
}

export default function KeyboardShortcutsHint({ className = '' }: KeyboardShortcutsHintProps) {
  return (
    <div 
      className={`fixed bottom-4 right-4 z-40 flex flex-wrap gap-2 p-3 bg-[hsl(var(--color-surface))] border border-[hsl(var(--color-border))] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] opacity-0 hover:opacity-100 transition-opacity duration-[var(--transition-normal)] focus-within:opacity-100 ${className}`}
      role="region"
      aria-label="Keyboard shortcuts"
    >
      <span className="sr-only">Keyboard shortcuts:</span>
      {SHORTCUT_HINTS.map((shortcut) => (
        <div key={shortcut.key} className="flex items-center gap-1.5 text-xs">
          <kbd className="px-1.5 py-0.5 min-w-[1.5rem] text-center font-mono font-semibold bg-[hsl(var(--color-background-dark))] border border-[hsl(var(--color-border))] rounded-[var(--radius-sm)] text-[hsl(var(--color-text-primary))]">
            {shortcut.key}
          </kbd>
          <span className="text-[hsl(var(--color-text-muted))]">{shortcut.description}</span>
        </div>
      ))}
    </div>
  )
}
