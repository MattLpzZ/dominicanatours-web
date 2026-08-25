'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Tour {
  id: number; slug: string; name: string; subtitle?: string | null
  price_adult: number; duration?: string | null; featured: boolean; coming_soon: boolean
  cover_image?: string | null; category?: { name: string; icon?: string | null }
  avg_rating?: number | null; review_count?: number
}

const PAGE_SIZE = 16

function TourMiniCard({ tour }: { tour: Tour }) {
  return (
    <Link
      href={`/excursiones/${tour.slug}`}
      className="group flex flex-col rounded-xl overflow-hidden border border-dt-border bg-dt-surface hover:border-accent/40 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-200"
    >
      <div className="relative overflow-hidden bg-dt-bg-2" style={{ aspectRatio: '16/9' }}>
        {tour.cover_image ? (
          <Image src={tour.cover_image} alt={tour.name} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sky-900/40 to-sky-700/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-sky-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M3.75 3.75h16.5"/>
            </svg>
          </div>
        )}
        {tour.coming_soon && (
          <div className="absolute inset-0 bg-black/50 flex items-end pb-3 justify-center">
            <span className="bg-accent text-white text-[10px] font-bold px-3 py-[3px] rounded-full uppercase tracking-widest">Muy pronto</span>
          </div>
        )}
        {tour.featured && !tour.coming_soon && (
          <span className="absolute top-2.5 left-2.5 bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-[3px] rounded-full">Top rated</span>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4">
        {tour.category && (
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-dt-text-3 mb-1.5">{tour.category.name}</p>
        )}
        <h3 className="text-[14px] font-bold text-dt-text leading-snug mb-3 line-clamp-2 flex-1">{tour.name}</h3>

        <div className="flex items-center justify-between mt-auto">
          {tour.avg_rating && tour.review_count ? (
            <span className="flex items-center gap-1 text-[12px] text-dt-text-2">
              <svg className="w-3 h-3 fill-[#F79009] shrink-0" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span className="font-semibold">{tour.avg_rating}</span>
              <span className="text-dt-text-3">({tour.review_count})</span>
            </span>
          ) : tour.duration ? (
            <span className="text-[12px] text-dt-text-3">{tour.duration}</span>
          ) : <span />}

          {!tour.coming_soon && tour.price_adult > 0 && (
            <div className="text-right">
              <div className="text-[9px] text-dt-text-3 leading-none mb-0.5">Desde</div>
              <div className="text-[14px] font-extrabold text-accent leading-none">
                ${Number(tour.price_adult).toFixed(0)} <span className="text-[10px] font-normal text-dt-text-3">USD</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!tour.coming_soon && (
        <div className="px-4 pb-4">
          <span className="block w-full text-center bg-accent hover:bg-accent/90 text-white text-xs font-bold py-2 rounded-lg transition-colors">
            Reservar
          </span>
        </div>
      )}
    </Link>
  )
}

export function DestinoToursClient({ tours, city }: { tours: Tour[]; city: string }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const categories = useMemo(() => {
    const seen = new Set<string>()
    const cats: string[] = []
    for (const t of tours) {
      if (t.category?.name && !seen.has(t.category.name)) {
        seen.add(t.category.name)
        cats.push(t.category.name)
      }
    }
    return cats
  }, [tours])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return tours.filter(t => {
      const matchSearch = !q || t.name.toLowerCase().includes(q) || (t.subtitle ?? '').toLowerCase().includes(q)
      const matchCat = !activeCategory || t.category?.name === activeCategory
      return matchSearch && matchCat
    })
  }, [tours, search, activeCategory])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function changeFilter(fn: () => void) {
    fn()
    setPage(1)
  }

  if (tours.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-dt-text-3 text-lg mb-4">Próximamente tours en {city}</p>
        <Link href="/excursiones" className="text-accent font-semibold hover:opacity-75 transition-opacity">Ver todos los tours →</Link>
      </div>
    )
  }

  return (
    <div>
      {/* Search */}
      <div className="flex items-center gap-3 bg-dt-surface border border-dt-border rounded-xl px-4 py-3 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/10 transition-all mb-5">
        <svg className="w-[18px] h-[18px] text-dt-text-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => changeFilter(() => setSearch(e.target.value))}
          placeholder={`Buscar tours en ${city}…`}
          className="flex-1 bg-transparent text-dt-text placeholder:text-dt-text-3 text-[15px] outline-none"
        />
        {search && (
          <button onClick={() => changeFilter(() => setSearch(''))} className="text-dt-text-3 hover:text-dt-text transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Category chips */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-5">
          <button
            onClick={() => changeFilter(() => setActiveCategory(null))}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${!activeCategory ? 'bg-accent text-white border-accent' : 'border-dt-border text-dt-text-2 hover:border-accent/40'}`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => changeFilter(() => setActiveCategory(activeCategory === cat ? null : cat))}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${activeCategory === cat ? 'bg-accent text-white border-accent' : 'border-dt-border text-dt-text-2 hover:border-accent/40'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-[12px] text-dt-text-3 mb-4">
        {filtered.length === tours.length
          ? `${tours.length} ${tours.length === 1 ? 'tour' : 'tours'} en ${city}`
          : `${filtered.length} de ${tours.length} tours`}
        {totalPages > 1 && ` · página ${page} de ${totalPages}`}
      </p>

      {/* Grid — 4 cols */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginated.map(tour => <TourMiniCard key={tour.id} tour={tour} />)}
        </div>
      ) : (
        <div className="text-center py-16 border border-dt-border rounded-xl bg-dt-surface">
          <p className="text-dt-text-3 mb-2">Sin resultados para &ldquo;{search}&rdquo;</p>
          <button onClick={() => changeFilter(() => { setSearch(''); setActiveCategory(null) })} className="text-accent text-sm font-semibold hover:opacity-75 transition-opacity">
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dt-border text-[13px] font-semibold text-dt-text-2 hover:border-accent/40 hover:text-dt-text disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Anterior
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
              if (totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
                return (
                  <button
                    key={p}
                    onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className={`w-9 h-9 rounded-lg text-[13px] font-bold transition-all ${p === page ? 'bg-accent text-white' : 'border border-dt-border text-dt-text-2 hover:border-accent/40 hover:text-dt-text'}`}
                  >
                    {p}
                  </button>
                )
              }
              if (p === page - 2 || p === page + 2) {
                return <span key={p} className="text-dt-text-3 text-[13px] px-1">…</span>
              }
              return null
            })}
          </div>

          <button
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dt-border text-[13px] font-semibold text-dt-text-2 hover:border-accent/40 hover:text-dt-text disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Siguiente
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
