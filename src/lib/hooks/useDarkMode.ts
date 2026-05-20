'use client'

import { useState, useEffect, useCallback } from 'react'

type DarkMode = 'light' | 'dark' | 'system'

interface UseDarkModeReturn {
  isDark: boolean
  toggleDarkMode: () => void
  setDarkMode: (mode: DarkMode) => void
  mode: DarkMode
}

const DARK_MODE_KEY = 'dark-mode'

function getSystemPreference(): boolean {
  if (typeof window === 'undefined') return false
  if (!window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getStoredMode(): DarkMode {
  if (typeof window === 'undefined') return 'system'
  try {
    if (!localStorage) return 'system'
    const stored = localStorage.getItem(DARK_MODE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch { /* empty */ }
  return 'system'
}

export function useDarkMode(): UseDarkModeReturn {
  const [mode, setModeState] = useState<DarkMode>('system')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = getStoredMode()
    setModeState(stored)
    
    if (stored === 'system') {
      setIsDark(getSystemPreference())
    } else {
      setIsDark(stored === 'dark')
    }
  }, [])

  useEffect(() => {
    if (!window.matchMedia) return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (mode === 'system') {
        setIsDark(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const setDarkMode = useCallback((newMode: DarkMode) => {
    setModeState(newMode)
    try {
      if (localStorage) {
        localStorage.setItem(DARK_MODE_KEY, newMode)
      }
    } catch { /* empty */ }
    
    if (newMode === 'system') {
      setIsDark(getSystemPreference())
    } else {
      setIsDark(newMode === 'dark')
    }
  }, [])

  const toggleDarkMode = useCallback(() => {
    const newMode = isDark ? 'light' : 'dark'
    setDarkMode(newMode)
  }, [isDark, setDarkMode])

  return { isDark, toggleDarkMode, setDarkMode, mode }
}
