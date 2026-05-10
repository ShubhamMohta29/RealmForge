'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-10 w-32" /> // Placeholder to avoid layout shift
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`
        px-4 py-2 rounded-xl transition-all group relative overflow-hidden flex items-center gap-2 border shadow-lg
        ${isDark 
          ? 'bg-white/5 border-white/10 hover:bg-white/10' 
          : 'bg-black/5 border-black/10 hover:bg-black/10'}
      `}
      aria-label="Toggle Theme"
    >
      <span className="text-amber-highlight text-lg animate-pulse-slow">
        {isDark ? '☀️' : '🌙'}
      </span>
      <span className={`
        text-[10px] uppercase tracking-[0.2em] font-bold transition-colors
        ${isDark ? 'text-white' : 'text-black'}
      `}>
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </span>
      
      {/* Glossy effect */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
        ${isDark ? 'bg-gradient-to-tr from-white/10 to-transparent' : 'bg-gradient-to-tr from-black/5 to-transparent'}
      `} />
    </button>
  )
}
