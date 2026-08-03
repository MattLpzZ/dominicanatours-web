'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function HeroSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dest = q.trim()
      ? `/excursiones?q=${encodeURIComponent(q.trim())}`
      : '/excursiones'
    router.push(dest)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg mx-auto w-full">
      <div className="relative flex-1">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="6"/>
          <path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="¿Qué excursión buscas?"
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 text-white placeholder:text-white/45 text-base focus:outline-none focus:border-white/50 focus:bg-white/18 transition-all"
        />
      </div>
      <button
        type="submit"
        className="bg-accent text-white font-bold px-6 py-4 rounded-2xl hover:bg-accent/90 active:scale-95 transition-all whitespace-nowrap text-sm"
      >
        Buscar
      </button>
    </form>
  )
}
