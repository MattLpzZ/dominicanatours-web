export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { fetchApi } from '@/lib/api'
import { TourCard } from '@/components/catalog/TourCard'
import { HeroSearch } from '@/components/ui/HeroSearch'
import type { ApiProduct, ApiCategory } from '@/components/catalog/ExcursionesClient'
import type { Metadata } from 'next'
import { getSiteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Dominicana Tour | Operadora Turistica Oficial',
  description: 'Operadora turistica oficial en Republica Dominicana. Excursiones autenticas con guias certificados, grupos pequenos y transporte puerta a puerta.',
}

interface ZoneData { name: string; count: number; image: string | null }

function OrganizationLd() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'TouristInformationCenter',
        name: 'Dominicana Tour',
        url: 'https://dominicanatour.com',
        description: 'Operadora turistica oficial en Republica Dominicana.',
        address: { '@type': 'PostalAddress', addressCountry: 'DO' },
        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '820' },
      }),
    }} />
  )
}

async function getData() {
  try {
    const res = await fetchApi<{ data: { products: ApiProduct[]; categories: ApiCategory[] } }>('/catalog')
    const { products, categories } = res.data

    // Group products by zone — pick first cover image per zone
    const zoneMap = new Map<string, ZoneData>()
    products.forEach(p => {
      if (!p.departure_zone) return
      const z = zoneMap.get(p.departure_zone)
      if (!z) zoneMap.set(p.departure_zone, { name: p.departure_zone, count: 1, image: p.cover_image })
      else { z.count++; if (!z.image && p.cover_image) z.image = p.cover_image }
    })
    const zones: ZoneData[] = [...zoneMap.values()].sort((a, b) => b.count - a.count)

    // Ranking: featured first, then by price desc
    const ranking = [...products]
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || Number(b.price_adult) - Number(a.price_adult))
      .slice(0, 10)

    // Highlights: featured tours for the attr grid
    const featured = products.filter(p => p.featured)
    const highlights = featured.length >= 4 ? featured : products.slice(0, 8)

    return { categories, zones, ranking, highlights }
  } catch {
    return { categories: [] as ApiCategory[], zones: [] as ZoneData[], ranking: [] as ApiProduct[], highlights: [] as ApiProduct[] }
  }
}

function ZoneInitials({ name }: { name: string }) {
  const words = name.split(' ').filter(Boolean)
  const initials = words.length >= 2 ? words[0][0] + words[1][0] : name.slice(0, 2)
  // Deterministic color from name
  const colors = ['#0369a1','#0891b2','#1d4ed8','#15803d','#b45309','#7c3aed','#be185d','#0f766e']
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl" style={{ background: colors[idx] }}>
      {initials.toUpperCase()}
    </div>
  )
}

function CatInitials({ name }: { name: string }) {
  const colors = ['#0369a1','#0891b2','#1d4ed8','#15803d','#b45309','#7c3aed','#be185d','#0f766e','#c2410c']
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div className="w-full h-full rounded-[10px] flex items-center justify-center text-white text-sm font-black" style={{ background: colors[idx] }}>
      {name[0].toUpperCase()}
    </div>
  )
}

