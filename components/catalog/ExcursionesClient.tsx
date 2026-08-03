'use client'
import { useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { resolveProvince } from '@/lib/provinces'

export interface ApiCategory {
  id: number; name: string; slug: string; icon: string | null; color: string
}
export interface ApiProduct {
  id: number; name: string; slug: string; subtitle: string | null
  price_adult: string; price_child: string; duration: string | null
  difficulty: string; featured: boolean; departure_zone: string | null
  departure_time: string | null; lat: number | null; lng: number | null
  cover_image: string | null; category: ApiCategory
}

const ProvinciasMapa = dynamic(() => import('@/components/map/ProvinciasMapa'), { ssr: false })

export function getCategoryColor(slug: string, index = 0): string {
  const s = slug.toLowerCase()
  if (s.includes('playa') || s.includes('mar'))     return '#0099CC'
  if (s.includes('aventura'))                        return '#22C55E'
  if (s.includes('cultur') || s.includes('histor')) return '#F59E0B'
  if (s.includes('fauna') || s.includes('natural')) return '#10B981'
  if (s.includes('noctur'))                         return '#8B5CF6'
  const palette = ['#0099CC', '#22C55E', '#F59E0B', '#8B5CF6', '#E85D20', '#EC4899']
  return palette[index % palette.length]
}

function getDiff(d: string, t: ReturnType<typeof useTranslations<'catalog'>>) {
  const map: Record<string, { label: string; color: string }> = {
    EASY:     { label: t('diffEasy'),     color: '#22C55E' },
    MODERATE: { label: t('diffModerate'), color: '#F59E0B' },
    ADVANCED: { label: t('diffAdvanced'), color: '#E85D20' },
  }
  return map[d?.toUpperCase()] ?? { label: d ?? '—', color: '#888' }
}

/* ── Sidebar card with hover mask ── */
function SidebarCard({ tour, persons }: { tour: ApiProduct; persons: number }) {
  const t        = useTranslations('catalog')
  const diff     = getDiff(tour.difficulty, t)
  const total    = (Number(tour.price_adult) * persons).toFixed(0)
  const catColor = tour.category?.color ?? getCategoryColor(tour.category?.slug ?? '')

  return (
    <Link href={`/excursiones/${tour.slug}`}
      className="relative flex items-start gap-2.5 px-3 py-2.5 border-b border-dt-border hover:bg-dt-bg-2 transition-colors group overflow-hidden">

      {/* Thumbnail */}
      <div className="relative w-[62px] h-[52px] shrink-0 rounded-lg overflow-hidden bg-dt-bg-2">
        {tour.cover_image
          ? <Image src={tour.cover_image} alt={tour.name} fill
              className="object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="absolute inset-0"
              style={{ background: `linear-gradient(135deg,${catColor}44,${catColor}11)` }} />
        }
        {tour.featured && (
          <span className="absolute top-0.5 left-0.5 text-[7px] font-black text-white px-1 py-px rounded leading-none bg-[#E85D20]">
            TOP
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-dt-text font-semibold text-[12px] leading-snug line-clamp-2 mb-1">
          {tour.name}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {tour.category && (
            <span className="text-[9px] font-bold px-1.5 py-px rounded-full shrink-0"
              style={{ background: catColor + '22', color: catColor }}>
              {tour.category.name}
            </span>
          )}
          {tour.duration && (
            <span className="text-[10px] text-dt-text-3">{tour.duration}</span>
          )}
        </div>
      </div>

      {/* Price + diff */}
      <div className="text-right shrink-0 flex flex-col items-end gap-1">
        <span className="font-bold text-[13px]" style={{ color: '#E85D20' }}>${total}</span>
        <span className="text-[9px] font-bold px-1.5 py-px rounded-full"
          style={{ background: diff.color + '1a', color: diff.color }}>
          {diff.label}
        </span>
      </div>

      {/* Hover mask */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'rgba(10,15,20,0.80)', backdropFilter: 'blur(3px)' }}>
        <span className="flex items-center gap-1.5 text-white text-[12px] font-bold px-4 py-2 rounded-lg pointer-events-none"
          style={{ background: '#E85D20', boxShadow: '0 2px 14px rgba(232,93,32,0.45)' }}>
          Ver excursión
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </span>
      </div>
    </Link>
  )
}

const IconX = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>

/* ── Promo banner ── */
function PromoBanner({ count }: { count: number }) {
  return (
    <div className="shrink-0 border-t border-dt-border" style={{ background: '#0D1117' }}>
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">

        {/* Left: icon + headline */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(232,93,32,0.15)', border: '1px solid rgba(232,93,32,0.25)' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#E85D20" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white text-[13px] font-bold leading-tight">
              Descubre la República Dominicana
            </p>
            <p className="text-white/40 text-[11px] leading-tight mt-0.5">
              Tours auténticos guiados por locales
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-5 flex-1 justify-center">
          {[
            { val: String(count), label: 'tours disponibles' },
            { val: '32',          label: 'provincias' },
            { val: '100%',        label: 'guías locales' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-white text-[16px] font-black leading-none tabular-nums"
                style={{ color: '#E85D20' }}>{s.val}</p>
              <p className="text-white/35 text-[9px] uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/excursiones" scroll={false}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold text-white transition-all ml-auto"
          style={{ background: '#E85D20', boxShadow: '0 0 16px rgba(232,93,32,0.3)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#D04F18'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#E85D20'}>
          Reserva tu excursión
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────── */
export function ExcursionesClient({ tours, categories, currentParams }: {
  tours: ApiProduct[]
  categories: ApiCategory[]
  currentParams: Record<string, string | undefined>
}) {
  const t      = useTranslations('catalog')
  const router = useRouter()

  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [persons, setPersons]                   = useState(1)
  const [search, setSearch]                     = useState(currentParams.q ?? '')
  const [priceIdx, setPriceIdx]                 = useState(0)
  const [mobileCardsOpen, setMobileCardsOpen]   = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const PRICE_OPTS = [
    { label: t('priceAny'),     max: undefined, min: undefined },
    { label: t('priceUpTo50'),  max: '50',      min: undefined },
    { label: t('price50to100'), max: '100',     min: '50' },
    { label: t('priceOver100'), max: undefined, min: '100' },
  ]

  const setParam = useCallback((key: string, val: string | undefined) => {
    const merged = { ...currentParams, [key]: val }
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v)
    router.push(`/excursiones?${sp.toString()}`)
  }, [currentParams, router])

  const clearAll = () => {
    setSearch(''); setPriceIdx(0); setSelectedProvince(null)
    router.push('/excursiones')
  }

  const onSearch = (v: string) => {
    setSearch(v)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setParam('q', v || undefined), 380)
  }

  const visibleTours = useMemo(() => {
    const opt = PRICE_OPTS[priceIdx]
    return tours.filter(tour => {
      const p = Number(tour.price_adult)
      if (opt.min && p < Number(opt.min)) return false
      if (opt.max && p > Number(opt.max)) return false
      return true
    })
  }, [tours, priceIdx])

  const filteredTours = useMemo(() => {
    if (!selectedProvince) return visibleTours
    return visibleTours.filter(t =>
      t.departure_zone && resolveProvince(t.departure_zone) === selectedProvince
    )
  }, [visibleTours, selectedProvince])

  const hasFilters = Object.values(currentParams).some(Boolean) || priceIdx > 0

  /* Cards panel — reused in desktop aside and mobile sheet */
  const cardsPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-3 py-2.5 border-b border-dt-border flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-dt-text leading-tight truncate">
            {selectedProvince ?? 'Todos los destinos'}
          </p>
          <p className="text-[11px] text-dt-text-3 mt-0.5">
            {filteredTours.length} tour{filteredTours.length !== 1 ? 's' : ''}
          </p>
        </div>
        {selectedProvince && (
          <button onClick={() => setSelectedProvince(null)}
            className="text-[11px] font-semibold shrink-0 hover:underline"
            style={{ color: '#E85D20' }}>
            Ver todos
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredTours.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 gap-3 text-center">
            <p className="text-[13px] text-dt-text-3">{t('noToursFilter')}</p>
            <button onClick={clearAll} className="text-[13px] font-bold hover:underline"
              style={{ color: '#E85D20' }}>{t('clearAll')}</button>
          </div>
        ) : (
          filteredTours.map(tour => <SidebarCard key={tour.id} tour={tour} persons={persons} />)
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col w-full bg-dt-bg" style={{ height: 'calc(100dvh - 6.5rem)' }}>

      {/* ── FILTER BAR ── */}
      <div className="shrink-0 border-b border-dt-border bg-dt-bg">
        <div className="max-w-[1200px] mx-auto">

          {/* Row 1 */}
          <div className="flex items-center gap-2 px-4 pt-2.5 pb-2">

            <div className="relative flex-1 max-w-[180px]">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-dt-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder={t('searchPlaceholder')} value={search}
                onChange={e => onSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 rounded-lg text-[12px] focus:outline-none bg-dt-bg-2 text-dt-text placeholder:text-dt-text-3 border border-dt-border focus:border-[#E85D20]/40 transition-colors" />
            </div>

            <div className="flex items-center gap-1 rounded-lg px-2 py-1 bg-dt-bg-2 border border-dt-border">
              <button onClick={() => setPersons(p => Math.max(1, p - 1))}
                className="w-5 h-5 flex items-center justify-center rounded font-bold text-sm transition-colors"
                style={{ color: persons > 1 ? '#E85D20' : 'var(--color-text-3)' }}>−</button>
              <span className="text-dt-text text-[12px] font-semibold w-4 text-center tabular-nums">{persons}</span>
              <button onClick={() => setPersons(p => Math.min(20, p + 1))}
                className="w-5 h-5 flex items-center justify-center rounded font-bold text-sm"
                style={{ color: '#E85D20' }}>+</button>
              <span className="text-[10px] ml-0.5 text-dt-text-3">{t('persons')}</span>
            </div>

            <select value={priceIdx} onChange={e => setPriceIdx(Number(e.target.value))}
              className="py-1.5 px-2 rounded-lg text-[11px] focus:outline-none bg-dt-bg-2 border border-dt-border cursor-pointer"
              style={{ color: priceIdx > 0 ? '#E85D20' : 'var(--color-text-3)' }}>
              {PRICE_OPTS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
            </select>

            <select value={currentParams.sort ?? ''} onChange={e => setParam('sort', e.target.value || undefined)}
              className="py-1.5 px-2 rounded-lg text-[11px] focus:outline-none bg-dt-bg-2 border border-dt-border text-dt-text-3 hidden sm:block cursor-pointer">
              <option value="">{t('sortFeatured')}</option>
              <option value="price-asc">{t('sortPriceAsc')}</option>
              <option value="price-desc">{t('sortPriceDesc')}</option>
            </select>

            {hasFilters && (
              <button onClick={clearAll} className="text-[11px] px-2 py-1.5 text-dt-text-3 hover:text-dt-text transition-colors">
                {t('clearFilters')}
              </button>
            )}

            <div className="flex-1" />

            {selectedProvince && (
              <button onClick={() => setSelectedProvince(null)}
                className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all"
                style={{ color: '#E85D20', borderColor: 'rgba(232,93,32,0.3)', background: 'rgba(232,93,32,0.08)' }}>
                {selectedProvince} <IconX />
              </button>
            )}

            <span className="text-[11px] font-semibold px-2 py-1 rounded-full hidden sm:block bg-dt-bg-2 border border-dt-border text-dt-text-3 tabular-nums">
              {filteredTours.length}
            </span>

            {/* Mobile: open sheet */}
            <button onClick={() => setMobileCardsOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dt-border text-[12px] font-semibold bg-dt-bg-2"
              style={{ color: '#E85D20' }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              {filteredTours.length}
            </button>
          </div>

          {/* Row 2: category pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-2.5">
            <button onClick={() => setParam('cat', undefined)}
              className="shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all"
              style={!currentParams.cat
                ? { background: '#E85D20', color: '#fff' }
                : { background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-3)' }}>
              {t('all')}
            </button>
            {categories.map((c, i) => {
              const active = currentParams.cat === c.slug
              const color  = c.color ?? getCategoryColor(c.slug, i)
              return (
                <button key={c.id} onClick={() => setParam('cat', active ? undefined : c.slug)}
                  className="shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all"
                  style={active
                    ? { background: color + 'cc', color: '#fff' }
                    : { background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-3)' }}>
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── CONTENT: LEFT sidebar + Map ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* LEFT sidebar */}
        <aside className="hidden md:flex flex-col w-[300px] shrink-0 border-r border-dt-border bg-dt-bg overflow-hidden">
          {cardsPanel}
        </aside>

        {/* Map */}
        <div className="flex-1 min-w-0 relative overflow-hidden">
          <ProvinciasMapa
            tours={visibleTours}
            selectedProvince={selectedProvince}
            onProvinceSelect={setSelectedProvince}
          />
          {visibleTours.length === 0 && (
            <div className="absolute inset-0 z-[900] flex items-center justify-center">
              <div className="text-center rounded-2xl px-8 py-6 bg-dt-surface shadow-lg border border-dt-border">
                <p className="font-semibold text-sm mb-3 text-dt-text-3">{t('noToursFilter')}</p>
                <button onClick={clearAll} className="text-sm font-bold" style={{ color: '#E85D20' }}>{t('clearAll')}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── PROMO BANNER ── */}
      <PromoBanner count={tours.length} />

      {/* ── Mobile cards sheet ── */}
      {mobileCardsOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileCardsOpen(false)} />
          <div className="relative bg-dt-bg rounded-t-2xl flex flex-col" style={{ height: '70vh' }}>
            <div className="shrink-0 flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-dt-border" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2.5 pt-1 shrink-0">
              <p className="font-bold text-dt-text">
                {selectedProvince ?? 'Todos los destinos'}
                <span className="ml-2 text-[12px] font-normal text-dt-text-3">{filteredTours.length} tours</span>
              </p>
              <button onClick={() => setMobileCardsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-dt-bg-2 text-dt-text-3">
                <IconX />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto border-t border-dt-border">
              {filteredTours.map(tour => <SidebarCard key={tour.id} tour={tour} persons={persons} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
