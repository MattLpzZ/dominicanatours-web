'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const PROMOS = [
  {
    bg: 'bg-accent',
    text: 'text-white',
    label: '🔥 OFERTA SEMANA',
    title: '15% OFF en Catamaran Isla Saona',
    sub: 'Solo hasta el domingo · Cupos limitados',
    code: 'SAONA15',
    cta: 'Reservar ahora',
    href: '/excursiones/isla-saona-catamaran',
  },
  {
    bg: 'bg-dt-dark',
    text: 'text-white',
    label: '👨‍👩‍👧‍👦 GRUPOS FAMILIARES',
    title: 'Tour familiar desde $69 USD',
    sub: 'Grupos de 4+ personas · Niños menores de 5 gratis',
    code: null,
    cta: 'Ver excursiones',
    href: '/excursiones',
  },
  {
    bg: 'bg-accent-2',
    text: 'text-white',
    label: '📸 EXPERIENCIA PREMIUM',
    title: 'Fotógrafo profesional incluido',
    sub: 'En tours seleccionados · Sin costo adicional',
    code: null,
    cta: 'Ver tours premium',
    href: '/excursiones?sort=price-desc',
  },
]

export function PromoBanner() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setIdx(i => (i + 1) % PROMOS.length), 4500)
    return () => clearInterval(t)
  }, [paused])

  const p = PROMOS[idx]

  return (
    <div
      className={`relative ${p.bg} transition-colors duration-500`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-xs font-bold uppercase tracking-widest ${p.text} opacity-70`}>{p.label}</span>
          <span className={`text-sm font-bold ${p.text}`}>{p.title}</span>
          <span className={`text-xs ${p.text} opacity-70 hidden sm:inline`}>{p.sub}</span>
          {p.code && (
            <span className="bg-white/20 text-white text-xs font-mono font-bold px-2 py-0.5 rounded">
              {p.code}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={p.href}
            className={`text-xs font-bold px-4 py-1.5 rounded-full border-2 border-white/40 text-white hover:border-white transition-colors whitespace-nowrap`}
          >
            {p.cta} →
          </Link>
          <div className="flex gap-1.5">
            {PROMOS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