export default async function LandingPage() {
  const [{ categories, zones, ranking, highlights }, config] = await Promise.all([getData(), getSiteConfig()])

  return (
    <>
      <OrganizationLd />

      {/* ── HERO ── */}
      <section className="dt-sec px-4 sm:px-6 py-20 sm:py-24 text-center">
        <div className="max-w-[640px] mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-dt-text-3 mb-[18px]">
            República Dominicana · Operadora oficial
          </p>
          <h1
            className="font-display font-extrabold text-[clamp(32px,4.8vw,54px)] leading-[1.08] tracking-[-0.03em] text-dt-text mb-[14px]"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {config.hero_title || 'Experiencias por las que vale la pena viajar'}
          </h1>
          <p className="text-base text-dt-text-3 mb-[34px] max-w-[440px] mx-auto leading-relaxed">
            {config.hero_subtitle || 'Descubre la República Dominicana con guías locales certificados.'}
          </p>
          <HeroSearch />
        </div>
      </section>

      {/* ── DESTINOS — horizontal scroll ── */}
      {zones.length > 0 && (
        <section className="dt-sec py-[52px]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
            <div className="flex items-end justify-between gap-3 mb-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1.5">Destinos</p>
                <h2 className="text-[22px] font-extrabold tracking-[-0.022em] leading-[1.2] text-dt-text">Actividades dondequiera que vayas</h2>
              </div>
              <Link href="/excursiones" className="text-[13px] font-semibold text-accent hover:opacity-75 transition-opacity whitespace-nowrap hidden sm:block">
                Ver todos →
              </Link>
            </div>

            {/* Scroll with fade edges */}
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-dt-surface to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-dt-surface to-transparent z-10 pointer-events-none" />
              <div className="flex gap-3.5 overflow-x-auto scrollbar-none pb-2 px-1" style={{ scrollSnapType: 'x mandatory' }}>
                {zones.map(zone => (
                  <Link
                    key={zone.name}
                    href={`/excursiones?zone=${encodeURIComponent(zone.name)}`}
                    className="group flex-shrink-0 cursor-pointer"
                    style={{ scrollSnapAlign: 'start', width: '176px' }}
                  >
                    <div className="relative rounded-lg overflow-hidden bg-dt-bg-2 mb-2.5" style={{ width: '176px', height: '176px' }}>
                      {zone.image ? (
                        <Image src={zone.image} alt={zone.name} fill className="object-cover transition-transform duration-[400ms] group-hover:scale-[1.07]" />
                      ) : (
                        <ZoneInitials name={zone.name} />
                      )}
                    </div>
                    <p className="text-[14px] font-bold text-dt-text mb-0.5 transition-colors group-hover:text-accent">{zone.name}</p>
                    <p className="text-[12px] text-dt-text-3">{zone.count} {zone.count === 1 ? 'tour' : 'tours'}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORÍAS ── */}
      {categories.length > 0 && (
        <section className="dt-sec py-[52px] px-4 sm:px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="mb-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1.5">Experiencias</p>
              <h2 className="text-[22px] font-extrabold tracking-[-0.022em] leading-[1.2] text-dt-text">¿Qué tipo de experiencia buscas?</h2>
            </div>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))' }}>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/excursiones?cat=${cat.slug}`}
                  className="flex flex-col items-center gap-2.5 p-[18px_12px] rounded-lg text-center border border-dt-border bg-dt-surface transition-[border-color,background,transform,box-shadow] duration-200 hover:border-accent/30 hover:-translate-y-[3px] hover:shadow-[0_4px_14px_rgba(232,93,32,0.08)] hover:bg-dt-bg-2"
                >
                  <div className="w-11 h-11">
                    <CatInitials name={cat.name} />
                  </div>
                  <p className="text-[12px] font-semibold leading-[1.3] text-dt-text-2">{cat.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── RANKING ── */}
      {ranking.length > 0 && (
        <section className="dt-sec py-[52px] px-4 sm:px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-end justify-between gap-3 mb-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1.5">Las más elegidas</p>
                <h2 className="text-[22px] font-extrabold tracking-[-0.022em] leading-[1.2] text-dt-text">Actividades más populares</h2>
              </div>
              <Link href="/excursiones" className="text-[13px] font-semibold text-accent hover:opacity-75 transition-opacity whitespace-nowrap hidden sm:block">
                Ver todas →
              </Link>
            </div>
            <div className="flex flex-col">
              {ranking.map((tour, i) => (
                <Link
                  key={tour.id}
                  href={`/excursiones/${tour.slug}`}
                  className="group grid items-center gap-4 py-[15px] px-3 border-b border-dt-border rounded-[5px] -mx-3 transition-colors hover:bg-dt-bg-2"
                  style={{ gridTemplateColumns: '28px 60px 1fr auto', borderTop: i === 0 ? '1px solid var(--color-border)' : undefined }}
                >
                  <span className="text-[14px] font-black text-dt-text-3 text-right tabular-nums group-hover:text-accent transition-colors">
                    {i + 1}
                  </span>
                  <div className="w-[60px] h-[60px] rounded-[5px] overflow-hidden bg-dt-bg-2 shrink-0">
                    {tour.cover_image ? (
                      <Image src={tour.cover_image} alt={tour.name} width={60} height={60}
                        className="w-full h-full object-cover transition-transform duration-[350ms] group-hover:scale-[1.06]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-dt-text-3 text-lg font-bold">
                        {tour.category?.name?.[0] ?? '?'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-dt-text mb-1 line-clamp-1">{tour.name}</p>
                    <div className="flex items-center gap-1.5 flex-wrap text-[12px] text-dt-text-3">
                      {tour.departure_zone && <span>{tour.departure_zone}</span>}
                      {tour.departure_zone && tour.category && <span className="text-dt-border-2">·</span>}
                      {tour.category && <span>{tour.category.name}</span>}
                      <span className="text-dt-border-2">·</span>
                      <span className="flex items-center gap-0.5">
                        <svg className="w-[11px] h-[11px] fill-[#F79009]" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        4.9 <span>(200+)</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-dt-text-3 mb-0.5">Desde</p>
                    <p className="text-[15px] font-extrabold tabular-nums text-dt-text">${Number(tour.price_adult).toFixed(0)} <span className="text-xs font-normal text-dt-text-3">USD</span></p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ATRACCIONES — TourCard grid ── */}
      {highlights.length > 0 && (
        <section className="dt-sec py-[52px] px-4 sm:px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-end justify-between gap-3 mb-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1.5">Atracciones</p>
                <h2 className="text-[22px] font-extrabold tracking-[-0.022em] leading-[1.2] text-dt-text">Que no te puedes perder</h2>
              </div>
              <Link href="/excursiones" className="text-[13px] font-semibold text-accent hover:opacity-75 transition-opacity whitespace-nowrap hidden sm:block">
                Ver todas →
              </Link>
            </div>
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {highlights.map(t => <TourCard key={t.id} tour={t} />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
