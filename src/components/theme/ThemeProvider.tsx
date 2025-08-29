// src/components/theme/ThemeProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'blue' | 'orange' | 'purple'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('blue')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('anajak-theme') as Theme
    if (savedTheme && ['blue', 'orange', 'purple'].includes(savedTheme)) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    
    // Remove existing theme attributes
    root.removeAttribute('data-theme')
    
    // Apply new theme
    if (theme !== 'blue') {
      root.setAttribute('data-theme', theme)
    }
    
    // Save to localStorage
    localStorage.setItem('anajak-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}