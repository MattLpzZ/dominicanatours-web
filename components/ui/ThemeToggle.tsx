'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className={`w-8 h-8 rounded-full bg-dt-border/40 ${className}`} />
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      className={`w-8 h-8 rounded-full flex items-center justify-center border border-dt-border hover:border-accent transition-colors ${className}`}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? (
        <svg className="w-4 h-4 text-gold fill-gold" viewBox="0 0 24 24">
          <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-13a1 1 0 0 0 1-1V2a1 1 0 0 0-2 0v1a1 1 0 0 0 1 1zm0 14a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1zM4.22 5.64a1 1 0 0 0 1.42-1.42L4.93 3.51a1 1 0 0 0-1.42 1.42l.71.71zM18.36 18.36a1 1 0 0 0 1.42 1.42l.71-.71a1 1 0 0 0-1.42-1.42l-.71.71zM3 12a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2H3zm17 0a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2h-1zM5.64 18.36l-.71.71a1 1 0 0 0 1.42 1.42l.71-.71a1 1 0 0 0-1.42-1.42zM18.36 5.64l.71-.71a1 1 0 0 0-1.42-1.42l-.71.71a1 1 0 0 0 1.42 1.42z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4 text-dt-text-2 fill-dt-text-2" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
        </svg>
      )}
    </button>
  )
}
