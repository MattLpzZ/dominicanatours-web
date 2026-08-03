export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { fetchApi } from '@/lib/api'
import { TourCard } from '@/components/catalog/TourCard'
import type { ApiProduct, ApiCategory } from '@/components/catalog/ExcursionesClient'
import type { Metadata } from 'next'
import { getSiteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Dominicana Tour | Operadora Turistica Oficial',
  description: 'Operadora turistica oficial en Republica Dominicana. Mas de 20 excursiones autenticas con guias certificados, grupos pequenos y transporte puerta a puerta.',
}

function OrganizationLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'TouristInformationCenter',
          name: 'Dominicana Tour',
          url: 'https://dominicanatour.com',
          logo: 'https://dominicanatour.com/logo.svg',
          description: 'Operadora turistica oficial en Republica Dominicana. Excursiones con guias locales certificados.',
          address: { '@type': 'PostalAddress', addressCountry: 'DO' },
          priceRange: '$$',
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '820' },
        }),
      }}
    />
  )
}

async function getData() {
  try {
    const res = await fetchApi<{ data: { products: ApiProduct[]; categories: ApiCategory[] } }>('/catalog')
    const { products, categories } = res.data
    const zones = [...new Set(
      products.map(p => p.departure_zone).filter((z): z is string => Boolean(z))
    )].slice(0, 12)
    const zoneCounts: Record<string, number> = {}
    products.forEach(p => { if (p.departure_zone) zoneCounts[p.departure_zone] = (zoneCounts[p.departure_zone] ?? 0) + 1 })
    return { products, categories, zones, zoneCounts }
  } catch {
    return { products: [] as ApiProduct[], categories: [] as ApiCategory[], zones: [] as string[], zoneCounts: {} as Record<string, number> }
  }
}

export default async function LandingPage() {
  const [{ products, categories, zones, zoneCounts }, config] = await Promise.all([getData(), getSiteConfig()])
  const heroCtaUrl = config.hero_cta_url || '/excursiones'
  const featured = products.filter(p => p.featured)
  const allTours = featured.length >= 4 ? featured : products.slice(0, 8)

  return (
    <>
      <OrganizationLd />

      {/* ── HERO ── */}
      <section className="dt-sec py-20 sm:py-24 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-dt-text-3 mb-5">
            República Dominicana · Operadora oficial
          </p>
          <h1 className="font-display font-bold text-[clamp(32px,5vw,54px)] leading-[1.08] tracking-[-0.03em] text-dt-text mb-4" style={{ textWrap: 'balance' } as React.CSSProperties} data-dt-key="hero_title">
            {config.hero_title || 'Experiencias por las que vale la pena viajar'}
          </h1>
          <p className="text-dt-text-3 text-base sm:text-[17px] mb-8 max-w-md mx-auto leading-relaxed" data-dt-key="hero_subtitle">
            {config.hero_subtitle || 'Descubre la República Dominicana con guías locales certificados.'}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href={heroCtaUrl}
              className="inline-flex items-center gap-2 bg-accent text-white font-bold text-sm px-7 py-3 rounded-lg hover:bg-accent/90 active:scale-95 transition-all"
            >
              {config.hero_cta || 'Ver excursiones'}
            </Link>
            <a
              href={`https://wa.me/${config.wa_number || '18095550100'}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-dt-border text-dt-text-2 font-semibold text-sm px-6 py-3 rounded-lg hover:bg-dt-bg-2 transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366] shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── EXCURSIONES ── */}
      {allTours.length > 0 && (
        <section className="dt-sec py-14 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between gap-3 mb-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1.5">Las más elegidas</p>
                <h2 className="text-[22px] font-extrabold tracking-[-0.022em] leading-[1.2] text-dt-text">Excursiones populares</h2>
              </div>
              <Link href="/excursiones" className="text-[13px] font-semibold text-accent hover:opacity-75 transition-opacity whitespace-nowrap">
                Ver todas →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {allTours.map(t => <TourCard key={t.id} tour={t} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORÍAS ── */}
      {categories.length > 0 && (
        <section className="dt-sec py-14 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1.5">Experiencias</p>
              <h2 className="text-[22px] font-extrabold tracking-[-0.022em] leading-[1.2] text-dt-text">¿Qué tipo de experiencia buscas?</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/excursiones?cat=${cat.slug}`}
                  className="flex flex-col items-center gap-2.5 p-4 rounded-lg text-center border border-dt-border bg-dt-surface cursor-pointer transition-[border-color,background,transform,box-shadow] duration-200 hover:border-accent/30 hover:-translate-y-[3px] hover:shadow-[0_4px_14px_rgba(232,93,32,0.08)] hover:bg-dt-bg-2"
                >
                  <div className="w-11 h-11 rounded-[10px] bg-dt-bg-2 flex items-center justify-center text-[21px]">
                    {cat.icon}
                  </div>
                  <p className="text-[12px] font-semibold leading-[1.3] text-dt-text-2">{cat.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── DESTINOS ── */}
      {zones.length > 0 && (
        <section className="dt-sec py-14 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between gap-3 mb-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1.5">Destinos</p>
                <h2 className="text-[22px] font-extrabold tracking-[-0.022em] leading-[1.2] text-dt-text">Donde operamos</h2>
              </div>
              <Link href="/excursiones" className="text-[13px] font-semibold text-accent hover:opacity-75 transition-opacity whitespace-nowrap hidden sm:block">
                Ver todas →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {zones.map(zone => (
                <Link
                  key={zone}
                  href={`/excursiones?zone=${encodeURIComponent(zone)}`}
                  className="group flex items-center justify-between p-4 border border-dt-border rounded-lg transition-[transform,box-shadow,border-color] duration-200 hover:border-[var(--color-border-2)] hover:-translate-y-[3px] hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-dt-text text-sm leading-tight truncate">{zone}</p>
                    {zoneCounts[zone] && (
                      <p className="text-dt-text-3 text-xs mt-0.5">{zoneCounts[zone]} {zoneCounts[zone] === 1 ? 'tour' : 'tours'}</p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-dt-border group-hover:text-dt-text-3 transition-colors shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
