'use client'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { TourCard } from '@/components/catalog/TourCard'

export interface ApiCategory {
  id: number; name: string; slug: string; icon: string | null; color: string; cover_image?: string | null
}
export interface ApiProduct {
  id: number; name: string; slug: string; subtitle: string | null
  price_adult: string; price_child: string; duration: string | null
  difficulty: string; featured: boolean; coming_soon?: boolean; departure_zone: string | null
  departure_time: string | null; lat: number | null; lng: number | null
  cover_image: string | null; category: ApiCategory; avg_rating?: number | null; review_count?: number
}

export function getCategoryColor(slug: string, index = 0): string {
  const s = slug.toLowerCase()
  if (s.includes('playa') || s.includes('mar'))       return '#0099CC'
  if (s.includes('aventura'))                          return '#22C55E'
  if (s.includes('cultur') || s.includes('histor'))   return '#F59E0B'
  if (s.includes('fauna') || s.includes('natural'))   return '#10B981'
  if (s.includes('noctur'))                            return '#8B5CF6'
  const palette = ['#0099CC', '#22C55E', '#F59E0B', '#8B5CF6', '#1d70b7', '#EC4899']
  return palette[index % palette.length]
}

const IconX = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)

export function ExcursionesClient({ tours, categories, currentParams }: {
  tours: ApiProduct[]
  categories: ApiCategory[]
  currentParams: Record<string, string | undefined>
}) {
  const t      = useTranslations('catalog')
  const router = useRouter()

  const [search, setSearch]     = useState(currentParams.q ?? '')
  const [priceIdx, setPriceIdx] = useState(0)
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/wishlist')
      .then(r => r.ok ? r.json() : { items: [] })
      .then(({ items }) => {
        if (Array.isArray(items)) setSavedSlugs(new Set(items.map((i: { tourSlug: string }) => i.tourSlug)))
      })
      .catch(() => {})
  }, [])
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
    setSearch(''); setPriceIdx(0)
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

  const hasFilters = Object.values(currentParams).some(Boolean) || priceIdx > 0

  return (
    <div>
      {/* ── FILTER BAR ── */}
      <div className="sticky top-[104px] z-10 border-b border-dt-border bg-dt-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 py-2.5 flex-wrap">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-dt-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder={t('searchPlaceholder')} value={search}
                onChange={e => onSearch(e.target.value)}
                className="pl-7 pr-3 py-1.5 rounded-lg text-[12px] focus:outline-none bg-dt-bg-2 text-dt-text placeholder:text-dt-text-3 border border-dt-border focus:border-accent/40 transition-colors w-[160px]" />
            </div>

            {/* Price */}
            <select value={priceIdx} onChange={e => setPriceIdx(Number(e.target.value))}
              className="py-1.5 px-2 rounded-lg text-[11px] focus:outline-none bg-dt-bg-2 border border-dt-border cursor-pointer"
              style={{ color: priceIdx > 0 ? 'var(--color-accent)' : 'var(--color-text-3)' }}>
              {PRICE_OPTS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
            </select>

            {/* Sort */}
            <select value={currentParams.sort ?? ''} onChange={e => setParam('sort', e.target.value || undefined)}
              className="py-1.5 px-2 rounded-lg text-[11px] focus:outline-none bg-dt-bg-2 border border-dt-border text-dt-text-3 hidden sm:block cursor-pointer">
              <option value="">{t('sortFeatured')}</option>
              <option value="price-asc">{t('sortPriceAsc')}</option>
              <option value="price-desc">{t('sortPriceDesc')}</option>
            </select>

            {hasFilters && (
              <button onClick={clearAll} className="text-[11px] px-2 py-1.5 text-dt-text-3 hover:text-dt-text transition-colors flex items-center gap-1">
                <IconX /> {t('clearFilters')}
              </button>
            )}

            <span className="ml-auto text-[11px] font-semibold px-2 py-1 rounded-full bg-dt-bg-2 border border-dt-border text-dt-text-3 tabular-nums">
              {visibleTours.length} {visibleTours.length === 1 ? 'tour' : 'tours'}
            </span>
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2.5">
            <button onClick={() => setParam('cat', undefined)}
              className="shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all"
              style={!currentParams.cat
                ? { background: 'var(--color-accent)', color: '#fff' }
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

      {/* ── GRID ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {visibleTours.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-dt-text-2 text-sm mb-4">{t('noToursFilter')}</p>
            <button onClick={clearAll}
              className="text-sm font-bold text-accent hover:underline">
              {t('clearAll')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visibleTours.map(t => (
              <TourCard
                key={t.id}
                tour={t}
                initialSaved={savedSlugs.has(t.slug)}
                onSaveToggle={(slug, isSaved) => setSavedSlugs(prev => {
                  const next = new Set(prev)
                  if (isSaved) next.add(slug); else next.delete(slug)
                  return next
                })}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}