'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function HeroSearch() {
  const [q, setQ] = useState('')
  const router = useRouter()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(q.trim() ? `/excursiones?q=${encodeURIComponent(q.trim())}` : '/excursiones')
  }

  return (
    <form onSubmit={submit} className="flex max-w-[560px] mx-auto rounded-full overflow-hidden bg-dt-surface border border-dt-border-2 shadow-[0_2px_8px_rgba(0,0,0,.06),0_8px_24px_rgba(0,0,0,.06)] focus-within:shadow-[0_0_0_4px_rgba(232,93,32,.08),0_4px_20px_rgba(0,0,0,.1)] focus-within:border-accent/30 transition-all duration-200">
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Encuentra lugares y actividades"
        className="flex-1 h-[54px] px-[18px] text-[15px] bg-transparent outline-none text-dt-text placeholder:text-dt-text-3"
      />
      <button
        type="submit"
        className="h-[54px] px-7 bg-accent hover:bg-accent/90 active:scale-95 text-white text-sm font-bold tracking-[0.01em] rounded-r-full transition-all shrink-0"
      >
        Buscar
      </button>
    </form>
  )
}
