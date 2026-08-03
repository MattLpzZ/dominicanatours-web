'use client'
import { useState } from 'react'
import Link from 'next/link'
import { TourDeleteBtn } from './TourDeleteBtn'

type Tour = {
  id: number; name: string; slug: string; active: boolean; featured: boolean
  priceAdult: string; duration: string; difficulty: string; departureZone: string
  category: { name: string }
  _count: { reservations: number; dates: number }
}

const DIFF_LABEL: Record<string, string> = { EASY: 'Fácil', MODERATE: 'Moderado', HARD: 'Avanzado' }
const DIFF_STYLE: Record<string, string> = {
  EASY: 'bg-emerald-500/15 text-emerald-400',
  MODERATE: 'bg-amber-500/15 text-amber-400',
  HARD: 'bg-red-500/15 text-red-400',
}

export default function ToursClient({ tours }: { tours: Tour[] }) {
  const [view, setView] = useState<'lista' | 'ciudad'>('lista')
  const [search, setSearch] = useState('')

  const filtered = search
    ? tours.filter(t => `${t.name} ${t.departureZone} ${t.category.name}`.toLowerCase().includes(search.toLowerCase()))
    : tours

  // Group by departureZone for city view
  const byZone: Record<string, Tour[]> = {}
  tours.forEach(t => {
    const z = t.departureZone || 'Sin zona'
    if (!byZone[z]) byZone[z] = []
    byZone[z].push(t)
  })
  const zones = Object.entries(byZone).sort((a, b) => b[1].length - a[1].length)

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dt-text-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" placeholder="Buscar tour o zona..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 border border-dt-border rounded-lg bg-dt-bg text-dt-text text-[13px] focus:outline-none focus:border-accent w-full placeholder:text-dt-text-3" />
        </div>

        <div className="ml-auto flex items-center gap-1 bg-dt-bg-2 border border-dt-border rounded-lg p-0.5">
          <button onClick={() => setView('lista')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${view === 'lista' ? 'bg-accent text-white' : 'text-dt-text-3 hover:text-dt-text'}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            Lista
          </button>
          <button onClick={() => setView('ciudad')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${view === 'ciudad' ? 'bg-accent text-white' : 'text-dt-text-3 hover:text-dt-text'}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Por Ciudad
          </button>
        </div>
      </div>

      {/* LISTA VIEW */}
      {view === 'lista' && (
        <div className="bg-dt-surface rounded-xl border border-dt-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-dt-text-3 text-sm">
              {search ? 'Sin resultados' : 'No hay excursiones registradas aún'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dt-border bg-dt-bg-2 text-dt-text-3 text-left text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 font-medium">Tour</th>
                    <th className="px-4 py-3 font-medium">Categoría</th>
                    <th className="px-4 py-3 font-medium">Zona</th>
                    <th className="px-4 py-3 font-medium">Precio</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Dificultad</th>
                    <th className="px-4 py-3 font-medium text-center">Reservas</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dt-border">
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-dt-bg-2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-dt-text">{t.name}</div>
                        <div className="text-xs text-dt-text-3 font-mono">{t.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-dt-text-2 text-[13px]">{t.category.name}</td>
                      <td className="px-4 py-3">
                        {t.departureZone ? (
                          <span className="text-[12px] text-dt-text-2">{t.departureZone}</span>
                        ) : (
                          <span className="text-[11px] text-dt-text-3">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-dt-text">${Number(t.priceAdult).toFixed(0)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${DIFF_STYLE[t.difficulty] ?? 'bg-dt-bg-2 text-dt-text-3'}`}>
                          {DIFF_LABEL[t.difficulty] ?? t.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${t._count.reservations > 0 ? 'text-accent' : 'text-dt-text-3'}`}>{t._count.reservations}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-dt-text-3'}`}>
                            {t.active ? 'Activo' : 'Inactivo'}
                          </span>
                          {t.featured && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400">Destacado</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/tours/${t.id}`} className="px-3 py-1 rounded border border-dt-border text-dt-text-2 hover:bg-dt-bg-2 text-xs transition-colors whitespace-nowrap">
                            Editar
                          </Link>
                          {t._count.reservations === 0 && (
                            <TourDeleteBtn tourId={t.id} tourName={t.name} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* POR CIUDAD VIEW */}
      {view === 'ciudad' && (
        <div className="space-y-4">
          {/* Zone summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {zones.map(([zone, ztours]) => {
              const active = ztours.filter(t => t.active).length
              const totalRes = ztours.reduce((s, t) => s + t._count.reservations, 0)
              return (
                <button key={zone} onClick={() => setSearch(zone === 'Sin zona' ? '' : zone)}
                  className="bg-dt-surface border border-dt-border rounded-xl p-4 text-left hover:border-accent/40 transition-colors group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">{active} activo{active !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="font-semibold text-dt-text text-[13px] leading-tight">{zone}</p>
                  <p className="text-[11px] text-dt-text-3 mt-1">{ztours.length} tour{ztours.length !== 1 ? 's' : ''} · {totalRes} reservas</p>
                </button>
              )
            })}
          </div>

          {/* Tours by zone */}
          {zones.map(([zone, ztours]) => {
            const zFiltered = search
              ? ztours.filter(t => `${t.name} ${t.departureZone} ${t.category.name}`.toLowerCase().includes(search.toLowerCase()))
              : ztours
            if (zFiltered.length === 0) return null
            const totalRes = zFiltered.reduce((s, t) => s + t._count.reservations, 0)
            return (
              <div key={zone} className="bg-dt-surface rounded-xl border border-dt-border overflow-hidden">
                {/* Zone header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-dt-border bg-dt-bg-2">
                  <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span className="font-bold text-dt-text text-[14px]">{zone}</span>
                  <span className="text-[11px] text-dt-text-3">{zFiltered.length} tour{zFiltered.length !== 1 ? 's' : ''}</span>
                  <span className="ml-auto text-[12px] font-semibold text-accent tabular-nums">{totalRes} reservas</span>
                </div>

                {/* Tours table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-dt-border">
                      {zFiltered.map(t => (
                        <tr key={t.id} className="hover:bg-dt-bg-2 transition-colors">
                          <td className="px-4 py-3 w-full">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${t.active ? 'bg-emerald-400' : 'bg-dt-text-3/40'}`} />
                              <div>
                                <p className="font-medium text-dt-text text-[13px]">{t.name}</p>
                                <p className="text-[11px] text-dt-text-3">{t.category.name} · {t.duration}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${DIFF_STYLE[t.difficulty] ?? ''}`}>
                              {DIFF_LABEL[t.difficulty] ?? t.difficulty}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-dt-text whitespace-nowrap">${Number(t.priceAdult).toFixed(0)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`font-bold text-[13px] tabular-nums ${t._count.reservations > 0 ? 'text-accent' : 'text-dt-text-3'}`}>
                              {t._count.reservations} res.
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <Link href={`/admin/tours/${t.id}`}
                                className="px-2.5 py-1 rounded border border-dt-border text-dt-text-2 hover:bg-dt-bg-2 text-[11px] transition-colors">
                                Editar
                              </Link>
                              {t._count.reservations === 0 && (
                                <TourDeleteBtn tourId={t.id} tourName={t.name} />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
