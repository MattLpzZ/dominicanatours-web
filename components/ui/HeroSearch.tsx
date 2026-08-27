'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  zones?: string[]
}

const PRICE_OPTS = [
  { label: 'Cualquier precio', value: '' },
  { label: 'Hasta $50',        value: '50' },
  { label: '$50 – $100',       value: '100' },
  { label: 'Más de $100',      value: '999' },
]

export function HeroSearch({ zones = [] }: Props) {
  const [q, setQ]         = useState('')
  const [zone, setZone]   = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const router = useRouter()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const sp = new URLSearchParams()
    if (q.trim())  sp.set('q', q.trim())
    if (zone)      sp.set('zone', zone)
    if (maxPrice && maxPrice !== '999') sp.set('maxPrice', maxPrice)
    if (maxPrice === '999') sp.set('minPrice', '100')
    router.push(sp.toString() ? `/excursiones?${sp.toString()}` : '/excursiones')
  }

  return (
    <form
      onSubmit={submit}
      className="max-w-[680px] mx-auto bg-dt-surface border border-dt-border-2 shadow-[0_2px_8px_rgba(0,0,0,.06),0_8px_24px_rgba(0,0,0,.06)] focus-within:shadow-[0_0_0_4px_rgba(232,93,32,.08),0_4px_20px_rgba(0,0,0,.1)] focus-within:border-accent/30 transition-all duration-200 rounded-2xl overflow-hidden sm:rounded-full"
    >
      {/* Main row */}
      <div className="flex items-stretch">
        {/* Text input */}
        <div className="flex items-center flex-1 min-w-0">
          <svg className="w-4 h-4 text-dt-text-3 ml-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Encuentra lugares y actividades"
            className="h-[54px] px-3 text-[15px] bg-transparent outline-none text-dt-text placeholder:text-dt-text-3 w-full min-w-0"
          />
        </div>

        {/* Divider + zone — hidden on mobile */}
        {zones.length > 0 && (
          <>
            <div className="hidden sm:block w-px bg-dt-border self-stretch my-3" />
            <div className="hidden sm:flex items-center px-3 shrink-0">
              <select
                value={zone}
                onChange={e => setZone(e.target.value)}
                className="h-[54px] text-[14px] bg-transparent outline-none text-dt-text-2 cursor-pointer pr-1"
                style={{ color: zone ? 'var(--color-accent)' : undefined }}
              >
                <option value="">📍 Destino</option>
                {zones.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Divider + price — hidden on mobile */}
        <>
          <div className="hidden sm:block w-px bg-dt-border self-stretch my-3" />
          <div className="hidden sm:flex items-center px-3 shrink-0">
            <select
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="h-[54px] text-[14px] bg-transparent outline-none text-dt-text-2 cursor-pointer pr-1"
              style={{ color: maxPrice ? 'var(--color-accent)' : undefined }}
            >
              {PRICE_OPTS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </>

        {/* Search button */}
        <button
          type="submit"
          className="h-[54px] px-6 sm:px-7 bg-accent hover:bg-accent/90 active:scale-95 text-white text-sm font-bold tracking-[0.01em] sm:rounded-r-full transition-all shrink-0"
        >
          Buscar
        </button>
      </div>

      {/* Mobile filters row */}
      {zones.length > 0 && (
        <div className="sm:hidden flex border-t border-dt-border">
          <div className="flex-1 border-r border-dt-border">
            <select
              value={zone}
              onChange={e => setZone(e.target.value)}
              className="w-full h-10 px-4 text-[13px] bg-transparent outline-none text-dt-text-2"
              style={{ color: zone ? 'var(--color-accent)' : undefined }}
            >
              <option value="">📍 Destino</option>
              {zones.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <select
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="w-full h-10 px-4 text-[13px] bg-transparent outline-none text-dt-text-2"
              style={{ color: maxPrice ? 'var(--color-accent)' : undefined }}
            >
              {PRICE_OPTS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </form>
  )
}
